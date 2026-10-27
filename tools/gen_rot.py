# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  鬼域加剧变体生成器
把 art/scenes/<name>.jpg 处理成 <name>_rot.jpg：
构图完全不变，只做"时间被加速腐蚀"的后期——
压暗去色、大面积霉斑、墙皮水痕、锈红渗出、更重的颗粒与暗角。
用法：python tools/gen_rot.py            # 全部
      python tools/gen_rot.py classroom toilet
"""
import os
import sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES = os.path.join(ROOT, "art", "scenes")


def blotches(w, h, seed, scale=40, thresh=0.45, gain=1.7):
    """低频噪声 → 大尺度霉斑遮罩（0..1）"""
    rng = np.random.default_rng(seed)
    small = rng.normal(0.5, 0.22, (max(2, h // scale), max(2, w // scale))).astype(np.float32)
    img = Image.fromarray(np.clip(small * 255, 0, 255).astype(np.uint8), mode="L")
    big = np.asarray(img.resize((w, h), Image.BICUBIC)).astype(np.float32) / 255.0
    big = np.clip((big - thresh) * gain, 0, 1)
    return big


def streaks(w, h, seed, count=7):
    """竖向水痕"""
    rng = np.random.default_rng(seed)
    m = np.zeros((h, w), dtype=np.float32)
    for _ in range(count):
        x = int(rng.uniform(0, w))
        wid = int(rng.uniform(14, 70))
        a = rng.uniform(0.18, 0.5)
        x0, x1 = max(0, x - wid // 2), min(w, x + wid // 2)
        grad = np.linspace(a, a * 0.15, x1 - x0, dtype=np.float32)
        m[:, x0:x1] = np.maximum(m[:, x0:x1], grad[None, :])
    img = Image.fromarray((m * 255).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(6))
    return np.asarray(img).astype(np.float32) / 255.0


def rot(src, dst, seed=7):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    arr = np.asarray(im).astype(np.float32)

    # 1. 去色 + 偏病态绿
    l = arr @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    arr = arr * 0.35 + l[..., None] * 0.65
    arr[..., 0] *= 0.93
    arr[..., 1] *= 1.05
    arr[..., 2] *= 0.92

    # 2. 整体压暗（保留一点高光，避免死黑）
    arr *= 0.60
    arr = np.clip(arr, 0, 255)

    # 3. 霉斑（暗绿黑斑）
    mold = blotches(w, h, seed, scale=46, thresh=0.42, gain=1.8)
    arr *= (1.0 - 0.38 * mold[..., None])
    green = np.zeros_like(arr)
    green[..., 1] = 22.0
    green[..., 0] = 9.0
    green[..., 2] = 11.0
    arr = arr + green * mold[..., None] * 0.5

    # 4. 竖向水痕
    st = streaks(w, h, seed + 11, count=9)
    arr *= (1.0 - 0.34 * st[..., None])

    # 5. 锈蚀：细小、暗、贴着霉斑走，而不是大片红斑
    rust = blotches(w, h, seed + 23, scale=16, thresh=0.78, gain=2.6)
    arr *= (1.0 - 0.28 * rust[..., None])
    arr[..., 0] += 26.0 * rust
    arr[..., 1] += 6.0 * rust
    arr[..., 2] += 5.0 * rust
    # 5b. 细颗粒霉点
    speck = blotches(w, h, seed + 31, scale=6, thresh=0.72, gain=3.0)
    arr *= (1.0 - 0.35 * speck[..., None])

    # 6. 颗粒
    rng = np.random.default_rng(seed + 5)
    arr = arr + rng.normal(0, 7.5, (h, w, 1)).astype(np.float32)

    # 7. 更重的暗角
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2.0, h / 2.0
    r = np.sqrt(((xx - cx) / (w * 0.62)) ** 2 + ((yy - cy) / (h * 0.62)) ** 2)
    vig = np.clip(1.0 - 0.55 * np.clip(r - 0.35, 0, 2) ** 1.3, 0.15, 1.0)
    arr *= vig[..., None]

    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    out.save(dst, quality=86, optimize=True)
    return os.path.getsize(dst)


def main():
    names = sys.argv[1:]
    if not names:
        names = sorted(f[:-4] for f in os.listdir(SCENES)
                       if f.endswith(".jpg") and not f.endswith("_rot.jpg"))
    for n in names:
        src = os.path.join(SCENES, n + ".jpg")
        if not os.path.exists(src):
            print("SKIP", n, "(缺源图)")
            continue
        dst = os.path.join(SCENES, n + "_rot.jpg")
        print("OK", os.path.basename(dst), rot(src, dst, seed=abs(hash(n)) % 997 + 3), "bytes")


if __name__ == "__main__":
    main()