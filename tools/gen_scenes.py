# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  场景背景生成器
统一规范：1600x900，单点透视，冷墨色 + 一点血红，
所有场景共用同一套空气透视、雾、光锥、污渍与颗粒。
"""
import math, os, random, subprocess, sys, time

W, H = 1600, 900
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "tools", "_build")
OUT = os.path.join(ROOT, "art", "scenes")
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

INK = "#070a0b"
INK2 = "#0d1416"
COLD = "#8fb0ab"
BONE = "#cfc6b4"
BLOOD = "#a3242a"


def head(extra=""):
    return f"""<defs>
  <filter id="b6"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="b14"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="b30"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="b60"><feGaussianBlur stdDeviation="60"/></filter>
  <filter id="stain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="12"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.12  0 0 0 0 0.11  1.2 0 0 0 -0.55"/>
  </filter>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="6"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0a0f11"/><stop offset="1" stop-color="#050607"/>
  </linearGradient>
  <radialGradient id="lamp"><stop offset="0" stop-color="#dfe9e2" stop-opacity="0.85"/><stop offset="1" stop-color="#dfe9e2" stop-opacity="0"/></radialGradient>
  <radialGradient id="red"><stop offset="0" stop-color="#c8382f" stop-opacity="0.75"/><stop offset="1" stop-color="#c8382f" stop-opacity="0"/></radialGradient>
  <radialGradient id="vign"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
  <linearGradient id="fogG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#93a9a5" stop-opacity="0"/><stop offset="0.5" stop-color="#93a9a5" stop-opacity="1"/><stop offset="1" stop-color="#93a9a5" stop-opacity="0"/>
  </linearGradient>
  {extra}
