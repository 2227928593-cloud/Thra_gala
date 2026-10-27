# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  人物立绘（低调逆光剪影）
统一规范：
  · 1000x1400，半身，侧 3/4 面向左
  · 单一冷光源在人物前方（左），只勾亮轮廓；面部大部分沉入暗部
  · 三个明度层：发/衣（近黑）、身体暗面（墨）、受光轮廓（骨白/冷灰）
  · 全部角色共用同一套轮廓骨架、同一套后期（纸纹 + 网点 + 套色）
"""
import math, os, random, subprocess, sys, time

W, H = 1000, 1400
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "tools", "_build")
OUT = os.path.join(ROOT, "art", "characters")
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

INK = "#08090b"
INK2 = "#0e1114"
HAIR = "#050506"
RIM = "#dfe9e4"
WARM = "#c9a98f"


# ---------------- 平滑折线 ----------------
def smooth(pts, closed=True, tension=1.0):
    n = len(pts)
    d = []
    if not pts:
        return ""
    d.append(f"M{pts[0][0]:.1f} {pts[0][1]:.1f}")
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed else pts[max(0, i - 1)]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed else pts[min(n - 1, i + 2)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension)
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    if closed:
        d.append("Z")
    return " ".join(d)


# ---------------- 基础轮廓：面向左的侧脸 ----------------
def outline(dx=0, dy=0, lean=0.0):
    """front(上->下) + 背部(下->上) 的完整闭合轮廓"""
    o = lambda x, y: (x + dx + lean * (1400 - y) * 0.05, y + dy)
    front = [
        (500, 318), (464, 324), (434, 340), (418, 368), (410, 400),
        (404, 432), (400, 458), (394, 484), (388, 506), (380, 524),
        (370, 540), (375, 554), (386, 562), (392, 570), (390, 578),
        (396, 586), (402, 596), (412, 604), (426, 612), (442, 620),
        (450, 632), (444, 644), (432, 650), (428, 666), (434, 686),
        (438, 712), (442, 744), (442, 776),
        (408, 790), (362, 820), (324, 868), (302, 936), (292, 1040), (284, 1400),
    ]
    back = [
        (724, 1400), (718, 1180), (710, 1030), (694, 960), (660, 900),
        (600, 870), (552, 830), (544, 780), (548, 730), (556, 690),
        (566, 650), (588, 604), (616, 556), (632, 500), (630, 442),
        (618, 392), (596, 352), (566, 330), (534, 318),
    ]
    return [o(*p) for p in front] + [o(*p) for p in back]


FRONT_END = 33   # 前轮廓在肩头处结束
BROW_I, NOSE_I, CHIN_I = 4, 10, 17


def rim_path(pts, i0=0, i1=FRONT_END):
    seg = pts[i0:i1]
    return smooth(seg, closed=False)


def defs(p):
    return f"""<defs>
  <filter id="g1"><feGaussianBlur stdDeviation="1.2"/></filter>
  <filter id="g4"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="g10"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="g22"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="8" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="4"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <linearGradient id="faceG" gradientUnits="userSpaceOnUse" x1="368" y1="420" x2="540" y2="600">
    <stop offset="0" stop-color="{p.get('face_lit','#d8bda4')}"/>
    <stop offset="0.09" stop-color="{p.get('face_mid','#8a6d61')}"/>
    <stop offset="0.24" stop-color="#6a5048"/>
    <stop offset="0.50" stop-color="#2a2022"/>
    <stop offset="0.78" stop-color="#121012"/>
    <stop offset="1" stop-color="#08080a"/>
  </linearGradient>
  <linearGradient id="bodyG" gradientUnits="userSpaceOnUse" x1="286" y1="900" x2="600" y2="1200">
    <stop offset="0" stop-color="#39434a"/>
    <stop offset="0.18" stop-color="#1b2126"/>
    <stop offset="0.55" stop-color="#0d1013"/>
    <stop offset="1" stop-color="#070809"/>
  </linearGradient>
  <linearGradient id="rimG" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0" stop-color="{p.get('rim', RIM)}" stop-opacity="0.0"/>
    <stop offset="0.16" stop-color="{p.get('rim', RIM)}" stop-opacity="0.95"/>
    <stop offset="0.42" stop-color="#eaf1ec" stop-opacity="0.9"/>
    <stop offset="0.62" stop-color="{p.get('rim', RIM)}" stop-opacity="0.5"/>
    <stop offset="1" stop-color="{p.get('rim', RIM)}" stop-opacity="0.05"/>
  </linearGradient>
  <radialGradient id="haloG"><stop offset="0" stop-color="{p.get('rim', '#9fb9b4')}" stop-opacity="0.18"/><stop offset="1" stop-color="#9fb9b4" stop-opacity="0"/></radialGradient>
