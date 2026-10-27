#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  统一 LUT / 色板审计
========================================
把 art-bible §8 里写的后期规范变成可执行的代码。三个用途：

1. **统一色**（clean）：不同批次/不同 seed 出的图，色温会飘。这一步把所有图
   拉回同一条曲线、同一个色相锚点、同一份套色偏移。**不改变构图与明暗关系。**
2. **补质感**（full）：纸纹、网点、颗粒、划痕、暗角。
   ⚠️ 生成模型自己已经烘了一批颗粒和暗角，所以 full 默认强度 0.5，
      且 art-bible §8.2 规定了上限（颗粒 ≤4%、暗角 ≤38%）。别叠满。
3. **色板审计**（check）：统计"偏离五色锚点"的像素比例，作为验收依据。

用法
----
    python tools/lut.py art/_samples/classroom.png --check
    python tools/lut.py in.png out.png --preset clean
    python tools/lut.py in.png out.png --preset full --strength 0.5
    python tools/lut.py art/_samples/*.png --preset clean --outdir art/_samples/_lut

色板锚点（与 art-bible §3 一致）
--------------------------------
    0°   干血红 BLOOD
    18°  深褐 SEPIA-DARK
    32°  中褐 SEPIA
    38°  浅茶 SEPIA-LIGHT
    186° 冷青 TEAL
    90°  墙裙绿 WALL-GREEN（中式教室的绿漆墙裙，唯一被特许的绿，须低彩度）
    220° 墨蓝 INK-NAVY（校服运动服的藏青，须压到接近墨黑）
"""

from __future__ import annotations

import argparse
import glob
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

# 色相锚点（度）：血、褐×3、青、墙裙绿、墨蓝
ANCHORS = [0.0, 18.0, 32.0, 38.0, 186.0, 90.0, 220.0, 150.0]
# 150° = 绿黑板（art-bible §7.2 规定的教室必备物件），与 90° 墙裙绿同性质：
# 不是风格色，是内容事实，故列入白名单；但它只在教室类画面出现，面积上限 15%。
HUE_TOL = 25.0          # 偏离锚点超过这个角度 → 判为出格色
OFFPAL_SAT = 0.16       # 只有够彩的像素才算"出格"


# ---------------------------------------------------------------------------
# 基础
# ---------------------------------------------------------------------------
def to_rgb(im):
    return np.asarray(im.convert("RGB")).astype(np.float32) / 255.0


def to_img(a):
    return Image.fromarray(np.clip(a * 255.0 + 0.5, 0, 255).astype(np.uint8))


def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    # 分段色相
    idx = (mx == r) & m
    h[idx] = (60 * ((g[idx] - b[idx]) / d[idx])) % 360
    idx = (mx == g) & m
    h[idx] = 60 * ((b[idx] - r[idx]) / d[idx]) + 120
    idx = (mx == b) & m
    h[idx] = 60 * ((r[idx] - g[idx]) / d[idx]) + 240
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    h = (h % 360) / 60.0
    i = np.floor(h).astype(int) % 6
    f = h - np.floor(h)
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    out = np.zeros(h.shape + (3,), np.float32)
    conds = [
        (i == 0, (v, t, p)), (i == 1, (q, v, p)), (i == 2, (p, v, t)),
        (i == 3, (p, q, v)), (i == 4, (t, p, v)), (i == 5, (v, p, q)),
    ]
    for c, (R, G, B) in conds:
        out[c] = np.stack([R[c], G[c], B[c]], axis=-1)
    return out


# ---------------------------------------------------------------------------
# 1. 曲线：黑场抬到 6，白场压到 96%
# ---------------------------------------------------------------------------
def curve(rgb, black=6 / 255, white=0.96, strength=1.0):
    """
    为什么要抬黑场：生成模型的纯黑会把 CSS 的颗粒层（mix-blend:overlay）吃掉，
    抬到 6 以后颗粒才看得见；白场压到 96% 是为了让骨白不至于在 brightness(1.22)
    下溢出成死白。
    """
    out = black + rgb * (white - black)
    return rgb * (1 - strength) + out * strength


# ---------------------------------------------------------------------------
# 2. 色相锁定：把出格色拉回锚点并降饱和
# ---------------------------------------------------------------------------
def hue_lock(rgb, strength=1.0, tol=HUE_TOL, desat=0.55):
    h, s, v = rgb_to_hsv(rgb)
    d = np.abs(((h[..., None] - np.array(ANCHORS)) + 180) % 360 - 180)
    nearest = d.min(axis=2)
    off = (nearest > tol) & (s > OFFPAL_SAT)
    s2 = np.where(off, s * (1 - desat), s)
    out = hsv_to_rgb(h, s2, v)
    return rgb * (1 - strength) + out * strength


# ---------------------------------------------------------------------------
# 3. 套色偏移：R 右移、B 左移 —— 全族同向，错版要错得一样
# ---------------------------------------------------------------------------
def misregister(rgb, px=0.5, strength=1.0):
    if strength <= 0:
        return rgb
    p = px * strength
    img = to_img(rgb)
    r, g, b = [np.asarray(ch, dtype=np.float32) for ch in img.split()]

    def shift(ch, dx):
        return np.asarray(
            Image.fromarray(ch.astype(np.uint8)).transform(
                ch.shape[::-1], Image.AFFINE, (1, 0, -dx, 0, 1, 0),
                resample=Image.BILINEAR, fillcolor=0
            ), dtype=np.float32
        )

    r = shift(r, -p)          # 向右
    b = shift(b, p)           # 向左
    return np.clip(np.dstack([r, g, b]) / 255.0, 0, 1)


# ---------------------------------------------------------------------------
# 4. 纸纹 / 网点 / 颗粒 / 划痕 / 暗角
# ---------------------------------------------------------------------------
def paper(rgb, color=(232, 220, 194), amount=0.08, seed=11):
    h, w = rgb.shape[:2]
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h // 2, w // 2)).astype(np.float32)
    n = np.asarray(Image.fromarray(((n - n.min()) / (np.ptp(n) + 1e-6) * 255).astype(np.uint8))
                   .resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0
    fib = 0.6 + 0.8 * n
    tint = np.array(color, np.float32) / 255.0
    mul = 1.0 - amount * (1.0 - tint) * fib[..., None]
    return np.clip(rgb * mul, 0, 1)


def halftone(rgb, cell=3, angle=45.0, amount=0.12):
    h, w = rgb.shape[:2]
    a = np.deg2rad(angle)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    u = xx * np.cos(a) + yy * np.sin(a)
    v = -xx * np.sin(a) + yy * np.cos(a)
    du = (u % cell) / cell - 0.5
    dv = (v % cell) / cell - 0.5
    dist = np.sqrt(du ** 2 + dv ** 2) * 2.0
    lum = rgb.mean(axis=2)
    dots = (dist < (1.0 - lum) * 0.62).astype(np.float32)
    return np.clip(rgb * (1 - amount * (1 - dots[..., None])), 0, 1)


def grain(rgb, amount=0.04, seed=7):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, rgb.shape[:2]).astype(np.float32) * amount
    return np.clip(rgb + n[..., None], 0, 1)


def scratches(rgb, n=2, seed=3, light=0.04, dark=0.06):
    h, w = rgb.shape[:2]
    rng = np.random.default_rng(seed)
    out = rgb.copy()
    for _ in range(n):
        x = int(rng.integers(0, w))
        x2 = int(np.clip(x + rng.integers(-6, 7), 0, w - 1))
        y0 = int(rng.integers(0, h // 3))
        y1 = int(rng.integers(h // 2, h))
        white = rng.random() < 0.5
        for y in range(y0, y1):
            xx = int(x + (x2 - x) * (y - y0) / max(1, y1 - y0))
            if 0 <= xx < w:
                out[y, xx] = np.clip(
                    out[y, xx] + (light if white else -dark), 0, 1)
    return out


def vignette(rgb, strength=0.38):
    h, w = rgb.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (w - 1) / 2, (h - 1) / 2
    r = np.sqrt(((xx - cx) / (w * 0.62)) ** 2 + ((yy - cy) / (h * 0.62)) ** 2)
    v = 1.0 - strength * np.clip((r - 0.45) / 0.75, 0, 1) ** 1.6
    return np.clip(rgb * v[..., None], 0, 1)


# ---------------------------------------------------------------------------
# 5. 色板审计
# ---------------------------------------------------------------------------
def check_palette(rgb):
    """
    返回出格色占比、平均饱和，以及四条主色的面积占比。
    墨蓝(220°) 与墙裙绿(90°) 是**白名单色**（art-bible §3.1 的特赦 1/2），
    不算出格；但它们各自有面积上限（navy ≤10%、green ≤12%），单独报出来。
    """
    h, s, v = rgb_to_hsv(rgb)
    d = np.abs(((h[..., None] - np.array(ANCHORS)) + 180) % 360 - 180)
    off = ((d.min(axis=2) > HUE_TOL) & (s > OFFPAL_SAT)).mean()

    def hue_near(center, tol, sat_min=0.25):
        circ = np.abs(((h - center) + 180) % 360 - 180)
        return ((circ < tol) & (s > sat_min)).mean()

    return dict(off_palette=float(off), mean_sat=float(s.mean()),
                teal=float(hue_near(186, 22)),
                blood=float(hue_near(0, 14) + hue_near(354, 6)),
                green=float(hue_near(90, 18, 0.22)),
                navy=float(hue_near(219, 16, 0.30)))


# ---------------------------------------------------------------------------
# 6. 预设
# ---------------------------------------------------------------------------
def mold(rgb, amount=0.55, seed=5, scale=34):
    """低频噪声 → 霉斑。只压暗、偏冷褐，不改变构图。"""
    h, w = rgb.shape[:2]
    rng = np.random.default_rng(seed)
    small = rng.normal(0.5, 0.24, (max(2, h // scale), max(2, w // scale))).astype(np.float32)
    big = Image.fromarray(np.clip(small * 255, 0, 255).astype(np.uint8), "L").resize(
        (w, h), Image.BICUBIC)
    m = np.clip((np.asarray(big, dtype=np.float32) / 255.0 - 0.52) * 2.6, 0, 1)
    # 只在暗部/中调长霉：天空、光源附近保持干净，否则像溅泥而不是霉
    lum = rgb.mean(axis=2)
    gate = np.clip((0.62 - lum) / 0.22, 0, 1)
    m = m * gate
    tint = np.array([0.72, 0.66, 0.55], np.float32)          # 冷褐霉色
    return np.clip(rgb * (1 - amount * m[..., None]) + tint * (amount * 0.22 * m[..., None]), 0, 1)


def water_streaks(rgb, count=9, seed=9, strength=0.5):
    """竖向水痕，从上往下衰减。"""
    h, w = rgb.shape[:2]
    rng = np.random.default_rng(seed)
    m = np.zeros((h, w), np.float32)
    for _ in range(count):
        x = int(rng.uniform(0, w))
        wid = int(rng.uniform(14, 80))
        a = float(rng.uniform(0.18, 0.55)) * strength
        x0, x1 = max(0, x - wid // 2), min(w, x + wid // 2)
        if x1 <= x0:
            continue
        col = np.linspace(a, a * 0.12, h, dtype=np.float32)
        m[:, x0:x1] = np.maximum(m[:, x0:x1], col[:, None])
    img = Image.fromarray((m * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(7))
    m = np.asarray(img, dtype=np.float32) / 255.0
    return np.clip(rgb * (1 - 0.55 * m[..., None]), 0, 1)


def rust(rgb, amount=0.10, seed=13):
    """锈红渗出：只在暗部加一点暖红，模拟铁件腐蚀。"""
    h, w = rgb.shape[:2]
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h // 22, w // 22)).astype(np.float32)
    big = np.asarray(
        Image.fromarray(((n - n.min()) / (np.ptp(n) + 1e-6) * 255).astype(np.uint8), "L")
        .resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0
    m = np.clip((big - 0.58) * 2.2, 0, 1)
    lum = rgb.mean(axis=2)[..., None]
    add = np.array([0.62, 0.19, 0.13], np.float32) * (amount * m[..., None])
    return np.clip(rgb * (1 - 0.35 * m[..., None]) + add * (1 - lum), 0, 1)


def apply(rgb, preset="clean", strength=1.0):
    out = curve(rgb, strength=strength)
    out = hue_lock(out, strength=strength)
    out = misregister(out, px=0.5, strength=strength)
    if preset in ("full", "rot"):
        k = strength * 0.5                 # 生成模型已烘过一批，补一半就够
        out = paper(out, amount=0.08 * k)
        out = halftone(out, amount=0.12 * k)
        out = grain(out, amount=0.04 * k)
        out = scratches(out, n=2)
        out = vignette(out, strength=0.38 * k)
    if preset == "rot":
        # 确定性腐化：不调 AI，只做"时间加速"。结构不会塌，但会烂、会脏、会渗。
        r = strength
        out = mold(out, amount=0.55 * r)
        out = water_streaks(out, count=9, strength=0.5 * r)
        out = rust(out, amount=0.10 * r)
        # 去色 + 压暗（腐化区通常更冷更闷）
        grey = out.mean(axis=2, keepdims=True)
        out = out * (1 - 0.22 * r) + grey * (0.22 * r)
        out = np.clip(out * (1 - 0.10 * r), 0, 1)
        out = grain(out, amount=0.03 * r, seed=21)
        out = vignette(out, strength=0.10 * r)
    return out


def main(argv=None):
    p = argparse.ArgumentParser(description="统一 LUT / 色板审计")
    p.add_argument("inputs", nargs="+")
    p.add_argument("--out", default=None, help="输出路径（仅单张输入时有效）")
    p.add_argument("--preset", choices=["clean", "full", "rot"], default="clean")
    p.add_argument("--strength", type=float, default=1.0)
    p.add_argument("--check", action="store_true", help="只做色板审计，不写文件")
    p.add_argument("--outdir", default=None)
    a = p.parse_args(argv)

    files = []
    for pat in a.inputs:
        files.extend(sorted(glob.glob(pat)) or [pat])

    for f in files:
        if not os.path.exists(f):
            print(f"[skip] {f}")
            continue
        rgb = to_rgb(Image.open(f))
        stat = check_palette(rgb)
        if a.check:
            flag = "OK " if stat["off_palette"] < 0.12 else "WARN"
            g_ok = "ok" if stat["green"] <= 0.12 else "OVER"
            n_ok = "ok" if stat["navy"] <= 0.10 else "OVER"
            print(f"[{flag}] {os.path.basename(f):<24} 出格色 {stat['off_palette']*100:5.1f}%  "
                  f"饱和 {stat['mean_sat']:.2f}  冷青 {stat['teal']*100:5.2f}%  "
                  f"血红 {stat['blood']*100:4.2f}%  "
                  f"墙裙绿 {stat['green']*100:5.1f}%({g_ok})  墨蓝 {stat['navy']*100:5.1f}%({n_ok})")
            continue

        out = apply(rgb, a.preset, a.strength)
        if a.outdir:
            dst = os.path.join(a.outdir, os.path.basename(f))
        elif a.out and len(files) == 1:
            dst = a.out
        else:
            root, ext = os.path.splitext(f)
            dst = f"{root}_lut{ext}"
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        to_img(out).save(dst)
        print(f"[OUT] {os.path.basename(f)} → {dst}  (preset={a.preset}, strength={a.strength})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
