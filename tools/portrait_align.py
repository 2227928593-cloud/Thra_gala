#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  立绘眼线归一化
====================================
问题
----
一批立绘如果各自构图，眼线会在画布上上下乱飘（实测 laoren 19% / zhouzheng 22% /
yangjian 27%）。游戏里同屏并排时，三个人的"机位高度"就不一致——观众说不出哪里怪，
但会觉得"这几张不是一套"。

做法
----
把每张立绘绕**底边**缩放，使眼线精确落在画布 22% 处：

    s = 0.78·H / (H − eye_y)      ；眼线在缩放后位于 y = 0.22·H

为什么绕底边缩放而不是加留白：
  · 加留白不改变人物大小，眼线能对齐，但头部大小仍不统一；
  · 绕底边缩放会同时把"头到画面底"的距离统一，等于统一了机位；
  · 缩放比例只有 ±7%，对手绘线宽的影响远小于 CSS 的 brightness。
底边与 CSS 的 `.sprite{ bottom:0 }` 对齐，所以缩放后入场位置不变。

眼线怎么找
----------
`--auto` 用轮廓宽度剖面：先找到头顶（第一行有实体），再找头部最大宽度，
再找它之后第一次收窄到 62% 以下的位置 = 颈部；眼线 ≈ 头顶 + 58% 的头高。
橡皮管风格脖子长而细，这个特征非常稳。
如果某张自动测偏，用 `--eye-y 0.19` 手填（支持逐张）。

用法
----
    python tools/portrait_align.py art/_samples/laoren.png            # 原地覆盖
    python tools/portrait_align.py in.png --out out.png --target 0.22
    python tools/portrait_align.py in.png --eye-y 0.19 --guide         # 带 22% 参考线，只出预览