</defs>"""


# ---------------- 头发 ----------------
def hair_shape(p, pts):
    """覆盖在轮廓上的深色发形；与轮廓同为近黑，靠外沿微光区分"""
    style = p["style"]
    dx = p.get("hdx", 0); dy = p.get("hdy", 0)
    ox, oy = dx, dy
    if style == "bald":
        return (f'<path d="M{412+ox} {392+oy} C{400+ox} 430 {398+ox} 470 {406+ox} 500 L{420+ox} 494 '
                f'C{412+ox} 466 {414+ox} 432 {424+ox} 404 Z" fill="{HAIR}" opacity="0.95"/>'
                f'<path d="M{600+ox} {400+oy} C{614+ox} 450 {618+ox} 520 {612+ox} 580 L{596+ox} 576 '
                f'C{602+ox} 520 {600+ox} 460 {588+ox} 416 Z" fill="{HAIR}" opacity="0.85"/>')
    if style == "long":
        return (f'<path d="M{556+ox} {326+oy} C{636+ox} 344 {680+ox} 400 {684+ox} 470 C{686+ox} 540 {694+ox} 660 {704+ox} 800 '
                f'C{708+ox} 870 {692+ox} 900 {668+ox} 886 C{652+ox} 820 {650+ox} 760 {654+ox} 706 '
                f'C{638+ox} 742 {620+ox} 764 {604+ox} 774 L{598+ox} 690 C{620+ox} 636 {628+ox} 566 {622+ox} 504 '
                f'C{616+ox} 452 {600+ox} 408 {574+ox} 382 Z" fill="{HAIR}" filter="url(#rough)"/>'
                f'<path d="M{556+ox} {326+oy} C{636+ox} 344 {680+ox} 400 {684+ox} 470 C{686+ox} 540 {694+ox} 660 {704+ox} 800" '
                f'fill="none" stroke="url(#rimG)" stroke-width="2.4" opacity="0.3" filter="url(#g1)"/>')
    if style == "ponytail":
        return (f'<path d="M{558+ox} {332+oy} C{628+ox} 350 {662+ox} 402 {664+ox} 462 C{666+ox} 508 {676+ox} 552 {700+ox} 590 '
                f'C{726+ox} 630 {736+ox} 682 {722+ox} 724 C{702+ox} 700 {682+ox} 680 {668+ox} 668 '
                f'C{638+ox} 702 {616+ox} 724 {598+ox} 732 L{596+ox} 682 C{616+ox} 638 {624+ox} 576 {620+ox} 514 '
                f'C{616+ox} 458 {598+ox} 410 {572+ox} 380 Z" fill="{HAIR}" filter="url(#rough)"/>'
                f'<path d="M{558+ox} {332+oy} C{628+ox} 350 {662+ox} 402 {664+ox} 462 C{666+ox} 508 {676+ox} 552 {700+ox} 590" '
                f'fill="none" stroke="url(#rimG)" stroke-width="2.4" opacity="0.3" filter="url(#g1)"/>')
    if style == "neat":
        return (f'<path d="M{416+ox} {402+oy} C{430+ox} 348 {466+ox} 320 {510+ox} 314 C{562+ox} 308 {602+ox} 332 {626+ox} 374 '
                f'C{644+ox} 406 {648+ox} 454 {644+ox} 500 C{640+ox} 548 {632+ox} 592 {622+ox} 630 '
                f'C{616+ox} 654 {604+ox} 666 {596+ox} 654 C{602+ox} 614 {604+ox} 570 {600+ox} 532 '
                f'C{594+ox} 488 {580+ox} 454 {554+ox} 432 C{526+ox} 408 {492+ox} 404 {468+ox} 420 '
                f'C{456+ox} 430 {446+ox} 446 {440+ox} 464 C{434+ox} 482 {424+ox} 478 {422+ox} 456 '
                f'C{420+ox} 432 {420+ox} 416 {416+ox} 402 Z" fill="{HAIR}" filter="url(#rough)"/>')
    # messy / spiky
    return (f'<path d="M{414+ox} {404+oy} C{428+ox} 350 {466+ox} 322 {510+ox} 316 C{564+ox} 308 {606+ox} 334 {630+ox} 376 '
            f'C{648+ox} 408 {652+ox} 458 {648+ox} 504 C{644+ox} 552 {636+ox} 596 {624+ox} 634 '
            f'C{618+ox} 658 {606+ox} 670 {598+ox} 656 C{604+ox} 616 {606+ox} 572 {602+ox} 534 '
            f'C{596+ox} 490 {582+ox} 456 {556+ox} 434 C{528+ox} 410 {494+ox} 406 {470+ox} 422 '
            f'L{478+ox} {448+oy} L{454+ox} {462+oy} L{466+ox} {486+oy} L{442+ox} {498+oy} '
            f'L{450+ox} {462+oy} L{432+ox} {440+oy} L{438+ox} {416+oy} Z" fill="{HAIR}" filter="url(#rough)"/>')


def hair_rim(p, pts):
    """头顶与发梢的细光"""
    style = p["style"]
    if style == "bald":
        return ""
    dx = p.get("hdx", 0); dy = p.get("hdy", 0)
    if style == "long":
        top = "M416 402 C430 350 466 322 510 316 C562 308 604 334 628 376"
        tail = "M558 332 C628 350 662 402 664 462 C666 508 676 552 700 590"
    elif style == "ponytail":
        top = "M416 402 C430 350 466 322 510 316 C562 308 604 334 628 376"
        tail = "M558 332 C628 350 662 402 664 462 C666 508 676 552 700 590"
    else:
        top = "M414 402 C428 350 466 322 510 316 C562 308 604 334 628 376"
        tail = ""
    s = (f'<path d="{top}" fill="none" stroke="url(#rimG)" stroke-width="4" opacity="0.7" filter="url(#g1)"/>'
         f'<path d="{top}" fill="none" stroke="{RIM}" stroke-width="6" opacity="0.18" filter="url(#g4)"/>'
         f'<path d="{top}" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.7"/>')
    if tail:
        s += (f'<path d="{tail}" fill="none" stroke="url(#rimG)" stroke-width="2.6" opacity="0.45" filter="url(#g1)"/>')
    return s


# ---------------- 服装 ----------------
def clothing(p, pts):
    col = p["collar"]
    s = []
    if col == "hoodie":
        s.append('<path d="M436 852 C486 800 586 806 626 862 C660 908 672 940 664 966 C636 936 600 918 552 912 C502 906 462 916 430 940 C418 912 414 884 436 852 Z" fill="#0c0f12" filter="url(#rough)"/>')
        s.append('<path d="M440 854 C492 812 582 816 620 864" fill="none" stroke="#6c7a7e" stroke-width="2.5" opacity="0.35" filter="url(#g1)"/>')
    if col == "trench":
        s.append('<path d="M432 846 C482 806 590 810 632 868 L664 966 C612 940 556 930 500 930 C458 930 420 938 388 958 L414 872 Z" fill="#0b0e11" filter="url(#rough)"/>')
        s.append('<path d="M436 850 C486 812 586 816 628 870" fill="none" stroke="#7a888c" stroke-width="2.5" opacity="0.4" filter="url(#g1)"/>')
        s.append('<path d="M470 940 L470 1400" stroke="#000" stroke-opacity="0.5" stroke-width="3"/>')
        s.append('<path d="M470 940 L470 1400" stroke="#5c686c" stroke-width="1" opacity="0.2"/>')
    if col == "shirt":
        s.append('<path d="M440 848 C500 820 580 824 620 864 L636 952 L560 928 L520 916 L470 918 L414 940 L400 880 Z" fill="#171b1f"/>')
        s.append('<path d="M444 852 C502 828 576 832 616 868" fill="none" stroke="#8896a0" stroke-width="2" opacity="0.4"/>')
        s.append('<path d="M520 916 L500 1000 L540 1060" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>')
    if col == "jacket":
        s.append('<path d="M438 850 C500 818 584 822 624 866 L640 956 L552 922 L512 912 L466 918 L406 946 L392 878 Z" fill="#151a1e"/>')
        s.append('<path d="M441 853 C502 824 580 828 621 870" fill="none" stroke="#7d8b90" stroke-width="2" opacity="0.45"/>')
        s.append('<path d="M466 918 L512 912 L552 922 L600 1400 L430 1400 Z" fill="#0f1316" opacity="0.85"/>')
        s.append('<path d="M508 916 L508 1400" stroke="#000" stroke-opacity="0.6" stroke-width="3"/>')
        s.append('<path d="M508 916 L508 1400" stroke="#5d6a6e" stroke-width="0.8" opacity="0.2"/>')
    if col == "changshan":
        s.append('<path d="M428 846 C488 812 590 816 634 872 L648 966 L520 930 L470 940 L396 962 L412 868 Z" fill="#0a0b0d"/>')
        s.append('<path d="M500 930 C520 960 522 990 512 1010" fill="none" stroke="#000" stroke-opacity="0.6" stroke-width="3"/>')
        for k in range(4):
            y = 1000 + k * 92
            s.append(f'<circle cx="516" cy="{y}" r="5" fill="#1d1f22"/><circle cx="516" cy="{y}" r="2" fill="#4a4c50" opacity="0.8"/>')
    return "".join(s)


def weight(p):
    """体型：瘦削 / 壮 / 驼背，通过在轮廓外侧补形"""
    s = []
    if p.get("belly"):
        s.append('<path d="M300 1050 C310 1140 320 1260 316 1400 L700 1400 C706 1250 700 1120 690 1040 C640 1090 560 1110 500 1100 C430 1090 350 1080 300 1050 Z" fill="#0b0d0f" filter="url(#rough)"/>')
        s.append('<path d="M304 1090 C360 1140 430 1160 500 1150" fill="none" stroke="#5f6b6e" stroke-width="2" opacity="0.2" filter="url(#g4)"/>')
    if p.get("hunch"):
        s.append('<path d="M600 820 C650 850 690 910 706 980 L640 990 C630 930 616 880 580 850 Z" fill="#0a0b0d" filter="url(#rough)"/>')
    return "".join(s)


# ---------------- 五官微光 ----------------
def eye_glint(p):
    col = p.get("eye_glow", "#e8e2d2")
    r = p.get("eye_r", 7)
    ex, ey = 416 + p.get("hdx", 0), 452 + p.get("hdy", 0)
    if p.get("no_eye"):
        return ""
    # 眼睑阴影
    lid = (f'<path d="M{ex-16} {ey-2} C{ex-8} {ey-14} {ex+8} {ey-15} {ex+16} {ey-6}" '
           f'fill="none" stroke="#0a0809" stroke-width="3" opacity="0.8"/>')
    s = [lid,
         f'<ellipse cx="{ex}" cy="{ey}" rx="{r*2.6}" ry="{r*1.3}" fill="{col}" opacity="0.1" filter="url(#g4)"/>',
         f'<ellipse cx="{ex}" cy="{ey}" rx="{r*1.15}" ry="{r*0.56:.1f}" fill="{col}" opacity="0.8"/>',
         f'<circle cx="{ex+1}" cy="{ey}" r="{r*0.3:.1f}" fill="#0a0808"/>']
    if p.get("eye_red"):
        s = [lid,
             f'<ellipse cx="{ex}" cy="{ey}" rx="{r*4.2}" ry="{r*2.0}" fill="#c0382e" opacity="0.2" filter="url(#g10)"/>',
             f'<ellipse cx="{ex}" cy="{ey}" rx="{r*1.3}" ry="{r*0.72}" fill="#e8564a" opacity="0.95"/>',
             f'<circle cx="{ex+1}" cy="{ey}" r="{r*0.34}" fill="#2a0705"/>']
    return "".join(s)


def face_details(p):
    """眉线、唇缝、颧骨的一点点受光"""
    dx = p.get("hdx", 0); dy = p.get("hdy", 0)
    s = []
    s.append(f'<path d="M{394+dx} {404+dy} C{408+dx} {396+dy} {428+dx} {395+dy} {442+dx} {400+dy}" fill="none" stroke="{RIM}" stroke-width="2" opacity="0.18" filter="url(#g1)"/>')
    s.append(f'<path d="M{384+dx} {570+dy} C{392+dx} {566+dy} {402+dx} {567+dy} {410+dx} {571+dy}" fill="none" stroke="{RIM}" stroke-width="1.6" opacity="0.22" filter="url(#g1)"/>')
    s.append(f'<path d="M{424+dx} {616+dy} C{436+dx} {622+dy} {444+dx} {630+dy} {442+dx} {642+dy}" fill="none" stroke="{RIM}" stroke-width="1.4" opacity="0.14" filter="url(#g1)"/>')
    # 耳廓
    s.append(f'<path d="M{452+dx} {478+dy} C{466+dx} {472+dy} {474+dx} {484+dy} {468+dx} {502+dy} C{462+dx} {516+dy} {450+dx} {514+dy} {448+dx} {500+dy}" fill="none" stroke="#c9a78e" stroke-width="1.6" opacity="0.14"/>')
    return "".join(s)


# ---------------- 角色 ----------------
BASE = dict(style="messy", collar="jacket", face_lit="#cbb29c", face_mid="#6b5650",
            eye_glow="#e8e2d2", eye_r=7, hdx=0, hdy=0, lean=0.0,
            belly=False, hunch=False, hair=HAIR)

CHARS = {
    "yangjian": dict(BASE, style="messy", collar="jacket", prop="phone"),
    "yangjian_eye": dict(BASE, style="messy", collar="jacket", eye_red=True, eye_r=8,
                         face_lit="#d8b49a", prop="phone"),
    "zhangwei": dict(BASE, style="spiky", collar="hoodie", eye_r=6,
                     face_lit="#d3bda6", prop="headphones"),
    "miaoshan": dict(BASE, style="long", collar="shirt", eye_r=7,
                     face_lit="#d6c0ab", face_mid="#77605a", prop="book"),
    "wangshanshan": dict(BASE, style="ponytail", collar="jacket", eye_r=7,
                         face_lit="#d2bba6", prop="ribbon"),
    # 差分：被鬼婴咬过之后（原著第 11 章·后颈的青黑手印，第 21 章·向外蔓延）
    "wangshanshan_marked": dict(BASE, style="ponytail", collar="jacket", eye_r=6,
                                face_lit="#b6a794", face_mid="#8a7876", prop="ribbon",
                                extras="handprint_spread", pallor=0.28),
    "fangjing": dict(BASE, style="neat", collar="shirt", eye_r=6,
                     face_lit="#c6ac97", prop="paper"),
    "zhouzheng": dict(BASE, style="long", collar="trench", eye_r=6, belly=True,
                      face_lit="#b59d88", face_mid="#5d4a46"),
    # 差分：拖住老人之后、厉鬼复苏到极限（原著第 9 章）
    "zhouzheng_dying": dict(BASE, style="long", collar="trench", eye_r=4, belly=True,
                            face_lit="#9a8778", face_mid="#463a38", pallor=0.22,
                            hair="#141414", hair_hi="#3a3a3a", extras="dying"),
    "laoren": dict(BASE, style="bald", collar="changshan", eye_r=8, hunch=True,
                   hdx=-16, hdy=14, eye_glow="#d8d8cc", face_lit="#948c78",
                   face_mid="#4a463c", prop="cane"),
}


def props(p):
    """每人的标志物：低亮度受光，用于在暗部里辨认角色"""
    e = p.get("prop")
    lit = p.get("prop_lit", "#b9c6c1")
    s = []
    if e == "phone":
        s += ['<g transform="rotate(-16 322 902)">',
              '<rect x="286" y="862" width="72" height="118" rx="8" fill="#0a0f11" stroke="#3d4a4c" stroke-width="2"/>',
              f'<rect x="293" y="870" width="58" height="102" rx="4" fill="{lit}" opacity="0.55"/>',
              '<rect x="300" y="880" width="44" height="8" fill="#0a0f11" opacity="0.5"/>',
              '<rect x="300" y="896" width="44" height="6" fill="#0a0f11" opacity="0.35"/>',
              '</g>',
              '<ellipse cx="322" cy="920" rx="120" ry="110" fill="#9fd0c8" opacity="0.10" filter="url(#g22)"/>']
    elif e == "mask":
        s += ['<path d="M392 556 C420 586 470 592 486 574 C486 616 462 640 428 642 C404 640 392 620 390 596 Z" fill="#a8a69c" opacity="0.72" filter="url(#rough)"/>',
              '<path d="M392 556 C420 586 470 592 486 574" fill="none" stroke="#e2e0d6" stroke-width="2" opacity="0.6"/>',
              '<path d="M404 588 C424 606 452 610 468 598" fill="none" stroke="#7d7b72" stroke-width="2" opacity="0.5"/>',
              '<path d="M390 556 C380 556 374 548 376 540" fill="none" stroke="#b9b7ac" stroke-width="3" opacity="0.7"/>']
    elif e == "book":
        s += ['<g transform="rotate(-8 352 906)">',
              '<rect x="272" y="862" width="160" height="106" rx="4" fill="#12181a" stroke="#46524f" stroke-width="2"/>',
              f'<rect x="278" y="868" width="148" height="94" fill="{lit}" opacity="0.22"/>',
              '<path d="M300 890 L410 890 M300 906 L410 906 M300 922 L390 922" stroke="#8fa49e" stroke-width="2" opacity="0.45"/>',
              '</g>']
    elif e == "headphones":
        s += ['<path d="M430 742 C430 690 500 664 560 690 C592 704 604 736 600 766" fill="none" stroke="#8f9a9c" stroke-width="7" opacity="0.5"/>',
              '<rect x="414" y="728" width="34" height="54" rx="14" fill="#1a2124" stroke="#6f7d80" stroke-width="3"/>',
              '<rect x="596" y="742" width="32" height="50" rx="13" fill="#1a2124" stroke="#6f7d80" stroke-width="3"/>',
              f'<rect x="420" y="738" width="20" height="34" rx="8" fill="{lit}" opacity="0.3"/>']
    elif e == "paper":
        s += ['<g transform="rotate(12 330 920)">',
              '<rect x="268" y="874" width="132" height="96" fill="#b8ab90" opacity="0.55" filter="url(#rough)"/>',
              '<path d="M282 894 L386 894 M282 910 L386 910 M282 926 L360 926 M282 942 L374 942" stroke="#3a3027" stroke-width="2" opacity="0.55"/>',
              '<path d="M286 880 L380 880" stroke="#7a2020" stroke-width="2" opacity="0.5"/>',
              '</g>']
    elif e == "ribbon":
        s += ['<path d="M604 830 C700 860 742 940 706 1010 C676 1070 706 1130 760 1150" fill="none" stroke="#c07a86" stroke-width="7" opacity="0.4" filter="url(#g1)"/>',
              '<path d="M604 830 C700 860 742 940 706 1010" fill="none" stroke="#e0a2ac" stroke-width="2" opacity="0.5"/>']
    elif e == "glasses":
        s += ['<path d="M396 438 L448 434" stroke="#c9d4cf" stroke-width="2.4" opacity="0.5"/>',
              '<path d="M402 452 C412 444 428 444 436 452 C430 460 410 460 402 452 Z" fill="none" stroke="#c9d4cf" stroke-width="2" opacity="0.45"/>']
    elif e == "cane":
        s += ['<path d="M700 1400 L742 980 C748 946 742 920 724 906" fill="none" stroke="#20282a" stroke-width="10"/>',
              '<path d="M724 906 C712 896 700 900 698 912" fill="none" stroke="#2c3638" stroke-width="8"/>']
    elif e == "hand":
        s += ['<path d="M300 890 C280 920 276 960 286 996 C292 1018 306 1034 320 1040" fill="none" stroke="#0b0e10" stroke-width="34" stroke-linecap="round"/>',
              '<path d="M320 1040 C310 1052 312 1066 324 1072 C336 1078 348 1070 350 1058 C352 1046 342 1036 332 1034" fill="#0b0e10"/>',
              '<path d="M300 890 C280 920 276 960 286 996" fill="none" stroke="#7d8d8a" stroke-width="2" opacity="0.25"/>']
    return "".join(s)


def extras(p):
    """差分细节：只用于剧情明确写到的身体变化，不做原创加戏。
       handprint_spread —— 王珊珊后颈的鬼奴印与蔓延的青黑（原著 11 / 21 章）
       dying           —— 周正复苏到极限：嘴角的血与更深的眼窝（原著 9 章）
    """
    e = p.get("extras", "")
    s = []
    if e == "handprint_spread":
        # 后颈的掌印：软边的淤青，而不是"画上去的一只手"
        s.append('<g filter="url(#rough)">')
        s.append('<path d="M508 706 C534 692 562 706 566 738 C570 772 546 788 518 778 C494 770 492 736 508 706 Z" fill="#1f3436" opacity="0.75" filter="url(#g10)"/>')
        for dx, dy, ln in ((-20, -4, 30), (-8, -12, 36), (6, -14, 34), (20, -10, 28), (32, -2, 22)):
            s.append(f'<path d="M{534+dx} {736+dy} C{536+dx} {736+dy-ln*0.6:.0f} {540+dx} {736+dy-ln:.0f} {544+dx} {734+dy-ln:.0f}" '
                     f'stroke="#1f3436" stroke-width="9" opacity="0.6" fill="none" stroke-linecap="round" filter="url(#g10)"/>')
        # 沿后颈向上蔓延的青黑（弯的，像血管）
        for (x0, y0, x1, y1, cx, cy) in [(552, 688, 576, 626, 566, 660), (542, 700, 558, 644, 554, 672),
                                         (534, 712, 540, 662, 532, 688), (566, 672, 596, 612, 590, 644)]:
            s.append(f'<path d="M{x0} {y0} Q{cx} {cy} {x1} {y1}" stroke="#22383c" stroke-width="4" '
                     f'opacity="0.6" fill="none" stroke-linecap="round" filter="url(#g4)"/>')
        s.append('</g>')
        # 极淡的一线冷光：让暗部里能辨认出这块印子
        s.append('<path d="M512 712 C536 700 560 712 564 738" fill="none" stroke="#9fd0c8" stroke-width="1.2" opacity="0.20"/>')
        s.append('<path d="M552 686 Q566 656 576 626" fill="none" stroke="#9fd0c8" stroke-width="1" opacity="0.14"/>')
    elif e == "dying":
        # 嘴角的血与下巴上的一道（会被剪影裁掉，不会挂到轮廓外）
        s.append('<path d="M390 592 C398 603 412 610 428 611" fill="none" stroke="#5e1518" stroke-width="5" opacity="0.85"/>')
        s.append('<path d="M407 611 C408 620 407 628 405 634" fill="none" stroke="#4d1114" stroke-width="3.5" opacity="0.8"/>')
        s.append('<ellipse cx="405" cy="636" rx="3.5" ry="5" fill="#6a181a" opacity="0.8"/>')
        # 更深的眼窝
        s.append('<ellipse cx="418" cy="452" rx="46" ry="30" fill="#1a1113" opacity="0.45" filter="url(#g10)"/>')
        for (x, y) in [(398, 448), (412, 440), (428, 448), (444, 442)]:
            s.append(f'<path d="M{x} {y} q8 5 15 1" stroke="#a83a3a" stroke-width="1.4" opacity="0.6" fill="none"/>')
    return "".join(s)


def render(p):
    pts = outline(p.get("lean", 0))
    fp = rim_path(pts)
    hi = rim_path(pts, 0, BROW_I + 1)
    dy = p.get("hdy", 0)
    s = [defs(p)]
    # 背后的空气光
    s.append(f'<ellipse cx="470" cy="560" rx="300" ry="330" fill="url(#haloG)" filter="url(#g22)"/>')
    # 身体
    s.append(f'<path d="{smooth(pts)}" fill="url(#bodyG)"/>')
    # 衣服
    s.append(clothing(p, pts))
    s.append(weight(p))
    s.append(f'<clipPath id="silClip"><path d="{smooth(pts)}"/></clipPath>')
    # 脸：只在轮廓内侧亮起
    s.append(f'<path d="{smooth(pts)}" fill="url(#faceG)" opacity="0.9"/>')
    # 苍白（被鬼域侵蚀过的角色）：冷色罩在剪影之内
    if p.get("pallor"):
        s.append('<g clip-path="url(#silClip)">')
        s.append(f'<ellipse cx="470" cy="440" rx="200" ry="260" fill="#22383c" opacity="{p["pallor"]}" filter="url(#g22)"/>')
        s.append(f'<ellipse cx="500" cy="640" rx="92" ry="42" fill="#16262a" opacity="{min(0.6, p["pallor"]+0.16):.2f}" filter="url(#g22)"/>')
        s.append('</g>')
    # 深色的后脑与衣领压暗
    # 头发
    s.append(hair_shape(p, pts))
    s.append(hair_rim(p, pts))
    # 面部细节
    s.append(face_details(p))
    s.append(eye_glint(p))
    s.append(props(p))
    # 差分细节一律裁在剪影之内，避免出现"挂在轮廓外"的痕迹
    s.append(f'<g clip-path="url(#silClip)">{extras(p)}</g>')
    # 轮廓光（主光）
    s.append(f'<path d="{fp}" fill="none" stroke="url(#rimG)" stroke-width="10" opacity="0.30" filter="url(#g10)"/>')
    s.append(f'<path d="{fp}" fill="none" stroke="url(#rimG)" stroke-width="3.2" opacity="0.95" filter="url(#g1)"/>')
    s.append(f'<path d="{fp}" fill="none" stroke="#f4fbf6" stroke-width="1.1" opacity="0.85"/>')
    # 肩头轮廓光
    s.append('<path d="M444 812 C444 780 440 744 436 712" fill="none" stroke="url(#rimG)" stroke-width="6" opacity="0.3" filter="url(#g10)"/>')
    s.append('<path d="M444 812 C444 780 440 744 436 712" fill="none" stroke="url(#rimG)" stroke-width="2" opacity="0.55" filter="url(#g1)"/>')
    # 头发轮廓补光
    s.append(f'<path d="{hi}" fill="none" stroke="{RIM}" stroke-width="1.6" opacity="0.35" filter="url(#g1)"/>')
    # 统一颗粒
    s.append(f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="0.07" style="mix-blend-mode:overlay"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            + "".join(s) + '</svg>')


def render_guiying():
    p = dict(BASE, face_lit="#7f9d94", face_mid="#2c3b39")
    s = [defs(p)]
    s.append('<ellipse cx="500" cy="760" rx="260" ry="280" fill="url(#haloG)" filter="url(#g22)"/>')
    # 爬行的婴儿：大头的侧面剪影
    body = [(710,1400),(690,1290),(640,1210),(600,1160),(560,1120),(520,1090),(500,1040),
            (480,990),(450,950),(420,930),(390,900),(382,860),(392,820),(410,790),(430,760),
            (438,720),(430,680),(420,640),(424,600),(440,560),(470,532),(510,518),
            (560,520),(602,540),(626,574),(634,616),(626,660),(612,700),(606,740),(612,790),
            (626,840),(640,900),(660,960),(690,1020),(720,1080),(750,1160),(770,1260),(790,1400)]
    s.append(f'<path d="{smooth(body)}" fill="#0a0f11"/>')
    s.append(f'<path d="{smooth([(438,720),(430,680),(420,640),(424,600),(440,560),(470,532),(510,518),(560,520),(602,540),(626,574),(634,616)])}" fill="url(#faceG)" opacity="0.55"/>')
    # 两只发光的黑眼
    s.append('<ellipse cx="486" cy="612" rx="34" ry="26" fill="#050707"/>')
    s.append('<ellipse cx="486" cy="612" rx="10" ry="7" fill="#cfe0da" opacity="0.55"/>')
    s.append('<ellipse cx="574" cy="606" rx="30" ry="24" fill="#050707"/>')
    s.append('<ellipse cx="574" cy="606" rx="9" ry="6" fill="#cfe0da" opacity="0.45"/>')
    # 长手臂
    s.append('<path d="M470 940 C400 1000 360 1100 372 1200 C380 1270 410 1330 450 1370" fill="none" stroke="#0a0f11" stroke-width="46" stroke-linecap="round"/>')
    s.append('<path d="M372 1200 C360 1260 366 1320 390 1360" fill="none" stroke="#0a0f11" stroke-width="26" stroke-linecap="round"/>')
    # 轮廓
    s.append(f'<path d="{smooth(body)}" fill="none" stroke="url(#rimG)" stroke-width="9" opacity="0.22" filter="url(#g10)"/>')
    s.append(f'<path d="{smooth(body)}" fill="none" stroke="url(#rimG)" stroke-width="2.6" opacity="0.8" filter="url(#g1)"/>')
    s.append(f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="0.07" style="mix-blend-mode:overlay"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            + "".join(s) + '</svg>')


# ---------------- 后期 ----------------
def stylize(src, dst):
    from PIL import Image, ImageDraw, ImageFilter
    import numpy as np
    im = Image.open(src).convert("RGBA")
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    a = im.split()[-1]
    rgb = im.convert("RGB")
    arr = np.asarray(rgb).astype(np.float32)
    # 冷调、低饱和
    l = arr @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    arr = arr * 0.45 + l[..., None] * 0.55
    arr[..., 2] *= 1.05
    arr[..., 0] *= 1.03
    arr = np.clip(arr, 0, 255)
    # 轻微胶片颗粒
    rng = np.random.default_rng(11)
    arr = np.clip(arr + rng.normal(0, 5.0, (H, W, 1)), 0, 255).astype(np.uint8)
    base = Image.fromarray(arr)
    # 网点（暗部）
    dots = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(dots)
    for y in range(0, H, 6):
        for x in range(0, W, 6):
            if (x // 6 + y // 6) % 2 == 0:
                d.point((x, y), fill=18)
    arr2 = np.asarray(base).astype(np.int16) + np.asarray(dots)[..., None] // 6
    base = Image.fromarray(np.clip(arr2, 0, 255).astype(np.uint8))
    out = base.convert("RGBA")
    out.putalpha(a)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
        pad = 8
        cv = Image.new("RGBA", (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0))
        cv.paste(out, (pad, pad))
        out = cv
    if str(dst).lower().endswith(".webp"):
        out.save(dst, "WEBP", quality=90, method=6)
    else:
        out.save(dst, optimize=True)
    bg = Image.new("RGB", out.size, (12, 15, 17))
    bg.paste(out, (0, 0), out)
    bg.save(str(dst).rsplit(".", 1)[0] + "_preview.jpg", quality=88)


def render_svg(name, svg):
    os.makedirs(BUILD, exist_ok=True)
    sp = os.path.join(BUILD, name + ".svg"); pp = os.path.join(BUILD, name + ".png")
    open(sp, "w", encoding="utf-8").write(svg)
    if os.path.exists(pp):
        os.remove(pp)
    cmd = [EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
           "--force-device-scale-factor=2", "--default-background-color=00000000",
           f"--user-data-dir={os.path.join(BUILD,'edge-profile')}", "--virtual-time-budget=2500",
           f"--window-size={W},{H}", f"--screenshot={pp}", "file:///" + sp.replace("\\", "/")]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    for _ in range(80):
        if os.path.exists(pp) and os.path.getsize(pp) > 1000:
            break
        time.sleep(0.1)
    return pp


def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or list(CHARS.keys()) + ["guiying"]
    for name in only:
        svg = render_guiying() if name == "guiying" else render(CHARS[name])
        pp = render_svg(name, svg)
        dst = os.path.join(OUT, name + ".png")
        try:
            stylize(pp, dst)
            print("OK", name, os.path.getsize(dst))
        except Exception as e:
            print("FAIL", name, repr(e))


if __name__ == "__main__":
    main()