</defs>"""


def fog(cx, cy, rx, ry, op=0.1, color="#93a9a5"):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{color}" opacity="{op}" filter="url(#b60)"/>')


def grain(op=0.09):
    return f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="{op}" style="mix-blend-mode:overlay"/>'


def vignet(op=0.9):
    return f'<rect width="{W}" height="{H}" fill="url(#vign)" opacity="{op}"/>'


def stain_rect(x, y, w, h, op=0.25):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" filter="url(#stain)" opacity="{op}"/>'


def light_cone(x, y, w, h, op=0.18, color="#cfe0da"):
    return (f'<path d="M{x-w/2} {y} L{x+w/2} {y} L{x+w*1.4} {y+h} L{x-w*1.4} {y+h} Z" fill="{color}" opacity="{op}" filter="url(#b30)"/>')


def frame(svg_body, w=W, h=H):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            + head() + svg_body + '</svg>')


# ============================================================
#  卧室 · 夜
# ============================================================
def room_night():
    s = [f'<rect width="{W}" height="{H}" fill="#080b0c"/>']
    # 窗
    s.append('<rect x="960" y="120" width="420" height="520" fill="#0c1518"/>')
    s.append('<rect x="960" y="120" width="420" height="520" fill="url(#dark)" opacity="0.5"/>')
    s.append('<path d="M1170 120 L1170 640 M960 380 L1380 380" stroke="#1d2a2c" stroke-width="12"/>')
    # 窗外雨
    random.seed(3)
    for i in range(90):
        x = random.uniform(965, 1375); y = random.uniform(125, 636)
        s.append(f'<path d="M{x} {y} l-6 22" stroke="#7f9b98" stroke-width="1.2" opacity="{random.uniform(.05,.22):.2f}"/>')
    s.append(fog(1170, 400, 300, 240, .1, "#7f9b98"))
    # 墙
    s.append('<rect width="1600" height="900" fill="#0b1012"/>')
    s.append('<rect x="0" y="0" width="1600" height="900" fill="url(#stain)" opacity="0.35"/>')
    s.append(stain_rect(0, 0, 1600, 900, .18))
    # 窗重新叠上
    s.append('<rect x="960" y="120" width="420" height="520" fill="#0c1518"/>')
    s.append('<path d="M1170 120 L1170 640 M960 380 L1380 380" stroke="#243235" stroke-width="14"/>')
    s.append('<rect x="960" y="120" width="420" height="520" fill="none" stroke="#2c3b3e" stroke-width="10"/>')
    s.append(fog(1180, 420, 260, 200, .18, "#8fb0ab"))
    # 床
    s.append('<path d="M0 640 L640 600 L720 900 L0 900 Z" fill="#101719"/>')
    s.append('<path d="M0 640 L640 600 L700 760 L0 820 Z" fill="#182325"/>')
    s.append('<path d="M0 700 C180 660 380 640 620 640" fill="none" stroke="#263335" stroke-width="3" opacity="0.8"/>')
    # 被子褶皱
    for i in range(5):
        s.append(f'<path d="M{40+i*110} 700 C{80+i*110} 740 {60+i*110} 820 {90+i*110} 900" fill="none" stroke="#0a0f10" stroke-width="26" opacity="0.5" filter="url(#b14)"/>')
    # 手机光
    s.append('<ellipse cx="470" cy="700" rx="230" ry="160" fill="#9fd0c8" opacity="0.14" filter="url(#b60)"/>')
    s.append('<rect x="430" y="668" width="52" height="86" rx="6" fill="#0a1416" transform="rotate(-14 456 711)"/>')
    s.append('<rect x="436" y="674" width="40" height="74" rx="3" fill="#9fd0c8" opacity="0.55" transform="rotate(-14 456 711)"/>')
    # 台灯 / 床头
    s.append('<rect x="760" y="560" width="120" height="16" fill="#1a2426"/>')
    s.append('<rect x="790" y="470" width="60" height="90" fill="#131b1d"/>')
    s.append('<ellipse cx="820" cy="470" rx="70" ry="30" fill="#cfe0da" opacity="0.10" filter="url(#b30)"/>')
    s += [fog(400, 780, 500, 200, .10, "#8fb0ab"), grain(0.1), vignet(0.95)]
    return frame("".join(s))


# ============================================================
#  教室 · 晚自习
# ============================================================
def classroom(ghost=False, board=True):
    s = [f'<rect width="{W}" height="{H}" fill="#0a0e10"/>']
    # 后墙
    s.append('<rect x="440" y="180" width="720" height="520" fill="#141c1f"/>')
    s.append('<rect x="440" y="180" width="720" height="520" fill="url(#stain)" opacity="0.45"/>')
    # 侧墙
    s.append('<path d="M0 0 L440 180 L440 700 L0 900 Z" fill="#0f1618"/>')
    s.append('<path d="M1600 0 L1160 180 L1160 700 L1600 900 Z" fill="#0c1214"/>')
    # 天花板
    s.append('<path d="M0 0 L1600 0 L1160 180 L440 180 Z" fill="#0b1113"/>')
    # 地板
    s.append('<path d="M0 900 L1600 900 L1160 700 L440 700 Z" fill="#0e1416"/>')
    # 地砖缝
    for i in range(1, 9):
        t = i / 9
        x1 = 440 + (1160 - 440) * t
        s.append(f'<path d="M{x1} 700 L{ -200 + 2000*t } 900" stroke="#182022" stroke-width="2" opacity="0.6"/>')
    # 黑板
    s.append('<rect x="560" y="250" width="480" height="250" fill="#101a17"/>')
    s.append('<rect x="560" y="250" width="480" height="250" fill="none" stroke="#2a3633" stroke-width="8"/>')
    s.append('<rect x="560" y="500" width="480" height="18" fill="#1e2926"/>')
    if board:
        # 黑板字（周正写下的那几行）
        s.append('<g fill="#b9cbc2" opacity="0.55" font-family="KaiTi,STKaiti,serif" font-size="30" letter-spacing="4">'
                 '<text x="600" y="320">鬼无法被杀死。</text>'
                 '<text x="600" y="378">能对付鬼的只有鬼。</text>'
                 '<text x="600" y="436">洞察鬼的规律。</text></g>')
        s.append('<text x="600" y="272" fill="#7d948c" opacity="0.4" font-family="KaiTi,STKaiti,serif" font-size="72">鬼</text>')
    else:
        # 讲课之前：擦不干净的黑板
        s.append('<g opacity="0.22" filter="url(#b14)">'
                 '<ellipse cx="760" cy="330" rx="150" ry="46" fill="#9fb0a8"/>'
                 '<ellipse cx="880" cy="420" rx="120" ry="34" fill="#9fb0a8"/></g>')
        s.append('<rect x="560" y="490" width="480" height="6" fill="#c9c4b8" opacity="0.25"/>')
    # 后门（右墙）：徐老师从这里走出去
    s.append('<path d="M1190 250 L1330 268 L1330 640 L1190 664 Z" fill="#0a1112" stroke="#26333a" stroke-width="8"/>')
    s.append('<path d="M1210 282 L1310 296 L1310 470 L1210 482 Z" fill="#0d171a"/>')
    s.append('<circle cx="1218" cy="470" r="7" fill="#33454a"/>')
    # 课桌（透视）
    random.seed(5)
    for row in range(5):
        t = row / 4
        y = 640 + t * 220
        scale = 0.55 + t * 0.9
        for col in range(6):
            x = 300 + col * (170 * scale) + (1 - t) * 120
            w = 120 * scale; h = 16 * scale
            s.append(f'<path d="M{x} {y} L{x+w} {y} L{x+w+16} {y+h} L{x-16} {y+h} Z" fill="#1a2225" opacity="{0.55+0.2*t:.2f}"/>')
            s.append(f'<path d="M{x+w*0.15} {y+h} L{x+w*0.2} {y+h+34*scale} M{x+w*0.8} {y+h} L{x+w*0.85} {y+h+34*scale}" stroke="#0a0f10" stroke-width="{3*scale:.1f}" opacity="0.8"/>')
            # 书本
            if random.random() > 0.5:
                s.append(f'<path d="M{x+w*0.3} {y-3} L{x+w*0.62} {y-3} L{x+w*0.64} {y+2} L{x+w*0.32} {y+2} Z" fill="#3a3f3a" opacity="0.7"/>')
    # 日光灯
    for x in (620, 980):
        s.append(f'<rect x="{x}" y="150" width="220" height="10" fill="#cfe0da" opacity="0.5"/>')
        s.append(f'<ellipse cx="{x+110}" cy="190" rx="180" ry="120" fill="url(#lamp)" opacity="0.30" filter="url(#b30)"/>')
    # 左墙窗
    s.append('<path d="M60 180 L300 240 L300 520 L60 620 Z" fill="#0a1417"/>')
    s.append('<path d="M60 180 L300 240 L300 520 L60 620 Z" fill="none" stroke="#243333" stroke-width="10"/>')
    s.append('<path d="M180 210 L180 570 M60 400 L300 380" stroke="#1c2a2a" stroke-width="8"/>')
    # 走廊尽头的黑暗
    s.append('<path d="M60 180 L300 240 L300 520 L60 620 Z" fill="#040606" opacity="0.55"/>')
    if ghost:
        # 门外的黑衫老人剪影
        s.append('<g opacity="0.92" filter="url(#rough)">'
                 '<path d="M1090 640 L1090 420 C1090 380 1110 358 1140 356 C1170 358 1188 382 1188 420 L1188 640 Z" fill="#040505"/>'
                 '<path d="M1118 352 C1118 318 1160 318 1160 352 C1160 386 1118 386 1118 352 Z" fill="#040505"/>'
                 '<path d="M1090 640 L1188 640 L1210 900 L1070 900 Z" fill="#040505"/>'
                 '</g>')
        s.append('<ellipse cx="1139" cy="356" rx="46" ry="46" fill="#cfe0da" opacity="0.08" filter="url(#b30)"/>')
    s.append(fog(800, 700, 700, 220, .12, "#8fb0ab"))
    s.append(stain_rect(0, 0, 1600, 900, .2))
    s += [grain(0.1), vignet(0.9)]
    return frame("".join(s))


# ============================================================
#  走廊 · 鬼域
# ============================================================
def corridor():
    s = [f'<rect width="{W}" height="{H}" fill="#050809"/>']
    vpx, vpy = 800, 420
    far_l, far_r, far_t, far_b = 560, 1040, 250, 600
    # 墙 / 地 / 顶
    s.append(f'<path d="M0 0 L{far_l} {far_t} L{far_l} {far_b} L0 900 Z" fill="#151f21"/>')
    s.append(f'<path d="M1600 0 L{far_r} {far_t} L{far_r} {far_b} L1600 900 Z" fill="#111a1c"/>')
    s.append(f'<path d="M0 0 L1600 0 L{far_r} {far_t} L{far_l} {far_t} Z" fill="#0b1113"/>')
    s.append(f'<path d="M0 900 L1600 900 L{far_r} {far_b} L{far_l} {far_b} Z" fill="#101819"/>')
    # 尽头
    s.append(f'<rect x="{far_l}" y="{far_t}" width="{far_r-far_l}" height="{far_b-far_t}" fill="#020303"/>')
    # 墙面污渍
    s.append(stain_rect(0, 0, 1600, 900, .45))
    # 左侧门
    for s0, s1 in ((0.18, 0.30), (0.46, 0.56), (0.70, 0.78)):
        x0, x1 = far_l * s0, far_l * s1
        t0 = 140 + (far_t - 140) * s0 ** 0.85
        t1 = 140 + (far_t - 140) * s1 ** 0.85
        b0 = 820 - (820 - far_b) * s0 ** 0.85
        b1 = 820 - (820 - far_b) * s1 ** 0.85
        s.append(f'<path d="M{x0:.0f} {t0:.0f} L{x1:.0f} {t1:.0f} L{x1:.0f} {b1:.0f} L{x0:.0f} {b0:.0f} Z" fill="#0a1011" stroke="#243033" stroke-width="4"/>')
        s.append(f'<path d="M{x0+(x1-x0)*0.12:.0f} {t0+(t1-t0)*0.12+30:.0f} L{x0+(x1-x0)*0.55:.0f} {t0+(t1-t0)*0.55+30:.0f} L{x0+(x1-x0)*0.55:.0f} {t0+(t1-t0)*0.55+180:.0f} L{x0+(x1-x0)*0.12:.0f} {t0+(t1-t0)*0.12+180:.0f} Z" fill="#050809"/>')
    # 右侧窗
    for s0, s1 in ((0.16, 0.26), (0.40, 0.50), (0.62, 0.70)):
        x0 = 1600 - (1600 - far_r) * s0
        x1 = 1600 - (1600 - far_r) * s1
        t0 = 150 + (far_t - 150) * s0 ** 0.85
        t1 = 150 + (far_t - 150) * s1 ** 0.85
        b0 = 780 - (780 - far_b) * s0 ** 0.85
        b1 = 780 - (780 - far_b) * s1 ** 0.85
        s.append(f'<path d="M{x0:.0f} {t0:.0f} L{x1:.0f} {t1:.0f} L{x1:.0f} {b1:.0f} L{x0:.0f} {b0:.0f} Z" fill="#08100f" stroke="#1e2a2c" stroke-width="4"/>')
    # 天花板灯
    for s0 in (0.16, 0.34, 0.52, 0.70, 0.85):
        w = 300 * (1 - s0)
        y = 60 + (far_t - 60) * s0
        s.append(f'<rect x="{vpx-w/2:.0f}" y="{y:.0f}" width="{w:.0f}" height="{6-4*s0:.1f}" fill="#cfe0da" opacity="0.55"/>')
        s.append(f'<ellipse cx="{vpx}" cy="{y+70*(1-s0):.0f}" rx="{w*1.3:.0f}" ry="{110*(1-s0):.0f}" fill="url(#lamp)" opacity="{0.22*(1-s0):.2f}" filter="url(#b30)"/>')
    # 地面反光
    s.append(f'<ellipse cx="{vpx}" cy="780" rx="560" ry="120" fill="#7f9b98" opacity="0.05" filter="url(#b60)"/>')
    # 尽头红光
    s.append(f'<circle cx="{vpx+30}" cy="{vpy+70}" r="60" fill="url(#red)" opacity="0.35"/>')
    s.append(fog(800, 640, 780, 180, .12))
    s += [grain(0.11), vignet(0.95)]
    return frame("".join(s))


# ============================================================
#  楼梯间
# ============================================================
def stairwell():
    s = [f'<rect width="{W}" height="{H}" fill="#06090a"/>']
    s.append('<rect x="0" y="0" width="1600" height="900" fill="url(#stain)" opacity="0.6"/>')
    # 楼梯：向右下
    for i in range(9):
        y = 520 + i * 44
        x = 240 - i * 8
        s.append(f'<path d="M{x} {y} L{x+760} {y-60} L{x+760} {y-18} L{x} {y+26} Z" fill="#111a1c"/>')
        s.append(f'<path d="M{x} {y} L{x+760} {y-60}" stroke="#263436" stroke-width="3" opacity="0.8"/>')
        s.append(f'<path d="M{x} {y+26} L{x+760} {y-32}" stroke="#050708" stroke-width="6" opacity="0.9"/>')
    # 墙
    s.append('<path d="M0 0 L1600 0 L1600 900 L0 900 Z" fill="none"/>')
    s.append('<path d="M0 900 L0 0 L1600 0 L1600 900" fill="none" stroke="#1a2426" stroke-width="2"/>')
    # 墙上刷着的楼层号（褪色）
    s.append('<text x="170" y="430" fill="#8fa39c" opacity="0.28" font-family="Arial,Helvetica,sans-serif" font-size="120" font-weight="bold">2</text>')
    s.append('<path d="M150 452 L290 452" stroke="#8fa39c" stroke-width="3" opacity="0.18"/>')
    # 窗（高处）
    s.append('<rect x="1080" y="120" width="300" height="260" fill="#0a1416" stroke="#243333" stroke-width="12"/>')
    s.append('<path d="M1230 120 L1230 380 M1080 250 L1380 250" stroke="#1c2a2a" stroke-width="8"/>')
    s.append(fog(1230, 260, 260, 200, .12, "#8fb0ab"))
    # 扶手
    s.append('<path d="M180 500 L940 330" stroke="#2b383a" stroke-width="8"/>')
    for i in range(10):
        x = 200 + i * 76
        y = 506 - i * 18
        s.append(f'<path d="M{x} {y} L{x} {y+120}" stroke="#1e2a2c" stroke-width="5"/>')
    # 黑暗
    s.append('<rect x="0" y="0" width="900" height="520" fill="#020303" opacity="0.55"/>')
    s.append('<ellipse cx="760" cy="300" rx="420" ry="260" fill="#020303" opacity="0.55" filter="url(#b60)"/>')
    s.append(light_cone(1200, 260, 120, 500, 0.06))
    s += [fog(800, 700, 700, 160, .1), grain(0.11), vignet(0.95)]
    return frame("".join(s))


# ============================================================
#  厕所
# ============================================================
def toilet():
    s = [f'<rect width="{W}" height="{H}" fill="#080d0e"/>']
    # 瓷砖墙
    s.append('<rect x="0" y="0" width="1600" height="900" fill="#101a1b"/>')
    for y in range(0, 700, 86):
        s.append(f'<path d="M0 {y} L1600 {y}" stroke="#1b2829" stroke-width="2" opacity="0.7"/>')
    for x in range(0, 1600, 86):
        s.append(f'<path d="M{x} 0 L{x} 700" stroke="#1b2829" stroke-width="2" opacity="0.5"/>')
    s.append(stain_rect(0, 0, 1600, 900, .55))
    # 地面
    s.append('<path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="#0b1112"/>')
    s.append('<path d="M0 700 L1600 700" stroke="#1e2a2b" stroke-width="4"/>')
    # 隔间
    for i in range(3):
        x = 980 + i * 200
        s.append(f'<rect x="{x}" y="180" width="170" height="520" fill="#0d1516" stroke="#1e2a2c" stroke-width="6"/>')
        s.append(f'<rect x="{x+10}" y="200" width="150" height="470" fill="none" stroke="#172224" stroke-width="2"/>')
        s.append(f'<circle cx="{x+150}" cy="430" r="8" fill="#2c3a3c"/>')
    # 洗手台
    s.append('<path d="M80 520 L520 500 L520 560 L80 600 Z" fill="#152122"/>')
    s.append('<path d="M80 600 L520 560 L540 900 L60 900 Z" fill="#0d1516"/>')
    for i in range(3):
        x = 150 + i * 130
        s.append(f'<ellipse cx="{x}" cy="520" rx="44" ry="14" fill="#0a1213" stroke="#243234" stroke-width="3"/>')
        s.append(f'<path d="M{x+8} 512 L{x+8} 470 L{x+26} 470" stroke="#2a383a" stroke-width="6" fill="none"/>')
        s.append(f'<path d="M{x+26} 476 L{x+26} 496" stroke="#8fb0ab" stroke-width="1.4" opacity="0.35"/>')
    # 水渍
    s.append('<path d="M0 700 L300 690 L340 900 L0 900 Z" fill="#0a1011"/>')
    s.append('<ellipse cx="300" cy="700" rx="140" ry="30" fill="#8fb0ab" opacity="0.06" filter="url(#b30)"/>')
    # 单灯
    s.append('<rect x="700" y="40" width="200" height="12" fill="#cfe0da" opacity="0.5"/>')
    s.append('<ellipse cx="800" cy="120" rx="300" ry="200" fill="url(#lamp)" opacity="0.22" filter="url(#b30)"/>')
    s.append(light_cone(800, 60, 160, 700, 0.07))
    # 黑暗角落
    s.append('<ellipse cx="120" cy="330" rx="340" ry="330" fill="#020303" opacity="0.8" filter="url(#b60)"/>')
    s.append('<ellipse cx="1450" cy="300" rx="300" ry="300" fill="#020303" opacity="0.7" filter="url(#b60)"/>')
    s += [fog(700, 720, 700, 160, .12), grain(0.12), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  白骨树
# ============================================================
def tree_branch(x, y, ang, ln, wd, depth, out):
    if depth <= 0 or ln < 12:
        return
    x2 = x + math.cos(ang) * ln
    y2 = y + math.sin(ang) * ln
    w2 = max(1.2, wd * 0.62)
    nx, ny = -math.sin(ang), math.cos(ang)
    out.append(f'<path d="M{x+nx*wd/2:.1f} {y+ny*wd/2:.1f} L{x2+nx*w2/2:.1f} {y2+ny*w2/2:.1f} '
               f'L{x2-nx*w2/2:.1f} {y2-ny*w2/2:.1f} L{x-nx*wd/2:.1f} {y-ny*wd/2:.1f} Z" '
               f'fill="#b9b2a0" opacity="{0.55+0.06*depth:.2f}"/>')
    for d in (-0.55, 0.5, 0.02):
        tree_branch(x2, y2, ang + d + random.uniform(-.12, .12), ln * random.uniform(.62, .74), w2, depth - 1, out)


def bone_tree():
    random.seed(21)
    s = [f'<rect width="{W}" height="{H}" fill="#040607"/>']
    s.append('<ellipse cx="800" cy="460" rx="760" ry="560" fill="#0c1716" opacity="0.9" filter="url(#b60)"/>')
    s.append('<path d="M0 760 C300 720 500 740 800 730 C1100 720 1300 750 1600 720 L1600 900 L0 900 Z" fill="#0a0f0f"/>')
    # 递归骨树
    branches = []
    tree_branch(800, 790, -math.pi / 2, 240, 54, 6, branches)
    s.append('<g filter="url(#rough)">' + "".join(branches) + '</g>')
    s.append('<ellipse cx="800" cy="520" rx="420" ry="300" fill="#b9b2a0" opacity="0.05" filter="url(#b60)"/>')
    # 挂着的人皮 / 干尸头
    for i in range(8):
        x = random.uniform(460, 1140); y = random.uniform(250, 420)
        w = random.uniform(28, 62); h = random.uniform(80, 170)
        s.append(f'<path d="M{x} {y} C{x-w*0.5} {y+h*0.3} {x-w*0.4} {y+h} {x} {y+h*1.05} C{x+w*0.4} {y+h} {x+w*0.5} {y+h*0.3} {x} {y} Z" fill="#8f887a" opacity="{random.uniform(.12,.3):.2f}" filter="url(#rough)"/>')
    for (x, y) in [(540, 330), (1010, 300)]:
        s.append(f'<ellipse cx="{x}" cy="{y}" rx="26" ry="32" fill="#9a9384" opacity="0.22" filter="url(#rough)"/>')
        s.append(f'<circle cx="{x-9}" cy="{y-4}" r="7" fill="#040607"/>')
        s.append(f'<circle cx="{x+9}" cy="{y-4}" r="7" fill="#040607"/>')
    # 纸幡
    for (x, y, h) in [(520, 300, 210), (1080, 320, 170), (690, 270, 150)]:
        s.append(f'<path d="M{x} {y} L{x} {y+h} L{x+24} {y+h-10} L{x} {y+h-22}" fill="#cfc6b4" opacity="0.14" filter="url(#rough)"/>')
    # 四米高黑影（倒挂）
    s.append('<g opacity="0.97">')
    s.append('<path d="M560 760 L560 380 C560 300 630 250 700 250 C770 250 840 300 840 380 L840 760 Z" fill="#020303" filter="url(#rough)"/>')
    s.append('<path d="M580 380 C580 330 630 300 700 300 C770 300 820 330 820 380 L820 430 C780 400 620 400 580 430 Z" fill="#000" opacity="0.9"/>')
    s.append('<ellipse cx="700" cy="372" rx="46" ry="56" fill="#000"/>')
    s.append('<circle cx="700" cy="372" r="16" fill="url(#red)"/>')
    s.append('<circle cx="700" cy="372" r="5" fill="#e8564a"/>')
    # 棺材钉
    s.append('<path d="M640 470 L760 456" stroke="#3a3128" stroke-width="15" stroke-linecap="round"/>')
    s.append('<path d="M620 474 L640 470" stroke="#2a231c" stroke-width="20"/>')
    s.append('</g>')
    s.append('<path d="M720 500 L718 600" stroke="#5a1416" stroke-width="3" opacity="0.75"/>')
    s.append('<ellipse cx="718" cy="606" rx="4" ry="7" fill="#8a1c1e"/>')
    s.append('<ellipse cx="718" cy="640" rx="28" ry="10" fill="#5a1416" opacity="0.3" filter="url(#b14)"/>')
    s.append('<ellipse cx="600" cy="700" rx="340" ry="280" fill="url(#red)" opacity="0.24" filter="url(#b60)"/>')
    s += [fog(700, 760, 700, 140, .1), grain(0.12), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  封面：走廊尽头的影子
# ============================================================
def title_art():
    s = [f'<rect width="{W}" height="{H}" fill="#050708"/>']
    far_l, far_r, far_t, far_b = 560, 1040, 250, 600
    s.append(f'<path d="M0 0 L{far_l} {far_t} L{far_l} {far_b} L0 900 Z" fill="#131c1e"/>')
    s.append(f'<path d="M1600 0 L{far_r} {far_t} L{far_r} {far_b} L1600 900 Z" fill="#0f1719"/>')
    s.append(f'<path d="M0 0 L1600 0 L{far_r} {far_t} L{far_l} {far_t} Z" fill="#0a1012"/>')
    s.append(f'<path d="M0 900 L1600 900 L{far_r} {far_b} L{far_l} {far_b} Z" fill="#0e1516"/>')
    s.append(f'<rect x="{far_l}" y="{far_t}" width="{far_r-far_l}" height="{far_b-far_t}" fill="#030404"/>')
    s.append(stain_rect(0, 0, 1600, 900, .5))
    # 门
    for s0, s1 in ((0.2, 0.33), (0.55, 0.66)):
        x0, x1 = far_l * s0, far_l * s1
        t0 = 140 + (far_t - 140) * s0 ** 0.85; t1 = 140 + (far_t - 140) * s1 ** 0.85
        b0 = 820 - (820 - far_b) * s0 ** 0.85; b1 = 820 - (820 - far_b) * s1 ** 0.85
        s.append(f'<path d="M{x0:.0f} {t0:.0f} L{x1:.0f} {t1:.0f} L{x1:.0f} {b1:.0f} L{x0:.0f} {b0:.0f} Z" fill="#080d0e" stroke="#202c2e" stroke-width="4"/>')
    # 灯
    for s0 in (0.18, 0.42, 0.66, 0.84):
        w = 320 * (1 - s0); y = 60 + (far_t - 60) * s0
        s.append(f'<rect x="{800-w/2:.0f}" y="{y:.0f}" width="{w:.0f}" height="{5-3*s0:.1f}" fill="#cfe0da" opacity="0.5"/>')
        s.append(f'<ellipse cx="800" cy="{y+60*(1-s0):.0f}" rx="{w:.0f}" ry="{90*(1-s0):.0f}" fill="url(#lamp)" opacity="{0.16*(1-s0):.2f}" filter="url(#b30)"/>')
    # 尽头的老人
    s.append('<g opacity="0.96" filter="url(#rough)">')
    s.append('<path d="M770 600 L770 400 C770 362 786 340 812 338 C838 340 856 364 856 400 L856 600 Z" fill="#020303"/>')
    s.append('<circle cx="813" cy="332" r="30" fill="#020303"/>')
    s.append('<path d="M762 600 L864 600 L878 700 L748 700 Z" fill="#020303"/>')
    s.append('</g>')
    s.append('<ellipse cx="813" cy="332" rx="70" ry="70" fill="url(#red)" opacity="0.22" filter="url(#b60)"/>')
    s.append('<ellipse cx="700" cy="720" rx="520" ry="140" fill="#7f9b98" opacity="0.05" filter="url(#b60)"/>')
    s += [fog(800, 620, 800, 200, .14), fog(300, 500, 400, 260, .08),
          grain(0.12), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  操场
# ============================================================
def playground():
    s = [f'<rect width="{W}" height="{H}" fill="#070b0c"/>']
    s.append('<rect width="1600" height="560" fill="#0b1315"/>')
    # 教学楼剪影
    s.append('<path d="M120 560 L120 240 L420 200 L420 560 Z" fill="#080d0f"/>')
    s.append('<path d="M420 560 L420 200 L900 160 L900 560 Z" fill="#0a1012"/>')
    s.append('<path d="M900 560 L900 160 L1240 200 L1240 560 Z" fill="#080d0f"/>')
    for i in range(22):
        x = 160 + (i % 11) * 66
        y = 250 + (i // 11) * 90
        s.append(f'<rect x="{x}" y="{y}" width="34" height="46" fill="#111b1d" opacity="0.8"/>')
    s.append('<path d="M880 160 L880 100 L920 100 L920 160 Z" fill="#080d0f"/>')
    # 地面
    s.append('<path d="M0 560 L1600 560 L1600 900 L0 900 Z" fill="#0b1112"/>')
    s.append('<path d="M0 700 L1600 700" stroke="#131d1f" stroke-width="3"/>')
    # 跑道线
    for i in range(4):
        s.append(f'<path d="M-100 {620+i*40} C400 {600+i*30} 1200 {600+i*30} 1700 {620+i*40}" fill="none" stroke="#1b2628" stroke-width="3" opacity="0.7"/>')
    # 篮球架
    s.append('<path d="M1300 560 L1300 380 M1240 380 L1360 380" stroke="#111a1c" stroke-width="8"/>')
    s.append('<rect x="1258" y="380" width="84" height="8" fill="#1a2426"/>')
    # 路灯
    for x in (300, 1120):
        s.append(f'<path d="M{x} 620 L{x} 300 L{x+40} 300" stroke="#111a1c" stroke-width="8" fill="none"/>')
        s.append(f'<circle cx="{x+40}" cy="300" r="8" fill="#cfe0da" opacity="0.4"/>')
        s.append(f'<ellipse cx="{x+40}" cy="306" rx="160" ry="130" fill="url(#lamp)" opacity="0.12" filter="url(#b30)"/>')
    s += [fog(800, 620, 900, 180, .16), fog(400, 560, 500, 160, .1),
          grain(0.11), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  校门
# ============================================================
def school_gate():
    s = [f'<rect width="{W}" height="{H}" fill="#050809"/>']
    s.append('<rect width="1600" height="520" fill="#0a1113"/>')
    # 门柱
    for x in (300, 1240):
        s.append(f'<rect x="{x}" y="260" width="70" height="340" fill="#0d1517"/>')
        s.append(f'<rect x="{x-8}" y="250" width="86" height="18" fill="#162022"/>')
    # 栅栏门
    s.append('<g stroke="#1a2426" stroke-width="7" opacity="0.9">')
    for i in range(14):
        x = 370 + i * 60
        s.append(f'<path d="M{x} 330 L{x} 600"/>')
    s.append('<path d="M370 360 L1210 360 M370 560 L1210 560"/>')
    s.append('</g>')
    # 保安亭
    s.append('<rect x="1330" y="380" width="220" height="220" fill="#0b1214" stroke="#1a2426" stroke-width="6"/>')
    s.append('<rect x="1350" y="400" width="180" height="90" fill="#08100f"/>')
    s.append('<rect x="1350" y="400" width="180" height="90" fill="none" stroke="#243234" stroke-width="3"/>')
    # 路
    s.append('<path d="M0 600 L1600 600 L1600 900 L0 900 Z" fill="#0a0f10"/>')
    for i in range(5):
        s.append(f'<path d="M{-200+i*300} 900 L{300+i*220} 600" stroke="#151d1f" stroke-width="3" opacity="0.6"/>')
    # 路灯
    s.append('<path d="M760 600 L760 300 L840 300" stroke="#111a1c" stroke-width="9" fill="none"/>')
    s.append('<circle cx="840" cy="300" r="9" fill="#cfe0da" opacity="0.35"/>')
    s.append('<ellipse cx="840" cy="320" rx="220" ry="160" fill="url(#lamp)" opacity="0.12" filter="url(#b30)"/>')
    # 尽头的黑
    s.append('<rect x="0" y="470" width="1600" height="140" fill="#020303" opacity="0.55" filter="url(#b30)"/>')
    s += [fog(700, 640, 800, 160, .12), grain(0.11), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  步行街 · 清晨
# ============================================================
def street_dawn():
    s = [f'<rect width="{W}" height="{H}" fill="#0d1416"/>']
    # 天空
    s.append('<rect width="1600" height="420" fill="#1b2b30"/>')
    s.append('<rect width="1600" height="420" fill="#2c3c40" opacity="0.35"/>')
    s.append('<ellipse cx="1180" cy="300" rx="520" ry="180" fill="#7e8d84" opacity="0.18" filter="url(#b60)"/>')
    s.append('<ellipse cx="1180" cy="360" rx="300" ry="60" fill="#c9a878" opacity="0.12" filter="url(#b60)"/>')
    # 街道尽头
    s.append('<path d="M760 420 L840 420 L900 900 L700 900 Z" fill="#0d1517"/>')
    # 两侧店铺
    s.append('<path d="M0 200 L520 300 L520 700 L0 900 Z" fill="#11191b"/>')
    s.append('<path d="M1600 180 L1080 300 L1080 700 L1600 900 Z" fill="#0f1719"/>')
    # 店铺门脸
    for i in range(4):
        x = 60 + i * 118
        y = 330 + i * 18
        s.append(f'<rect x="{x}" y="{y}" width="92" height="300" fill="#0a1214" stroke="#1c282a" stroke-width="3"/>')
        s.append(f'<rect x="{x+8}" y="{y+10}" width="76" height="120" fill="#070d0e"/>')
    for i in range(4):
        x = 1600 - (70 + i * 118)
        y = 330 + i * 18
        s.append(f'<rect x="{x-92}" y="{y}" width="92" height="300" fill="#0a1214" stroke="#1c282a" stroke-width="3"/>')
        s.append(f'<rect x="{x-84}" y="{y+10}" width="76" height="120" fill="#070d0e"/>')
    # 路面
    s.append('<path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="#121a1b"/>')
    # 反光
    for i in range(7):
        s.append(f'<rect x="{200+i*180}" y="720" width="{random.randint(30,90)}" height="180" fill="#8fb0ab" opacity="0.05" filter="url(#b30)"/>')
    # 路灯
    for x in (420, 1180):
        s.append(f'<path d="M{x} 700 L{x} 300 L{x+30} 300" stroke="#1a2426" stroke-width="8" fill="none"/>')
        s.append(f'<circle cx="{x+30}" cy="300" r="10" fill="#cfe0da" opacity="0.45"/>')
        s.append(f'<ellipse cx="{x+30}" cy="310" rx="200" ry="150" fill="url(#lamp)" opacity="0.12" filter="url(#b30)"/>')
    s.append('<rect width="1600" height="900" fill="url(#dark)" opacity="0.15"/>')
    s += [fog(800, 640, 800, 160, .1), grain(0.09), vignet(0.9)]
    return frame("".join(s))


# ============================================================
#  外省第三中医院 · 深夜急诊室外（论坛故事）
# ============================================================
def hospital():
    s = [f'<rect width="{W}" height="{H}" fill="#0a0e11"/>']
    far_l, far_r, far_t, far_b = 620, 990, 250, 600
    s.append(f'<path d="M0 0 L{far_l} {far_t} L{far_l} {far_b} L0 900 Z" fill="#1c262b"/>')
    s.append(f'<path d="M1600 0 L{far_r} {far_t} L{far_r} {far_b} L1600 900 Z" fill="#151d21"/>')
    s.append(f'<path d="M0 0 L1600 0 L{far_r} {far_t} L{far_l} {far_t} Z" fill="#0f1618"/>')
    s.append(f'<path d="M0 900 L1600 900 L{far_r} {far_b} L{far_l} {far_b} Z" fill="#131b1e"/>')
    s.append(f'<rect x="{far_l}" y="{far_t}" width="{far_r-far_l}" height="{far_b-far_t}" fill="#06090b"/>')
    s.append(stain_rect(0, 0, 1600, 900, .35))
    # 医院特有的浅色墙裙
    s.append(f'<path d="M0 640 L{far_l} {far_b-24} L{far_l} {far_b} L0 720 Z" fill="#2c3a41" opacity="0.75"/>')
    s.append(f'<path d="M1600 640 L{far_r} {far_b-24} L{far_r} {far_b} L1600 720 Z" fill="#28353b" opacity="0.7"/>')
    for i in range(1, 7):
        s.append(f'<path d="M{-200+i*300} 900 L{620+i*60} {far_b}" stroke="#1b2428" stroke-width="2" opacity="0.55"/>')
    # 玻璃隔断 + 窗外走过的黑衫老人
    s.append('<path d="M110 210 L520 268 L520 566 L110 640 Z" fill="#0c171b" stroke="#33454b" stroke-width="10"/>')
    s.append('<path d="M315 238 L315 604 M110 430 L520 418" stroke="#26363b" stroke-width="8"/>')
    s.append('<g opacity="0.96" filter="url(#rough)">')
    s.append('<path d="M286 620 L286 402 C286 360 320 336 358 334 C396 336 428 362 428 402 L428 620 Z" fill="#040506"/>')
    s.append('<circle cx="357" cy="324" r="33" fill="#040506"/>')
    s.append('<ellipse cx="344" cy="322" rx="6" ry="4" fill="#b9c2b8" opacity="0.55"/>')
    s.append('</g>')
    s.append('<ellipse cx="315" cy="420" rx="230" ry="240" fill="#8fb0ab" opacity="0.10" filter="url(#b60)"/>')
    # 长椅 / 输液架
    s.append('<path d="M760 700 L1080 686 L1096 712 L744 728 Z" fill="#1a2429"/>')
    s.append('<path d="M780 726 L780 790 M1060 714 L1060 784" stroke="#121a1e" stroke-width="8"/>')
    s.append('<path d="M1180 470 L1180 720 M1148 470 L1212 470" stroke="#2a383e" stroke-width="6"/>')
    s.append('<path d="M1180 480 C1196 486 1204 500 1200 516" fill="none" stroke="#223036" stroke-width="4"/>')
    for x in (560, 980):
        s.append(f'<rect x="{x}" y="180" width="180" height="9" fill="#dbece5" opacity="0.65"/>')
        s.append(f'<ellipse cx="{x+90}" cy="220" rx="220" ry="150" fill="url(#lamp)" opacity="0.30" filter="url(#b30)"/>')
    s.append(light_cone(650, 190, 120, 620, 0.07))
    s.append('<rect width="1600" height="900" fill="#0d1a1f" opacity="0.28"/>')
    s += [fog(800, 660, 760, 170, .14), grain(0.10), vignet(0.95)]
    return frame("".join(s))


# ============================================================
#  二楼半 · 厕所外的旧走廊
# ============================================================
def corridor_2f():
    s = [f'<rect width="{W}" height="{H}" fill="#070a0b"/>']
    far_l, far_r, far_t, far_b = 700, 900, 300, 560
    s.append(f'<path d="M0 0 L{far_l} {far_t} L{far_l} {far_b} L0 900 Z" fill="#16201f"/>')
    s.append(f'<path d="M1600 0 L{far_r} {far_t} L{far_r} {far_b} L1600 900 Z" fill="#121a19"/>')
    s.append(f'<path d="M0 0 L1600 0 L{far_r} {far_t} L{far_l} {far_t} Z" fill="#0c1211"/>')
    s.append(f'<path d="M0 900 L1600 900 L{far_r} {far_b} L{far_l} {far_b} Z" fill="#101716"/>')
    s.append(f'<rect x="{far_l}" y="{far_t}" width="{far_r-far_l}" height="{far_b-far_t}" fill="#030505"/>')
    s.append(f'<path d="M0 600 L{far_l} {far_b-20} L{far_l} {far_b} L0 690 Z" fill="#1b2a2c"/>')
    for i in range(1, 9):
        s.append(f'<path d="M{-150+i*260} 900 L{far_l} {far_b}" stroke="#1f2e30" stroke-width="2" opacity="0.5"/>')
    s.append(stain_rect(0, 0, 1600, 900, .5))
    s.append('<ellipse cx="700" cy="800" rx="620" ry="130" fill="#7f9b98" opacity="0.06" filter="url(#b60)"/>')
    # 半开的厕所门 + 门缝里那只惨白的手
    s.append('<path d="M300 300 L470 320 L470 700 L300 740 Z" fill="#0b1213" stroke="#2c3c3e" stroke-width="6"/>')
    s.append('<path d="M470 320 L510 330 L510 690 L470 700 Z" fill="#050a0a"/>')
    s.append('<g opacity="0.95">')
    s.append('<path d="M498 470 C516 462 530 470 532 486 C534 502 522 514 506 512 C494 510 490 490 498 470 Z" fill="#cfd6cf"/>')
    s.append('<path d="M506 512 C510 530 508 548 502 560" stroke="#cfd6cf" stroke-width="10" fill="none" stroke-linecap="round"/>')
    s.append('</g>')
    # 拖把池与水管
    s.append('<path d="M1180 640 L1400 620 L1420 700 L1160 724 Z" fill="#182324"/>')
    s.append('<path d="M1250 520 L1250 640 M1250 520 L1290 520" stroke="#2a3a3c" stroke-width="7" fill="none"/>')
    s.append('<path d="M1290 528 L1290 560" stroke="#8fb0ab" stroke-width="2" opacity="0.4"/>')
    s.append('<ellipse cx="1300" cy="700" rx="120" ry="24" fill="#0d1414"/>')
    # 只剩一根在闪的日光灯
    s.append('<rect x="700" y="150" width="220" height="9" fill="#cfe0da" opacity="0.45"/>')
    s.append('<ellipse cx="810" cy="200" rx="300" ry="200" fill="url(#lamp)" opacity="0.20" filter="url(#b30)"/>')
    s.append(light_cone(810, 160, 150, 640, 0.06))
    s.append(f'<circle cx="{far_l+60}" cy="{far_b-60}" r="44" fill="url(#red)" opacity="0.32"/>')
    s += [fog(760, 640, 760, 180, .16), grain(0.11), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  无尽黑暗（手机灯只能照到一米）
# ============================================================
def void_dark():
    s = [f'<rect width="{W}" height="{H}" fill="#030405"/>']
    s.append('<ellipse cx="800" cy="480" rx="900" ry="560" fill="#0a1113" opacity="0.75" filter="url(#b60)"/>')
    s.append('<path d="M0 780 C300 750 520 770 800 762 C1100 754 1320 780 1600 750 L1600 900 L0 900 Z" fill="#080d0e"/>')
    s.append('<ellipse cx="820" cy="820" rx="520" ry="90" fill="#7f9b98" opacity="0.05" filter="url(#b60)"/>')
    # 手机灯：一束很窄的光
    s.append('<path d="M700 620 L900 620 L980 900 L620 900 Z" fill="#cfe0da" opacity="0.10" filter="url(#b30)"/>')
    s.append('<path d="M760 700 L860 700 L900 900 L720 900 Z" fill="#dbece5" opacity="0.07" filter="url(#b30)"/>')
    s.append('<path d="M660 806 L940 800 L980 872 L620 880 Z" fill="#132022" opacity="0.9"/>')
    for i in range(4):
        s.append(f'<path d="M{680+i*80} 806 L{700+i*80} 876" stroke="#1d2c2e" stroke-width="2" opacity="0.6"/>')
    # 远处的一点红光
    s.append('<ellipse cx="1180" cy="560" rx="260" ry="200" fill="url(#red)" opacity="0.10" filter="url(#b60)"/>')
    s.append('<ellipse cx="1180" cy="560" rx="80" ry="60" fill="url(#red)" opacity="0.18"/>')
    s.append('<circle cx="1180" cy="560" r="7" fill="#e8564a" opacity="0.85"/>')
    random.seed(17)
    for _ in range(70):
        x = random.uniform(600, 1000); y = random.uniform(280, 820)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(0.8,2.2):.1f}" fill="#cfe0da" opacity="{random.uniform(.05,.22):.2f}"/>')
    s.append('<path d="M0 0 L0 900 L240 900 L300 0 Z" fill="#050808" opacity="0.7" filter="url(#b30)"/>')
    s.append('<path d="M1600 0 L1600 900 L1360 900 L1300 0 Z" fill="#050808" opacity="0.7" filter="url(#b30)"/>')
    s += [grain(0.12), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  校园绿化林（方镜的那通电话）
# ============================================================
def woods():
    random.seed(23)
    s = [f'<rect width="{W}" height="{H}" fill="#080d0e"/>']
    s.append('<rect width="1600" height="620" fill="#0d1618"/>')
    s.append('<path d="M980 620 L980 300 L1560 250 L1560 620 Z" fill="#0a1112"/>')
    for i in range(10):
        s.append(f'<rect x="{1010+i*54}" y="{350+(i%3)*40}" width="30" height="42" fill="#121c1e" opacity="0.7"/>')
    s.append('<path d="M0 620 L1600 620 L1600 900 L0 900 Z" fill="#0b1213"/>')
    for depth, (base_y, scale, op) in enumerate([(900, 1.0, 0.95), (800, 0.8, 0.8), (720, 0.62, 0.65), (670, 0.48, 0.5)]):
        for i in range(5):
            x = 120 + i * (330 * scale) + depth * 60
            h = 420 * scale
            s.append(f'<g opacity="{op}" filter="url(#rough)">')
            s.append(f'<path d="M{x} {base_y} L{x-8} {base_y-h*0.75} L{x+10} {base_y-h} L{x+26} {base_y-h*0.7} L{x+18} {base_y} Z" fill="#0a0f10"/>')
            for k in range(3):
                ang = -0.9 + k * 0.85
                s.append(f'<path d="M{x+8} {base_y-h*0.72} q{28*ang:.0f} {-40*scale:.0f} {62*ang:.0f} {-62*scale:.0f}" stroke="#0a0f10" stroke-width="{6*scale:.1f}" fill="none"/>')
            s.append('</g>')
            if random.random() > 0.6:
                s.append(f'<ellipse cx="{x}" cy="{base_y-h*0.9:.0f}" rx="{90*scale:.0f}" ry="{60*scale:.0f}" fill="#0f1a18" opacity="0.5" filter="url(#b30)"/>')
    s.append('<path d="M620 640 L860 640 L900 780 L560 780 Z" fill="#9fd0c8" opacity="0.07" filter="url(#b30)"/>')
    s.append('<ellipse cx="740" cy="700" rx="180" ry="90" fill="#9fd0c8" opacity="0.08" filter="url(#b60)"/>')
    s.append('<path d="M600 640 L880 640 L920 800 L540 800 Z" fill="none" stroke="#6f8f86" stroke-width="2" opacity="0.18"/>')
    # 远处蹲着的人影（方镜）
    s.append('<g opacity="0.9" filter="url(#rough)">')
    s.append('<path d="M1160 660 C1140 660 1128 646 1128 626 C1128 604 1142 588 1162 588 C1182 588 1196 604 1196 626 L1196 660 Z" fill="#050708"/>')
    s.append('<ellipse cx="1162" cy="576" rx="24" ry="26" fill="#050708"/>')
    s.append('</g>')
    s += [fog(700, 660, 780, 170, .2), fog(300, 520, 420, 200, .1), grain(0.11), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  保安室（门、监控、玻璃上的手印）
# ============================================================
def guard_booth():
    s = [f'<rect width="{W}" height="{H}" fill="#080c0d"/>']
    s.append('<rect x="0" y="0" width="1600" height="900" fill="#121a1c"/>')
    s.append(stain_rect(0, 0, 1600, 900, .45))
    # 后窗：外面的马路一片黑
    s.append('<rect x="520" y="180" width="640" height="380" fill="#050a0b" stroke="#28383a" stroke-width="12"/>')
    s.append('<path d="M840 180 L840 560 M520 370 L1160 370" stroke="#223032" stroke-width="9"/>')
    s.append('<rect x="520" y="180" width="640" height="380" fill="#020404" opacity="0.7"/>')
    # 桌面
    s.append('<path d="M180 640 L1420 620 L1460 700 L140 730 Z" fill="#182325"/>')
    s.append('<path d="M180 640 L1420 620 L1420 638 L180 660 Z" fill="#243134"/>')
    # 监控屏墙（只有一格泛红）
    for i in range(6):
        x = 200 + (i % 3) * 200
        y = 300 + (i // 3) * 130
        s.append(f'<rect x="{x}" y="{y}" width="170" height="110" fill="#080e10" stroke="#2a3a3c" stroke-width="5"/>')
        s.append(f'<rect x="{x+8}" y="{y+8}" width="154" height="94" fill="#0a1114"/>')
        s.append(f'<path d="M{x+16} {y+92} l40 -30 l38 22 l44 -34" stroke="#1d2b2d" stroke-width="2" fill="none"/>')
    s.append('<rect x="620" y="300" width="170" height="110" fill="#141012" stroke="#3a2a2c" stroke-width="5"/>')
    s.append('<rect x="628" y="308" width="154" height="94" fill="#1a0f11"/>')
    s.append('<circle cx="636" cy="316" r="5" fill="#c8382f"/>')
    s.append('<path d="M700 380 L700 320" stroke="#7a1f1c" stroke-width="2" opacity="0.6"/>')
    # 椅子
    s.append('<path d="M1240 700 L1240 560 L1360 556 L1360 700 Z" fill="#111a1c"/>')
    s.append('<path d="M1252 700 L1252 800 M1350 700 L1350 800" stroke="#0b1214" stroke-width="10"/>')
    s.append('<path d="M1360 560 L1396 556 L1396 690 L1360 700 Z" fill="#0d1517"/>')
    # 桌上的对讲机 / 登记本 / 倒下的保温杯
    s.append('<rect x="420" y="604" width="120" height="26" rx="4" fill="#0d1517" stroke="#2b3a3d" stroke-width="3"/>')
    s.append('<rect x="470" y="588" width="18" height="18" fill="#0d1517" stroke="#2b3a3d" stroke-width="3"/>')
    s.append('<path d="M700 600 L860 592 L864 620 L704 628 Z" fill="#c9c4b8" opacity="0.5"/>')
    s.append('<path d="M980 626 C1010 618 1036 626 1038 644 C1040 662 1018 672 994 668 C976 664 972 640 980 626 Z" fill="#2b3739"/>')
    # 半开的门，外面是黑的
    s.append('<path d="M0 240 L300 200 L300 760 L0 820 Z" fill="#0a1113" stroke="#253436" stroke-width="8"/>')
    s.append('<path d="M300 200 L360 210 L360 750 L300 760 Z" fill="#030606"/>')
    s.append('<path d="M280 460 L280 500" stroke="#3b4a4c" stroke-width="6"/>')
    # 玻璃上的手印
    random.seed(29)
    for _ in range(9):
        x = random.uniform(560, 1120); y = random.uniform(200, 540)
        s.append(f'<path d="M{x:.0f} {y:.0f} C{x+16:.0f} {y-8:.0f} {x+30:.0f} {y+4:.0f} {x+28:.0f} {y+22:.0f} C{x+26:.0f} {y+40:.0f} {x+6:.0f} {y+44:.0f} {x-2:.0f} {y+28:.0f} C{x-8:.0f} {y+16:.0f} {x-6:.0f} {y+6:.0f} {x:.0f} {y:.0f} Z" fill="#8fa9a3" opacity="0.10" filter="url(#b6)"/>')
    s.append('<rect x="700" y="60" width="200" height="10" fill="#cfe0da" opacity="0.5"/>')
    s.append('<ellipse cx="800" cy="120" rx="300" ry="200" fill="url(#lamp)" opacity="0.22" filter="url(#b30)"/>')
    s.append(light_cone(800, 80, 150, 600, 0.07))
    s += [fog(800, 700, 700, 160, .12), grain(0.11), vignet(0.98)]
    return frame("".join(s))


# ============================================================
#  步行街 · 白天（天亮了，世界照常运转）
# ============================================================
def street_day():
    s = [f'<rect width="{W}" height="{H}" fill="#1b2226"/>']
    s.append('<rect width="1600" height="380" fill="#39474b"/>')
    s.append('<ellipse cx="1200" cy="240" rx="620" ry="220" fill="#c9c0a8" opacity="0.22" filter="url(#b60)"/>')
    s.append('<ellipse cx="400" cy="180" rx="520" ry="180" fill="#a9bcc0" opacity="0.12" filter="url(#b60)"/>')
    s.append('<path d="M760 380 L840 380 L900 900 L700 900 Z" fill="#2b383c"/>')
    s.append('<path d="M0 180 L520 260 L520 660 L0 880 Z" fill="#2a3538"/>')
    s.append('<path d="M1600 160 L1080 260 L1080 660 L1600 880 Z" fill="#273236"/>')
    for i in range(4):
        x = 50 + i * 120; y = 290 + i * 16
        s.append(f'<rect x="{x}" y="{y}" width="96" height="270" fill="#1e2a2d" stroke="#3c4a4e" stroke-width="3"/>')
        s.append(f'<rect x="{x+9}" y="{y+10}" width="78" height="110" fill="#141d20"/>')
        s.append(f'<rect x="{x+9}" y="{y+132}" width="78" height="120" fill="#182225" opacity="0.8"/>')
    for i in range(4):
        x = 1600 - (60 + i * 120); y = 290 + i * 16
        s.append(f'<rect x="{x-96}" y="{y}" width="96" height="270" fill="#1e2a2d" stroke="#3c4a4e" stroke-width="3"/>')
        s.append(f'<rect x="{x-87}" y="{y+10}" width="78" height="110" fill="#141d20"/>')
    s.append('<path d="M0 660 L1600 660 L1600 900 L0 900 Z" fill="#2f3a3d"/>')
    s.append('<path d="M0 760 L1600 760" stroke="#48565a" stroke-width="3" opacity="0.7"/>')
    for i in range(9):
        s.append(f'<path d="M{-100+i*220} 900 L{300+i*180} 660" stroke="#3a474a" stroke-width="2" opacity="0.5"/>')
    # 行人剪影
    for (x, sc, op) in [(300, 1.0, 0.85), (1080, 0.9, 0.75), (1320, 0.75, 0.6)]:
        y = 700 + (1 - sc) * 40
        s.append(f'<g opacity="{op}">')
        s.append(f'<ellipse cx="{x}" cy="{y-160*sc:.0f}" rx="{16*sc:.0f}" ry="{20*sc:.0f}" fill="#1a2427"/>')
        s.append(f'<path d="M{x-22*sc:.0f} {y} L{x-16*sc:.0f} {y-140*sc:.0f} L{x+16*sc:.0f} {y-140*sc:.0f} L{x+22*sc:.0f} {y} Z" fill="#1a2427"/>')
        s.append(f'<path d="M{x-14*sc:.0f} {y} L{x-12*sc:.0f} {y+56*sc:.0f} M{x+12*sc:.0f} {y} L{x+14*sc:.0f} {y+56*sc:.0f}" stroke="#1a2427" stroke-width="{9*sc:.1f}"/>')
        s.append('</g>')
    for x in (420, 1180):
        s.append(f'<path d="M{x} 660 L{x} 280 L{x+30} 280" stroke="#39474a" stroke-width="8" fill="none"/>')
        s.append(f'<circle cx="{x+30}" cy="282" r="9" fill="#e8e2cf" opacity="0.25"/>')
    # 早点摊的蒸汽
    s.append('<rect x="620" y="600" width="180" height="60" rx="6" fill="#39433f" opacity="0.9"/>')
    s.append('<ellipse cx="710" cy="560" rx="120" ry="70" fill="#e8e2cf" opacity="0.13" filter="url(#b30)"/>')
    s.append('<ellipse cx="710" cy="520" rx="80" ry="50" fill="#e8e2cf" opacity="0.10" filter="url(#b30)"/>')
    s.append('<rect width="1600" height="900" fill="#0d1416" opacity="0.10"/>')
    s += [fog(800, 620, 820, 150, .12), grain(0.08), vignet(0.82)]
    return frame("".join(s))


# ============================================================
#  医院 · 停尸间（论坛故事：那具尸体不见了）
# ============================================================
def morgue():
    s = [f'<rect width="{W}" height="{H}" fill="#0a1113"/>']
    s.append('<rect width="1600" height="900" fill="#101b1d"/>')
    s.append(stain_rect(0, 0, 1600, 900, .55))
    # 不锈钢抽屉墙（正面）
    s.append('<rect x="120" y="120" width="1360" height="560" fill="#182628"/>')
    for row in range(3):
        for col in range(6):
            x = 150 + col * 222
            y = 150 + row * 180
            s.append(f'<rect x="{x}" y="{y}" width="196" height="152" fill="#1e2f31" stroke="#33484a" stroke-width="5"/>')
            s.append(f'<rect x="{x+16}" y="{y+16}" width="164" height="120" fill="#162426"/>')
            s.append(f'<rect x="{x+62}" y="{y+96}" width="72" height="12" rx="3" fill="#4b6163"/>')
            s.append(f'<circle cx="{x+98}" cy="{y+60}" r="6" fill="#2b4143"/>')
            s.append(f'<path d="M{x+16} {y+16} L{x+180} {y+16}" stroke="#6d8587" stroke-width="2" opacity="0.35"/>')
    # 一个拉出来的抽屉（尸体盖着白布）
    s.append('<path d="M980 640 L1520 620 L1560 700 L940 726 Z" fill="#1b2b2d"/>')
    s.append('<path d="M980 646 L1520 626 L1552 690 L952 714 Z" fill="#c9c9c0" opacity="0.85"/>')
    s.append('<path d="M1010 650 C1120 636 1300 630 1460 626" fill="none" stroke="#8f918a" stroke-width="3" opacity="0.6"/>')
    s.append('<path d="M1000 700 C1120 690 1320 680 1500 672" fill="none" stroke="#8f918a" stroke-width="2" opacity="0.4"/>')
    s.append('<path d="M1240 640 C1256 632 1276 634 1284 646" fill="none" stroke="#9aa39c" stroke-width="2" opacity="0.5"/>')
    # 地面：水渍与地漏
    s.append('<path d="M0 680 L1600 680 L1600 900 L0 900 Z" fill="#0d1719"/>')
    s.append('<ellipse cx="760" cy="800" rx="150" ry="60" fill="#0a1213"/>')
    for i in range(3):
        s.append(f'<ellipse cx="760" cy="{800+i*8}" rx="{110-i*30}" ry="{40-i*10}" fill="none" stroke="#203436" stroke-width="2" opacity="0.6"/>')
    s.append('<ellipse cx="420" cy="742" rx="220" ry="34" fill="#7f9b98" opacity="0.06" filter="url(#b30)"/>')
    # 顶灯：一盏在摆的吊灯
    s.append('<path d="M420 0 L420 150" stroke="#25383a" stroke-width="4"/>')
    s.append('<path d="M330 150 L510 150 L480 186 L360 186 Z" fill="#2b3f41"/>')
    s.append('<ellipse cx="420" cy="196" rx="60" ry="20" fill="#dbece5" opacity="0.5"/>')
    s.append('<ellipse cx="420" cy="220" rx="260" ry="220" fill="url(#lamp)" opacity="0.28" filter="url(#b30)"/>')
    s.append(light_cone(420, 190, 120, 640, 0.08))
    # 温度显示 / 挂着的记录板
    s.append('<rect x="1330" y="90" width="180" height="120" fill="#0d1718" stroke="#2b4143" stroke-width="4"/>')
    s.append('<g fill="#9fd0c8" opacity="0.6" font-family="Consolas,monospace" font-size="34"><text x="1352" y="150">-12.4</text></g>')
    s.append('<rect x="120" y="90" width="150" height="110" fill="#c9c4b8" opacity="0.5"/>')
    s.append('<path d="M140 120 L250 120 M140 142 L250 142 M140 164 L220 164" stroke="#5a5f58" stroke-width="3" opacity="0.7"/>')
    s.append('<rect width="1600" height="900" fill="#0c1a1c" opacity="0.30"/>')
    s += [fog(700, 660, 720, 160, .14), grain(0.11), vignet(0.98)]
    return frame("".join(s))


# ============================================================
#  白天的空教室（事后）
# ============================================================
def classroom_after():
    s = [f'<rect width="{W}" height="{H}" fill="#1c2427"/>']
    # 后墙与黑板
    s.append('<rect x="440" y="170" width="720" height="530" fill="#2b3438"/>')
    s.append('<rect x="560" y="250" width="480" height="250" fill="#1a2a25"/>')
    s.append('<rect x="560" y="250" width="480" height="250" fill="none" stroke="#4a5a55" stroke-width="8"/>')
    s.append('<g fill="#cfd8cf" opacity="0.55" font-family="KaiTi,STKaiti,serif" font-size="30" letter-spacing="4">'
             '<text x="600" y="320">鬼无法被杀死。</text>'
             '<text x="600" y="378">能对付鬼的只有鬼。</text>'
             '<text x="600" y="436">洞察鬼的规律。</text></g>')
    s.append('<text x="600" y="272" fill="#8f9c95" opacity="0.4" font-family="KaiTi,STKaiti,serif" font-size="72">鬼</text>')
    # 侧墙与地板
    s.append('<path d="M0 0 L440 170 L440 700 L0 900 Z" fill="#222b2e"/>')
    s.append('<path d="M1600 0 L1160 170 L1160 700 L1600 900 Z" fill="#1e2629"/>')
    s.append('<path d="M0 0 L1600 0 L1160 170 L440 170 Z" fill="#242d30"/>')
    s.append('<path d="M0 900 L1600 900 L1160 700 L440 700 Z" fill="#283134"/>')
    for i in range(1, 9):
        s.append(f'<path d="M{440+i*80} 700 L{-200+i*200} 900" stroke="#333d40" stroke-width="2" opacity="0.6"/>')
    # 白天的窗光（斜射的光柱）
    s.append('<path d="M60 190 L300 250 L300 540 L60 640 Z" fill="#dbece5" opacity="0.16"/>')
    s.append('<path d="M60 190 L300 250 L300 540 L60 640 Z" fill="none" stroke="#5d6a6c" stroke-width="10"/>')
    s.append('<path d="M180 220 L180 590 M60 420 L300 400" stroke="#4d5a5c" stroke-width="8"/>')
    s.append('<path d="M300 250 L760 700 L520 780 L180 560 Z" fill="#cfe0da" opacity="0.10" filter="url(#b30)"/>')
    s.append('<path d="M300 250 L760 700 L620 760 L220 520 Z" fill="#e8f0e8" opacity="0.06" filter="url(#b30)"/>')
    # 翻倒的课桌与散落的书
    random.seed(31)
    for (x, y, w, h, rot) in [(300, 640, 150, 26, -8), (560, 700, 170, 28, 6), (860, 672, 160, 26, -14),
                              (1080, 730, 180, 30, 4)]:
        s.append(f'<g transform="rotate({rot} {x} {y})">')
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#3a4346"/>')
        s.append(f'<rect x="{x+12}" y="{y+h}" width="12" height="60" fill="#2b3437"/>')
        s.append(f'<rect x="{x+w-24}" y="{y+h}" width="12" height="60" fill="#2b3437"/>')
        s.append('</g>')
    for _ in range(14):
        x = random.uniform(260, 1240); y = random.uniform(620, 840)
        s.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{random.uniform(22,40):.0f}" height="{random.uniform(4,8):.0f}" fill="#c9c4b8" opacity="{random.uniform(.25,.5):.2f}" transform="rotate({random.uniform(-40,40):.0f} {x:.0f} {y:.0f})"/>')
    # 地上的深色痕（不画血，保持克制）
    s.append('<ellipse cx="700" cy="800" rx="150" ry="34" fill="#15191a" opacity="0.55" filter="url(#b14)"/>')
    s.append('<ellipse cx="1000" cy="836" rx="110" ry="26" fill="#15191a" opacity="0.45" filter="url(#b14)"/>')
    # 门口的警戒线（两条下垂的封条）
    s.append('<path d="M440 700 L440 618" stroke="#3a4346" stroke-width="10"/>')
    s.append('<path d="M1160 700 L1160 616" stroke="#3a4346" stroke-width="10"/>')
    for yy in (624, 652):
        s.append(f'<path d="M446 {yy} Q800 {yy+16} 1154 {yy-6}" fill="none" stroke="#c8b45a" stroke-width="7" opacity="0.72"/>')
        s.append(f'<path d="M446 {yy} Q800 {yy+16} 1154 {yy-6}" fill="none" stroke="#2b2b2b" stroke-width="7" opacity="0.42" stroke-dasharray="34 26"/>')
    s.append('<rect width="1600" height="900" fill="#dfe9e2" opacity="0.04"/>')
    s += [fog(820, 700, 780, 170, .16), grain(0.09), vignet(0.86)]
    return frame("".join(s))


# ============================================================
#  楼梯间 · 镜面（镜子里多了一个人）
# ============================================================
def stairwell_mirror():
    s = [f'<rect width="{W}" height="{H}" fill="#080c0d"/>']
    far_l, far_r, far_t, far_b = 560, 1060, 260, 640
    s.append(f'<path d="M0 0 L{far_l} {far_t} L{far_l} {far_b} L0 900 Z" fill="#182124"/>')
    s.append(f'<path d="M1600 0 L{far_r} {far_t} L{far_r} {far_b} L1600 900 Z" fill="#141c1f"/>')
    s.append(f'<path d="M0 0 L1600 0 L{far_r} {far_t} L{far_l} {far_t} Z" fill="#0d1315"/>')
    s.append(f'<path d="M0 900 L1600 900 L{far_r} {far_b} L{far_l} {far_b} Z" fill="#111819"/>')
    s.append(f'<rect x="{far_l}" y="{far_t}" width="{far_r-far_l}" height="{far_b-far_t}" fill="#040707"/>')
    s.append(stain_rect(0, 0, 1600, 900, .55))
    # 台阶（向右下）
    for i in range(7):
        y = 600 + i * 42
        x = 820 - i * 24
        s.append(f'<path d="M{x} {y} L{x+700} {y-56} L{x+700} {y-16} L{x} {y+26} Z" fill="#131b1d"/>')
        s.append(f'<path d="M{x} {y} L{x+700} {y-56}" stroke="#2b3a3c" stroke-width="3" opacity="0.8"/>')
    # 扶手
    s.append('<path d="M880 560 L1560 430" stroke="#33454a" stroke-width="8"/>')
    for i in range(8):
        s.append(f'<path d="M{900+i*86} {566-i*17} L{900+i*86} {666-i*17}" stroke="#26363a" stroke-width="5"/>')
    # 休息平台的墙上挂着一面镜子
    s.append('<rect x="150" y="240" width="420" height="330" fill="#0f1719" stroke="#3b4b4e" stroke-width="12"/>')
    s.append('<rect x="170" y="258" width="380" height="294" fill="#16232a"/>')
    # 镜中的楼梯（比现实更暗、更空，多一个站着的人）
    s.append('<path d="M170 552 L550 552 L550 470 L170 470 Z" fill="#0c1518"/>')
    for i in range(5):
        y = 552 - i * 22
        s.append(f'<path d="M{170+i*14} {y} L{550} {y-10}" stroke="#223034" stroke-width="2" opacity="0.8"/>')
    s.append('<g opacity="0.95" filter="url(#rough)">')
    s.append('<path d="M352 552 L352 400 C352 372 372 356 396 356 C420 356 440 374 440 400 L440 552 Z" fill="#05090a"/>')
    s.append('<circle cx="396" cy="348" r="26" fill="#05090a"/>')
    s.append('<ellipse cx="386" cy="346" rx="5" ry="4" fill="#cfe0da" opacity="0.5"/>')
    s.append('</g>')
    # 镜面反光斜条
    s.append('<path d="M190 552 L330 258 L420 258 L280 552 Z" fill="#dfe9e2" opacity="0.05"/>')
    s.append('<path d="M300 552 L440 258 L470 258 L330 552 Z" fill="#dfe9e2" opacity="0.03"/>')
    # 现实一侧的窗（月光）
    s.append('<path d="M1180 220 L1500 180 L1500 470 L1180 520 Z" fill="#0b1417" stroke="#2b3a3d" stroke-width="10"/>')
    s.append('<path d="M1340 200 L1340 496 M1180 350 L1500 328" stroke="#223033" stroke-width="8"/>')
    s.append('<ellipse cx="1340" cy="340" rx="260" ry="220" fill="#8fb0ab" opacity="0.10" filter="url(#b60)"/>')
    s.append(light_cone(1340, 300, 140, 560, 0.06))
    # 应急灯与黑暗
    s.append('<rect x="600" y="200" width="46" height="16" fill="#cfe0da" opacity="0.5"/>')
    s.append('<ellipse cx="623" cy="210" rx="180" ry="140" fill="url(#lamp)" opacity="0.18" filter="url(#b30)"/>')
    s.append('<ellipse cx="420" cy="420" rx="360" ry="300" fill="#020303" opacity="0.45" filter="url(#b60)"/>')
    s += [fog(760, 660, 760, 170, .14), grain(0.11), vignet(1.0)]
    return frame("".join(s))


# ============================================================
#  步行街 · 夜晚（和清晨对照）
# ============================================================
def street_night():
    s = [f'<rect width="{W}" height="{H}" fill="#06090b"/>']
    s.append('<rect width="1600" height="400" fill="#0a1013"/>')
    s.append('<ellipse cx="800" cy="120" rx="700" ry="220" fill="#1b2a2e" opacity="0.5" filter="url(#b60)"/>')
    s.append('<path d="M760 400 L840 400 L900 900 L700 900 Z" fill="#0a1113"/>')
    # 两侧卷帘门（全部拉下）
    s.append('<path d="M0 200 L520 280 L520 660 L0 860 Z" fill="#0e1618"/>')
    s.append('<path d="M1600 180 L1080 280 L1080 660 L1600 860 Z" fill="#0c1416"/>')
    for i in range(5):
        x = 30 + i * 100
        s.append(f'<rect x="{x}" y="{300+i*14}" width="86" height="300" fill="#121b1d" stroke="#223033" stroke-width="3"/>')
        for k in range(9):
            s.append(f'<path d="M{x} {310+i*14+k*32} L{x+86} {310+i*14+k*32}" stroke="#1a2628" stroke-width="3"/>')
    for i in range(5):
        x = 1600 - (40 + i * 100)
        s.append(f'<rect x="{x-86}" y="{300+i*14}" width="86" height="300" fill="#121b1d" stroke="#223033" stroke-width="3"/>')
        for k in range(9):
            s.append(f'<path d="M{x-86} {310+i*14+k*32} L{x} {310+i*14+k*32}" stroke="#1a2628" stroke-width="3"/>')
    # 招牌（熄灭的霓虹，只剩轮廓）
    s.append('<rect x="120" y="200" width="240" height="56" fill="#0d1719" stroke="#2b3f42" stroke-width="4"/>')
    s.append('<rect x="1120" y="210" width="260" height="58" fill="#0d1719" stroke="#2b3f42" stroke-width="4"/>')
    s.append('<path d="M150 228 L330 228 M150 246 L290 246" stroke="#2b3f42" stroke-width="6" opacity="0.6"/>')
    # 湿路面 + 倒影
    s.append('<path d="M0 660 L1600 660 L1600 900 L0 900 Z" fill="#0b1214"/>')
    for i in range(6):
        x = 180 + i * 240
        s.append(f'<rect x="{x}" y="680" width="{random.randint(40,110)}" height="200" fill="#8fb0ab" opacity="0.045" filter="url(#b30)"/>')
    s.append('<ellipse cx="800" cy="740" rx="700" ry="120" fill="#7f9b98" opacity="0.04" filter="url(#b60)"/>')
    # 唯一还亮着的路灯（发红、在闪）
    s.append('<path d="M420 660 L420 300 L452 300" stroke="#1c2628" stroke-width="9" fill="none"/>')
    s.append('<circle cx="452" cy="300" r="11" fill="#c8382f" opacity="0.85"/>')
    s.append('<ellipse cx="452" cy="310" rx="230" ry="180" fill="url(#red)" opacity="0.22" filter="url(#b30)"/>')
    s.append('<ellipse cx="452" cy="330" rx="120" ry="90" fill="#e8564a" opacity="0.10" filter="url(#b30)"/>')
    # 远处一个站着不动的人影
    s.append('<g opacity="0.9" filter="url(#rough)">')
    s.append('<path d="M1180 700 L1180 560 C1180 530 1198 512 1222 512 C1246 512 1264 530 1264 560 L1264 700 Z" fill="#050809"/>')
    s.append('<circle cx="1222" cy="502" r="24" fill="#050809"/>')
    s.append('</g>')
    s.append('<rect width="1600" height="900" fill="#04080a" opacity="0.25"/>')
    s += [fog(800, 660, 820, 150, .10), grain(0.11), vignet(1.0)]
    return frame("".join(s))


EXPOSURE = {
    "room_night": 1.55, "classroom": 1.15, "classroom_early": 1.2, "classroom_ghost": 1.15, "corridor_dark": 1.45,
    "stairwell": 1.5, "toilet": 1.55, "bone_tree": 1.05, "playground": 1.45,
    "school_gate": 1.6, "street_dawn": 1.3,
    "hospital": 1.25, "corridor_2f": 1.5, "void_dark": 1.9, "woods": 1.45,
    "guard_booth": 1.5, "street_day": 1.15,
    "morgue": 1.3, "classroom_after": 1.0, "stairwell_mirror": 1.45, "street_night": 1.5,
}

SCENES = {
    "room_night": room_night,
    "classroom": lambda: classroom(False),
    "classroom_early": lambda: classroom(False, board=False),
    "classroom_ghost": lambda: classroom(True),
    "corridor_dark": corridor,
    "stairwell": stairwell,
    "toilet": toilet,
    "bone_tree": bone_tree,
    "playground": playground,
    "school_gate": school_gate,
    "street_dawn": street_dawn,
    "hospital": hospital,
    "corridor_2f": corridor_2f,
    "void_dark": void_dark,
    "woods": woods,
    "guard_booth": guard_booth,
    "street_day": street_day,
    "morgue": morgue,
    "classroom_after": classroom_after,
    "stairwell_mirror": stairwell_mirror,
    "street_night": street_night,
    # 封面不由本脚本生成：启动页用的是 art/ui/title.jpg（教室·门外有人那张）
}


def render(name, svg):
    os.makedirs(BUILD, exist_ok=True)
    sp = os.path.join(BUILD, "scene_" + name + ".svg")
    pp = os.path.join(BUILD, "scene_" + name + ".png")
    open(sp, "w", encoding="utf-8").write(svg)
    if os.path.exists(pp):
        os.remove(pp)
    cmd = [EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
           "--force-device-scale-factor=1", "--default-background-color=ff000000",
           f"--user-data-dir={os.path.join(BUILD,'edge-profile')}", "--virtual-time-budget=2500",
           f"--window-size={W},{H}", f"--screenshot={pp}", "file:///" + sp.replace("\\", "/")]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    for _ in range(80):
        if os.path.exists(pp) and os.path.getsize(pp) > 1000:
            break
        time.sleep(0.1)
    return pp


def post(src, dst, exp=1.0):
    from PIL import Image
    import numpy as np
    im = Image.open(src).convert("RGB")
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    arr = np.asarray(im).astype(np.float32)
    l = arr @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    arr = arr * 0.62 + l[..., None] * 0.38
    arr[..., 2] *= 1.06
    arr = np.clip(arr * (1.26 * exp) + 8, 0, 255).astype(np.uint8)
    im = Image.fromarray(arr)
    im.save(dst, quality=90, optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or list(SCENES.keys())
    for name in only:
        pp = render(name, SCENES[name]())
        dst = os.path.join(OUT, name + ".jpg")
        try:
            post(pp, dst, EXPOSURE.get(name, 1.3))
            print("OK", name, os.path.getsize(dst))
        except Exception as e:
            print("FAIL", name, repr(e))


if __name__ == "__main__":
    main()


