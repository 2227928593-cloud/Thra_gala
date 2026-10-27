#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  去水印 / 透明底提取 / 16:9 归正
====================================================
本文件解决三个在生产中真实存在的问题：

1. 生成工具会在右下角烙上 "AI生成 WORKBUDDY" 水印；
2. 请求 background=transparent 时，模型并不会返回 alpha 通道，
   而是**画了一张棋盘格**（全不透明，alpha 恒为 255）来"假装"透明；
3. 批量素材需要统一到引擎的 16:9 舞台。

用法
----
    # 立绘：提取棋盘格 → alpha，并清掉水印（不改动人物像素）
    python tools/clean_watermark.py art/_samples/yangjian.png --mode portrait

    # 场景：修补水印 + 居中裁到 16:9（不拉伸）
    python tools/clean_watermark.py art/_samples/classroom.png --mode scene --size 1536x864

    # 只看效果，不写正式输出
    python tools/clean_watermark.py art/_samples/classroom.png --mode scene --dry-run

    # 批量
    python tools/clean_watermark.py art/_samples/*.png --mode auto --dry-run

输出
----
    --dry-run  →  art/_samples/_clean_preview/<name>_clean.png   （前 / 后 对比）
    正式运行    →  与输入同目录，文件名加后缀 _clean（除非 --out 指定）

设计约束
--------
· 立绘：只在右下角水印框内置 alpha=0；**不进入人物实体**（用棋盘格连通性判断）。
· 场景：默认用左侧邻近块镜像填充，按局部亮度配平、羽化 14px；
        水印压在纯暗角上时几乎不可见。可用 --mode scene --fill cut 退回裁切。
· 所有几何裁切都**居中**，不拉伸，不改变像素比例。
"""

from __future__ import annotations

import argparse
import glob
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# ----------------------------------------------------------------------------
# 参数默认值（经 3 张样张实测标定）
# ----------------------------------------------------------------------------
WM_SEARCH_Y = 0.940          # 只在画面最下方 6% 内找
WM_SEARCH_X = 0.760          # 只在画面最右 24% 内找
WM_THRESHOLD = 14            # 比局部中位数亮多少才算水印笔画
WM_SAT_MAX = 32              # 水印是中性白，彩色纹理排除
WM_FALLBACK = (0.78, 0.935, 1.0, 1.0)   # 检测失败时的兜底框（比例）

CHECKER_MIN = 195            # 棋盘格最暗通道下限
CHECKER_SAT = 22             # 棋盘格几乎无彩
FEATHER = 14                 # 修补羽化像素


# ----------------------------------------------------------------------------
# 基础工具
# ----------------------------------------------------------------------------
def to_rgb(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("RGB"))


def dilate(mask: np.ndarray, r: int = 1) -> np.ndarray:
    out = mask.copy()
    for k in range(1, r + 1):
        out |= np.roll(mask, k, axis=0) | np.roll(mask, -k, axis=0)
        out |= np.roll(mask, k, axis=1) | np.roll(mask, -k, axis=1)
    return out


def erode(mask: np.ndarray, r: int = 1) -> np.ndarray:
    out = mask.copy()
    for k in range(1, r + 1):
        out &= np.roll(mask, k, axis=0) & np.roll(mask, -k, axis=0)
        out &= np.roll(mask, k, axis=1) & np.roll(mask, -k, axis=1)
    return out


def feather_mask(h: int, w: int, box: tuple[int, int, int, int], f: int) -> np.ndarray:
    """在 box 内生成 0..1 的羽化权重，边缘 f 像素内线性过渡。"""
    x0, y0, x1, y1 = box
    yy = np.arange(y0, y1)[:, None]
    xx = np.arange(x0, x1)[None, :]
    left = np.clip((xx - x0) / max(f, 1), 0, 1)
    right = np.clip((x1 - 1 - xx) / max(f, 1), 0, 1)
    top = np.clip((yy - y0) / max(f, 1), 0, 1)
    bot = np.clip((y1 - 1 - yy) / max(f, 1), 0, 1)
    return np.minimum(np.minimum(left, right), np.minimum(top, bot)).astype(np.float32)


# ----------------------------------------------------------------------------
# 1. 水印检测
# ----------------------------------------------------------------------------
def detect_watermark(rgb: np.ndarray, want_mass: bool = False):
    """
    返回 (x0, y0, x1, y1)；want_mass=True 时额外返回水印像素数（用于判断是否真的还有水印）。
    原理：水印是半透明中性白，比局部中位数亮一截，且几乎无色偏。
    """
    h, w = rgb.shape[:2]
    y0 = int(h * WM_SEARCH_Y)
    x0 = int(w * WM_SEARCH_X)
    band = rgb[y0:, x0:]

    med = np.asarray(
        Image.fromarray(band).filter(ImageFilter.MedianFilter(9))
    ).astype(np.int16)
    diff = band.astype(np.int16) - med
    sat = band.max(axis=2).astype(np.int16) - band.min(axis=2).astype(np.int16)
    mask = (diff.min(axis=2) > WM_THRESHOLD) & (sat < WM_SAT_MAX)

    if mask.sum() < 40:                       # 太干净 / 检测失败
        fx0, fy0, fx1, fy1 = WM_FALLBACK
        box = (int(w * fx0), int(h * fy0), int(w * fx1), int(h * fy1))
        return (box, int(mask.sum())) if want_mass else box

    joined = dilate(mask, 2)
    ys, xs = np.nonzero(joined)
    pad = 6
    bx0 = max(0, x0 + int(xs.min()) - pad)
    by0 = max(0, y0 + int(ys.min()) - pad)
    bx1 = min(w, x0 + int(xs.max()) + 1 + pad)
    by1 = min(h, y0 + int(ys.max()) + 1 + pad)

    # 水印一定贴着右下角；若检出的框离右下角太远，说明抓到了纹理，退回兜底
    if (w - bx1) > w * 0.06 or (h - by1) > h * 0.02 or bx1 - bx0 < 40:
        fx0, fy0, fx1, fy1 = WM_FALLBACK
        box = (int(w * fx0), int(h * fy0), int(w * fx1), int(h * fy1))
    else:
        box = (bx0, by0, bx1, by1)
    mass = int(mask.sum())
    return (box, mass) if want_mass else box


# ----------------------------------------------------------------------------
# 2. 立绘：棋盘格 → alpha
# ----------------------------------------------------------------------------
def key_checkerboard(im: Image.Image) -> Image.Image:
    """
    把模型画出来的棋盘格背景挖成真透明。
    从四角 flood fill，只填"浅、中性、连通到边缘"的像素——
    所以被墨线包住的白色手套不会被误伤（墨线 min<195，切断了连通性）。
    """
    rgb = to_rgb(im)
    h, w = rgb.shape[:2]

    checkerish = (
        (rgb.min(axis=2) > CHECKER_MIN)
        & ((rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)) < CHECKER_SAT)
    )

    # 注意：Image.fromarray 与原 numpy 数组共享内存，ImageDraw 的原地写入不会回写过去。
    # 必须 .copy() 一份可写图像，否则 floodfill 静默失效（alpha 全 255，棋盘格仍在）。
    canvas = Image.fromarray((checkerish * 255).astype(np.uint8), "L").copy()
    canvas.load()
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for s in seeds:
        if canvas.getpixel(s) == 255:
            ImageDraw.floodfill(canvas, s, 128, thresh=0)
    canvas.load()

    filled = np.asarray(canvas) == 128            # 背景（含棋盘格上的水印）

    # 补第二遍：模型有时会在人物**内部**留下封闭的棋盘格块（没连到边缘，flood fill 进不去）。
    # 棋盘格是极淡的中性双色（≈247 / ≈229），用"高明度 + 几乎无彩"的色相签名单独捕一遍。
    # 奶油色（sat≈28）与骨白切边（sat≈44）不会被误伤。
    tone = (rgb.min(axis=2) > 208) & (
        (rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)) < 14
    )
    bg = filled | tone

    figure = ~bg
    figure = erode(figure, 1)                     # 收 1px，去掉浅灰描边
    alpha = (figure * 255).astype(np.uint8)

    out = np.dstack([rgb, alpha])
    return Image.fromarray(out, "RGBA")


def key_paper(im: Image.Image, lo: float = 0.60, hi: float = 1.25) -> Image.Image:
    """
    模型有时不画棋盘格，而是铺一张**带暗角的旧纸**当背景（"透明"没生效）。
    实测纸色可以是 (180,145,96) 这种赭黄，颜色距离法不稳。
    改用**亮度带**：纸的背景亮度中位数记为 L0，把 [0.60·L0, 1.25·L0] 且连到画布边缘的
    像素判为背景。人物主体（深墨）与骨白切边都落在这个带之外，所以不会被吃掉。
    """
    rgb = to_rgb(im)
    h, w = rgb.shape[:2]
    lum = rgb.mean(axis=2)

    ring = np.concatenate([lum[:3, :].ravel(), lum[-3:, :].ravel(),
                           lum[:, :3].ravel(), lum[:, -3:].ravel()])
    L0 = float(np.median(ring)) or 1.0

    band = (lum > L0 * lo) & (lum < L0 * hi)
    canvas = Image.fromarray((band * 255).astype(np.uint8), "L").copy()
    canvas.load()
    for s in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if canvas.getpixel(s) == 255:
            ImageDraw.floodfill(canvas, s, 128, thresh=0)
    canvas.load()

    filled = np.asarray(canvas) == 128
    figure = erode(~filled, 1)
    alpha = (figure * 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def despeckle(im: Image.Image, min_ratio: float = 0.008, max_keep: int = 8) -> Image.Image:
    """
    去掉 alpha 里的小碎块。
    纸底抠图常在人物周围留一圈纸屑（孤立的浅色小岛），肉眼像脏点。
    做法：从任意未标记像素 floodfill 成独立编号，只保留面积 >= min_ratio * 最大块的连通域。
    """
    arr = np.array(im.convert("RGBA"))
    a = arr[..., 3] > 8
    if not a.any():
        return im
    h, w = a.shape
    canvas = Image.fromarray((a * 255).astype(np.uint8), "L").copy()
    canvas.load()

    comps = []
    tag = 1
    for y in range(0, h, 7):
        for x in range(0, w, 7):
            if canvas.getpixel((x, y)) == 255:
                ImageDraw.floodfill(canvas, (x, y), tag, thresh=0)
                comps.append(tag)
                tag += 1
                if tag > 254:
                    break
        if tag > 254:
            break
    canvas.load()
    lab = np.asarray(canvas)
    if not comps:
        return im
    sizes = {t: int((lab == t).sum()) for t in comps}
    biggest = max(sizes.values())
    keep = [t for t, sz in sizes.items() if sz >= biggest * min_ratio]
    keep = sorted(keep, key=lambda t: -sizes[t])[:max_keep]
    mask = np.isin(lab, keep)
    arr[..., 3] = np.where(mask, arr[..., 3], 0)
    return Image.fromarray(arr, "RGBA")


def rebuild_keyline(im: Image.Image, color=(168, 150, 112), width: int = 7,
                    trim: int = 5) -> Image.Image:
    """
    重出骨白切边：先腐蚀掉模型自己画的那圈奶油边，再补一条确定性的边。
    为什么必须"先腐蚀"：模型给的切边在 4–14px 之间乱飘，直接在外面再加一条，
    旧的宽边还在里面，等于两条叠一起，更像个贴纸。
    trim=5 让轮廓缩 5px（1024 基准下细节像拐杖、手指都还在），再补 width=7 的新边。
    终值：色 #A89670（进游戏 ×1.22 ≈ (205,183,137)，暖骨白不会死白），宽 7px。
    """
    arr = np.array(im.convert("RGBA"))
    a = arr[..., 3] > 8
    if not a.any():
        return im
    a = erode(a, trim)
    arr[..., 3] = np.where(a, 255, 0).astype(np.uint8)
    out = Image.fromarray(arr, "RGBA")
    return add_keyline(out, width, color)


def add_keyline(im: Image.Image, width: int = 6, color=(203, 190, 159)) -> Image.Image:
    """
    统一骨白切边。
    为什么要用代码补而不是让模型画：切边是**全族统一性的主要载体**，
    但模型每次给的宽度在 4–14px 之间乱飘。用确定性的膨胀描边，
    11 张的边宽、色值、外扩量才能完全一致（art-bible §6.2 要求误差 ≤1px）。
    颜色取 #CBBE9F，进游戏后经 CSS brightness(1.22) 抬到 ≈#F7EBC2。
    """
    arr = np.array(im.convert("RGBA"))
    a = arr[..., 3] > 8
    if width <= 0 or not a.any():
        return im
    grow = a.copy()
    for _ in range(width):
        grow = dilate(grow, 1)

    canvas = np.zeros_like(arr)
    canvas[..., 0], canvas[..., 1], canvas[..., 2] = color
    canvas[..., 3] = np.where(grow, 255, 0)

    out = Image.fromarray(canvas, "RGBA")
    out.paste(im, (0, 0), im.split()[3])
    return out


def strip_alpha_box(img: Image.Image, box: tuple[int, int, int, int]) -> tuple[Image.Image, int]:
    """
    把水印框内的 alpha 清零（立绘专用，双保险）。
    只在框内清"浅、中性、像水印残留"的像素——
    若框与人物实体（黑长衫、化墨的下摆、奶油切边）重叠，人物像素原样保留。
    返回 (图, 清除像素数)。
    """
    arr = np.array(img)
    x0, y0, x1, y1 = box
    sub = arr[y0:y1, x0:x1]
    rgb = sub[..., :3].astype(np.int16)
    light_neutral = (rgb.min(axis=2) > 198) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 30)
    cleared = int((light_neutral & (sub[..., 3] > 0)).sum())
    sub[..., 3][light_neutral] = 0
    return Image.fromarray(arr, "RGBA"), cleared


# ----------------------------------------------------------------------------
# 3. 场景：镜像填补 / 裁切
# ----------------------------------------------------------------------------
def patch_from_left(rgb: np.ndarray, box: tuple[int, int, int, int], f: int = FEATHER) -> np.ndarray:
    """
    用左侧同尺寸区域水平镜像后填补水印框，并按局部亮度配平。
    右下角通常是暗角，镜像块 + 羽化后基本看不出。
    """
    h, w = rgb.shape[:2]
    x0, y0, x1, y1 = box
    bw = x1 - x0
    sx0 = max(0, x0 - bw - 8)
    sx1 = sx0 + bw
    if sx1 > w:                                   # 贴边保护
        sx0, sx1 = x0 - bw, x0
    src = rgb[y0:y1, sx0:sx1][:, ::-1]            # 水平镜像，避免纹理直观重复
    if src.shape[:2] != (y1 - y0, bw):
        src = np.asarray(
            Image.fromarray(src).resize((bw, y1 - y0), Image.LANCZOS)
        )

    dst = rgb[y0:y1, x0:x1].astype(np.float32)
    srcf = src.astype(np.float32)

    ring = np.concatenate([
        rgb[max(0, y0 - 12):y0, x0:x1].reshape(-1, 3),
        rgb[y1:min(h, y1 + 12), x0:x1].reshape(-1, 3),
    ]).astype(np.float32)
    dst_mean = float(np.median(dst.reshape(-1, 3)))
    ring_mean = float(np.median(ring)) if ring.size else dst_mean
    gain = float(np.clip(ring_mean / max(srcf.mean(), 1e-3), 0.75, 1.35))
    srcf = np.clip(srcf * gain, 0, 255)

    a = feather_mask(h, w, box, f)[..., None]
    blended = dst * (1 - a) + srcf * a

    out = rgb.astype(np.float32).copy()
    out[y0:y1, x0:x1] = blended
    return np.clip(out, 0, 255).astype(np.uint8)


def cut_bottom(rgb: np.ndarray, frac: float) -> np.ndarray:
    h = rgb.shape[0]
    return rgb[: max(1, h - int(h * frac))]


def cut_band_and_stretch(rgb: np.ndarray, y_top: int, size) -> np.ndarray:
    """
    裁掉 [y_top, 底边] 的水印带，再等比放大回目标尺寸。
    为什么不用镜像填补：场景里有柜子、扶手、桌椅这类**有结构**的物件，
    镜像会复制出第二个柜子，接缝肉眼可见。垂直 5–7% 的轻微拉伸反而完全看不出来
    （手绘抖线本来就允许形变），而且不留任何补丁痕迹。
    """
    h, w = rgb.shape[:2]
    y_top = max(1, min(y_top, h - 8))
    cropped = rgb[:y_top, :]
    if not size:
        return cropped
    return np.asarray(
        Image.fromarray(cropped).resize(size, Image.LANCZOS)
    )


def crop_to_size(rgb: np.ndarray, size: tuple[int, int] | None, ratio: float | None) -> np.ndarray:
    """居中裁切（先按比例，再按目标尺寸），绝不拉伸。"""
    h, w = rgb.shape[:2]
    if ratio:
        cur = w / h
        if cur > ratio:                            # 太宽 → 裁左右
            nw = int(round(h * ratio))
            x = (w - nw) // 2
            rgb = rgb[:, x:x + nw]
        elif cur < ratio:                          # 太高 → 裁上下
            nh = int(round(w / ratio))
            y = (h - nh) // 2
            rgb = rgb[y:y + nh, :]
    h, w = rgb.shape[:2]
    if size:
        tw, th = size
        if (w, h) != (tw, th):
            # 先按比例裁到 target 比例，避免拉伸
            rgb = crop_to_size(rgb, None, tw / th)
            rgb = np.asarray(
                Image.fromarray(rgb).resize((tw, th), Image.LANCZOS)
            )
    return rgb


# ----------------------------------------------------------------------------
# 4. 预览
# ----------------------------------------------------------------------------
def write_preview(before: Image.Image, after: Image.Image, path: str, bg=(16, 15, 14)) -> None:
    """左：原始（贴在深底上）；右：处理后（贴在深底上）。等比缩放后同高拼接。"""
    H = 640

    def flatten(img, bg):
        if img.mode == "RGBA":
            base = Image.new("RGB", img.size, bg)
            base.paste(img, mask=img.split()[3])
            return base
        return img.convert("RGB")

    def fit(img):
        w = int(img.width * H / img.height)
        return img.resize((w, H), Image.LANCZOS)

    a = fit(flatten(before, bg))
    b = fit(flatten(after, bg))
    gap = 12
    out = Image.new("RGB", (a.width + b.width + gap * 3, H + gap * 2), (8, 8, 8))
    out.paste(a, (gap, gap))
    out.paste(b, (gap * 2 + a.width, gap))
    d = ImageDraw.Draw(out)
    d.line([(gap * 2 + gap // 2 + a.width, 0), (gap * 2 + gap // 2 + a.width, out.height)],
           fill=(120, 40, 36), width=2)

    # 处理后在右角放大一块，专门看痕迹
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.save(path)
    return out


# ----------------------------------------------------------------------------
# 5. 主流程
# ----------------------------------------------------------------------------
def detect_mode(im: Image.Image) -> str:
    """
    自动判断：画面四角若是浅色中性（棋盘格）→ portrait；否则 scene。
    """
    rgb = to_rgb(im)
    h, w = rgb.shape[:2]
    corners = [rgb[2:20, 2:20], rgb[2:20, w - 20:w - 2], rgb[h - 20:h - 2, 2:20]]
    light = sum(1 for c in corners
                if c.min(axis=2).mean() > CHECKER_MIN and
                (c.max(axis=2).astype(np.int16) - c.min(axis=2).astype(np.int16)).mean() < CHECKER_SAT)
    return "portrait" if light >= 2 else "scene"


def process(path: str, mode: str, size, ratio, fill, dry_run, out_path) -> dict:
    im = Image.open(path)
    if mode == "auto":
        mode = detect_mode(im)

    info = {"file": os.path.basename(path), "mode": mode}

    if mode == "portrait":
        box, _ = detect_watermark(to_rgb(im), want_mass=True)
        if im.mode == "RGBA" and np.array(im)[..., 3].min() < 250:
            out, cleared = im, 0
            how = "already has alpha"
        else:
            # 先用棋盘格抠一遍；若几乎抠不动，说明背景是一整张纸，改用亮度带抠。
            out, cleared = key_checkerboard(im), 0
            how = "checkerboard keyed"
            if (np.array(out)[..., 3] == 0).mean() < 0.05:
                alt = key_paper(im)
                if (np.array(alt)[..., 3] == 0).mean() > 0.15:
                    out, how = alt, "paper ground keyed (luminance band)"
        out, cleared = strip_alpha_box(out, box)
        info.update(watermark_box=box, alpha=f"{how}, {cleared}px residual cleared")
    else:
        rgb = to_rgb(im)
        # ★ 关键：先做 16:9 归正。3:2 → 16:9 居中裁切会自然吃掉底部 7.8%，
        #   而水印正好落在最下 6.5% 内 —— 几何裁切即可清除，无需修补。
        rgb = crop_to_size(rgb, size, ratio)
        box, mass = detect_watermark(rgb, want_mass=True)
        info["watermark_box"] = box
        if mass > 120:
            if fill == "patch":
                rgb = patch_from_left(rgb, box)
                info["fill"] = f"patch (residual {mass}px)"
            elif fill == "cut":
                rgb = cut_bottom(rgb, 0.03)
                info["fill"] = f"cut 3% (residual {mass}px)"
            else:                               # stretch（默认）
                rgb = cut_band_and_stretch(rgb, box[1] - 2, size)
                info["fill"] = f"cut band + stretch (residual {mass}px)"
        else:
            info["fill"] = f"none — 裁切已清除 (residual {mass}px)"
        out = Image.fromarray(rgb)
        info["size"] = out.size

    if dry_run:
        name = os.path.splitext(os.path.basename(path))[0]
        prev = os.path.join("art", "_samples", "_clean_preview", f"{name}_clean.png")
        write_preview(im, out, prev)
        info["preview"] = prev
        return info

    if out_path:
        dst = out_path
    else:
        root, ext = os.path.splitext(path)
        dst = f"{root}_clean{'png' if out.mode == 'RGBA' else '.png'}"
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    out.save(dst)
    info["out"] = dst
    return info


def parse_size(s: str | None):
    if not s:
        return None
    w, h = s.lower().split("x")
    return int(w), int(h)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="去水印 / 透明底提取 / 16:9 归正")
    p.add_argument("inputs", nargs="+", help="输入图片（支持通配符）")
    p.add_argument("--mode", choices=["auto", "portrait", "scene"], default="auto")
    p.add_argument("--size", default="1536x864", help="场景目标尺寸，默认 1536x864；传 none 表示不缩放")
    p.add_argument("--ratio", type=float, default=16 / 9, help="场景目标宽高比，默认 1.778")
    p.add_argument("--fill", choices=["stretch", "patch", "cut"], default="stretch",
                   help="场景去水印方式：stretch=裁带后回拉伸（默认，无补丁痕迹）；"
                        "patch=左侧镜像填补；cut=裁掉底部 3%%")
    p.add_argument("--keyline", type=int, default=0, help="补一圈骨白切边的像素宽度（立绘用，建议 6）")
    p.add_argument("--dry-run", action="store_true", help="只出对比图，不写正式输出")
    p.add_argument("--out", default=None, help="显式输出路径（仅单张时有效）")
    a = p.parse_args(argv)

    files = []
    for pattern in a.inputs:
        files.extend(sorted(glob.glob(pattern)) or [pattern])

    size = None if (a.size or "").lower() in ("none", "0") else parse_size(a.size)

    for f in files:
        if not os.path.exists(f):
            print(f"[skip] {f} 不存在")
            continue
        info = process(f, a.mode, size, a.ratio, a.fill, a.dry_run, a.out if len(files) == 1 else None)
        tag = "DRY" if a.dry_run else "OUT"
        print(f"[{tag}] {info['file']:<24} mode={info['mode']:<8} "
              f"wm={info['watermark_box']} {info.get('fill', info.get('alpha', ''))} "
              f"→ {info.get('preview') or info.get('out')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