"""

from __future__ import annotations

import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw


# ---------------------------------------------------------------------------
def alpha_mask(img: Image.Image) -> np.ndarray:
    if img.mode == "RGBA":
        return np.asarray(img)[..., 3] > 8
    # 兜底：没有 alpha 就按"非近白"当实体
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    return ~((a.min(axis=2) > 205) & ((a.max(axis=2) - a.min(axis=2)) < 18))


def estimate_eye_y(mask: np.ndarray) -> tuple[float, dict]:
    """返回 (eye_y 像素, 诊断信息)。"""
    h, w = mask.shape
    row = mask.sum(axis=1).astype(np.float32)
    if row.max() <= 0:
        raise ValueError("空图：没有实体像素")

    # 头顶：第一行实体宽度超过最大宽度的 2%
    top = int(np.argmax(row > row.max() * 0.02))

    # 头部最大宽度（只在头顶以下 45% 高度内找）
    y_hi = min(h, top + int(h * 0.45))
    head_max = float(row[top:y_hi].max())
    head_max_y = top + int(np.argmax(row[top:y_hi]))

    # 颈部：头部最大宽度之后，第一次收窄到 62% 以下
    neck = None
    for y in range(head_max_y, y_hi):
        if row[y] < head_max * 0.62:
            # 连续 3 行都窄才算脖子，避免噪声
            if all(row[min(y + k, h - 1)] < head_max * 0.70 for k in range(3)):
                neck = y
                break
    if neck is None:                                # 找不到脖子 → 用比例兜底
        neck = top + int((y_hi - top) * 0.75)

    eye_y = top + 0.58 * (neck - top)
    return eye_y, {"top": top, "neck": neck, "head_w": head_max,
                   "eye_ratio": eye_y / h, "fallback": neck is None}


# ---------------------------------------------------------------------------
def align(img: Image.Image, eye_y_px: float, target: float = 0.22,
          max_scale: float = 1.30) -> tuple[Image.Image, float]:
    """
    眼线定位。
    关键是：**只平移，不缩放**（除非头顶会出画）。
    老思路"绕底边缩放"是错的——立绘头大，靠缩放对齐会把头顶顶出画面，
    而且缩放会改变线宽观感。平移则完全不动物体的物理尺寸，
    溢出的只是下半身，而 CSS 本来就把底部 22% 渐隐掉了。
    """
    w, h = img.size

    m = alpha_mask(img)
    ys, xs = np.nonzero(m)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    fig = img.crop(box)
    fw, fh = fig.size

    eye_in_fig = max(1.0, eye_y_px - box[1])

    # 默认 s=1（不缩放）；仅当头部会越过画布顶端时才缩小
    s = min(1.0, (target * h) / eye_in_fig)
    s = float(np.clip(s, 1.0 / max_scale, 1.0))

    nw, nh = max(1, int(round(fw * s))), max(1, int(round(fh * s)))
    if nw > w:                                     # 宽度保护
        k = w / nw
        nw, nh, s = w, max(1, int(round(nh * k))), s * k
    fig = fig.resize((nw, nh), Image.LANCZOS)

    cx_ratio = (box[0] + box[2]) / 2 / w
    px = int(round(cx_ratio * w - nw / 2))
    px = max(0, min(w - nw, px))

    py = int(round(target * h - eye_in_fig * s))
    py = max(0, py)                                # 头顶优先，绝不切头

    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(fig, (px, py), fig if fig.mode == "RGBA" else None)
    return canvas, s


def guide(img: Image.Image, target: float = 0.22, eye_px: float | None = None) -> Image.Image:
    """预览：在深底上画出目标眼线（红）与实测眼线（青）。"""
    base = Image.new("RGB", img.size, (20, 18, 16))
    if img.mode == "RGBA":
        base.paste(img, mask=img.split()[3])
    else:
        base.paste(img.convert("RGB"))
    d = ImageDraw.Draw(base)
    y = int(img.height * target)
    d.line([(0, y), (img.width, y)], fill=(200, 52, 44), width=3)
    if eye_px is not None:
        d.line([(0, int(eye_px)), (img.width, int(eye_px))], fill=(70, 150, 160), width=2)
    return base


# ---------------------------------------------------------------------------
def main(argv=None):
    p = argparse.ArgumentParser(description="立绘眼线归一化")
    p.add_argument("inputs", nargs="+")
    p.add_argument("--out", default=None)
    p.add_argument("--target", type=float, default=0.22)
    p.add_argument("--eye-y", type=float, default=None,
                   help="手动指定眼线（画布高度比例，如 0.19）；不给则自动测")
    p.add_argument("--guide", action="store_true", help="只输出带参考线的预览，不写正式文件")
    p.add_argument("--preview-dir", default="art/_samples/_diag")
    a = p.parse_args(argv)

    for f in a.inputs:
        if not os.path.exists(f):
            print(f"[skip] {f}")
            continue
        img = Image.open(f)
        eye, info = estimate_eye_y(alpha_mask(img))
        first_eye = eye

        if a.eye_y is not None:
            eye = a.eye_y * img.height
            out, s = align(img, eye, a.target)
            eye_after = (img.height - (img.height - eye) * s) / img.height
        else:
            # 估计器本身有固定偏置（它测的是眉眼上缘，不是瞳孔中心），
            # 单次缩放只能消掉一部分误差。所以迭代到"估计器读数 == target"为止，
            # 通常 2 轮收敛（<0.5%）。全族用同一个代理指标，统一性就成立。
            cur, s_total, eye_after = img, 1.0, eye / img.height
            for _ in range(3):
                e, _info = estimate_eye_y(alpha_mask(cur))
                if abs(e / cur.height - a.target) < 0.004:
                    eye_after = e / cur.height
                    break
                cur, s = align(cur, e, a.target)
                s_total *= s
                eye_after = (cur.height - (cur.height - e) * s) / cur.height
            out, s = cur, s_total

        if a.guide:
            os.makedirs(a.preview_dir, exist_ok=True)
            name = os.path.splitext(os.path.basename(f))[0]
            g1 = guide(img, a.target, first_eye)
            g2 = guide(out, a.target, eye_after * img.height)
            sheet = Image.new("RGB", (g1.width * 2 + 16, g1.height), (8, 8, 8))
            sheet.paste(g1, (0, 0)); sheet.paste(g2, (g1.width + 16, 0))
            sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(
                os.path.join(a.preview_dir, f"{name}_align.png"))
            print(f"[GUIDE] {os.path.basename(f):<16} eye {first_eye/img.height*100:5.1f}% → "
                  f"{eye_after*100:5.1f}%  scale {s:.3f}  → {a.preview_dir}/{name}_align.png")
            continue

        dst = a.out or f
        out.save(dst)
        print(f"[OUT] {os.path.basename(f):<16} eye {first_eye/img.height*100:5.1f}% → "
              f"{eye_after*100:5.1f}%  scale {s:.3f} → {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
