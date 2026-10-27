# -*- coding: utf-8 -*-
"""
恐怖复苏 · 敲门  —  七个结局的插画
与场景同一套管线（单点透视 / 空气透视 / 胶印后期），每张对应一个结局。
用法：python tools/gen_endings.py [结局 id...]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_scenes as gs          # 复用 frame / fog / grain / vignet / light_cone / render / post

W, H = gs.W, gs.H
OUT = os.path.join(gs.ROOT, "art", "endings")


# ---------------------------------------------------------------
# 1 · 门后的第十三次：门开了一条缝，门上刻着十三道
# ---------------------------------------------------------------
def e_door():
    s = [f'<rect width="{W}" height="{H}" fill="#05080a"/>']
    s.append('<rect x="0" y="0" width="1600" height="900" fill="#0b1114"/>')
    s.append(gs.stain_rect(0, 0, 1600, 900, .5))
    # 走廊（尽头一盏灯）
    s.append('<path d="M0 0 L1600 0 L1600 900 L0 900 Z" fill="#080e11"/>')
    s.append('<path d="M520 180 L1080 180 L1080 900 L520 900 Z" fill="#0d1418"/>')
    s.append('<circle cx="800" cy="300" r="10" fill="#dbece5" opacity="0.75"/>')
    s.append('<ellipse cx="800" cy="320" rx="320" ry="260" fill="url(#lamp)" opacity="0.20" filter="url(#b60)"/>')
    # 门（半开，缝里是更深的黑）
    s.append('<path d="M540 200 L900 240 L900 900 L540 900 Z" fill="#141c1f" stroke="#2b3a3d" stroke-width="10"/>')
    s.append('<path d="M900 240 L980 250 L980 900 L900 900 Z" fill="#030506"/>')
    s.append('<ellipse cx="940" cy="560" rx="60" ry="300" fill="#8fb0ab" opacity="0.05" filter="url(#b30)"/>')
    # 门上的十三道刻痕
    for i in range(13):
        x = 570 + i * 26
        h = 120 if i % 5 != 4 else 150
        s.append(f'<path d="M{x} 560 L{x} {560 + h}" stroke="#6d7c74" stroke-width="3" opacity="0.6"/>')
    s.append('<path d="M570 560 L882 560" stroke="#6d7c74" stroke-width="2" opacity="0.35"/>')
    # 门把手与手印
    s.append('<circle cx="866" cy="600" r="9" fill="#3d4a4c"/>')
    s.append('<path d="M822 620 C846 606 872 616 876 640 C880 664 858 676 834 668" fill="none" stroke="#8fa9a3" stroke-width="2" opacity="0.22"/>')
    # 地面：一双脚印停在门前
    s.append('<path d="M0 820 L1600 760 L1600 900 L0 900 Z" fill="#0a1113"/>')
    for k, y in enumerate((838, 862)):
        s.append(f'<ellipse cx="{470 + k*30}" cy="{y}" rx="42" ry="16" fill="#050a0b" opacity="0.9"/>')
        s.append(f'<ellipse cx="{470 + k*30}" cy="{y}" rx="42" ry="16" fill="none" stroke="#26363a" stroke-width="2" opacity="0.5"/>')
    s += [gs.fog(800, 700, 760, 180, .16), gs.grain(0.11), gs.vignet(1.0)]
    return gs.frame("".join(s))


# ---------------------------------------------------------------
# 2 · 永远的五楼：每一层都是 5
# ---------------------------------------------------------------
def e_stairs():
    s = [f'<rect width="{W}" height="{H}" fill="#060a0b"/>']
    s.append('<rect width="1600" height="900" fill="#0a1113"/>')
    s.append(gs.stain_rect(0, 0, 1600, 900, .55))
    # 一圈一圈往上收的楼梯（螺旋）
    for i in range(9):
        t = i / 8
        inset = 40 + t * 300
        top = 120 + i * 78
        op = 0.9 - t * 0.55
        s.append(f'<path d="M{inset} {top+90} L{1600-inset} {top+40} L{1600-inset-40} {top+70} L{inset+40} {top+120} Z" '
                 f'fill="#141d20" opacity="{op:.2f}"/>')
        s.append(f'<path d="M{inset} {top+90} L{1600-inset} {top+40}" stroke="#26363a" stroke-width="3" opacity="{op:.2f}"/>')
        # 每层墙上都写着 5
        s.append(f'<text x="{150 + t*40:.0f}" y="{top+70:.0f}" fill="#8fa39c" opacity="{0.3 - t*0.22:.2f}" '
                 f'font-family="Arial,Helvetica,sans-serif" font-size="{96 - t*54:.0f}" font-weight="bold">5</text>')
        s.append(f'<text x="{1440 - t*40:.0f}" y="{top+30:.0f}" fill="#8fa39c" opacity="{0.26 - t*0.2:.2f}" '
                 f'font-family="Arial,Helvetica,sans-serif" font-size="{90 - t*50:.0f}" font-weight="bold">5</text>')
    # 楼梯井的黑
    s.append('<ellipse cx="800" cy="470" rx="360" ry="300" fill="#030506" opacity="0.85" filter="url(#b60)"/>')
    # 一只磨破的校鞋
    s.append('<g transform="rotate(-14 560 792)">')
    s.append('<path d="M500 800 C500 780 520 770 556 770 C600 770 630 782 640 800 C648 814 640 828 620 830 L516 834 C502 832 498 818 500 800 Z" fill="#0e1416" stroke="#2b3a3d" stroke-width="3"/>')
    s.append('<path d="M520 806 L620 802" stroke="#4a5a57" stroke-width="3" opacity="0.5"/>')
    s.append('<path d="M556 770 C560 758 574 754 586 758" fill="none" stroke="#4a5a57" stroke-width="3" opacity="0.6"/>')
    s.append('</g>')
    s.append('<ellipse cx="570" cy="840" rx="130" ry="26" fill="#8fb0ab" opacity="0.05" filter="url(#b30)"/>')
    s.append(gs.light_cone(800, 60, 200, 700, 0.05))
    s += [gs.fog(800, 600, 700, 240, .14), gs.grain(0.12), gs.vignet(1.0)]
    return gs.frame("".join(s))


# ---------------------------------------------------------------
# 3 · 一个人走出校门：一排脚印通向天亮
# ---------------------------------------------------------------
def e_alone():
    s = [f'<rect width="{W}" height="{H}" fill="#101619"/>']
    # 天空（冷蓝的晨光）
    s.append('<rect width="1600" height="420" fill="#2b3a42"/>')
    s.append('<ellipse cx="1180" cy="300" rx="700" ry="220" fill="#c9c0a8" opacity="0.20" filter="url(#b60)"/>')
    # 校门（背对观众，铁栅栏）
    s.append('<path d="M0 300 L520 380 L520 900 L0 900 Z" fill="#141d21"/>')
    s.append('<path d="M1600 300 L1080 380 L1080 900 L1600 900 Z" fill="#111a1e"/>')
    s.append('<rect x="520" y="380" width="560" height="300" fill="#0d1518"/>')
    for i in range(14):
        x = 540 + i * 38
        s.append(f'<path d="M{x} 390 L{x} 690" stroke="#28363a" stroke-width="5" opacity="0.9"/>')
    s.append('<path d="M540 400 L1060 400 M540 520 L1060 520" stroke="#28363a" stroke-width="4" opacity="0.7"/>')
    # 校门外的马路与脚印
    s.append('<path d="M0 690 L1600 690 L1600 900 L0 900 Z" fill="#1b2428"/>')
    s.append('<path d="M0 762 L1600 756" stroke="#39474a" stroke-width="3" opacity="0.6"/>')
    for k in range(7):
        t = k / 6
        x = 800 + t * 520
        y = 812 + t * 60
        sc = 1 - t * 0.45
        s.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{40*sc:.0f}" ry="{15*sc:.0f}" fill="#0f1719" opacity="0.85"/>')
        s.append(f'<ellipse cx="{x+16*sc:.0f}" cy="{y+30*sc:.0f}" rx="{36*sc:.0f}" ry="{13*sc:.0f}" fill="#0f1719" opacity="0.7"/>')
    # 早班公交（远处，很小）
    s.append('<rect x="1230" y="700" width="300" height="86" rx="10" fill="#28343a"/>')
    s.append('<rect x="1250" y="712" width="120" height="42" fill="#8fa39c" opacity="0.25"/>')
    for x in (1290, 1470):
        s.append(f'<circle cx="{x}" cy="790" r="18" fill="#0c1214"/>')
    # 教学楼在背后，暗着
    s.append('<path d="M600 380 L1000 380 L1000 300 L600 300 Z" fill="#0a1114" opacity="0.8"/>')
    s.append('<rect width="1600" height="900" fill="#1b2830" opacity="0.10"/>')
    s += [gs.fog(800, 700, 820, 150, .12), gs.grain(0.08), gs.vignet(0.84)]
    return gs.frame("".join(s))


# ---------------------------------------------------------------
# 4 · 成为鬼：坐着的人，身上开满了眼睛
# ---------------------------------------------------------------
def e_absorb():
    s = [f'<rect width="{W}" height="{H}" fill="#070a0b"/>']
    s.append('<rect width="1600" height="900" fill="#0c1214"/>')
    s.append(gs.stain_rect(0, 0, 1600, 900, .45))
    # 无限延伸的黑板
    s.append('<rect x="420" y="150" width="760" height="420" fill="#0a1210" stroke="#22302c" stroke-width="8"/>')
    s.append('<g fill="#5d7a70" opacity="0.35" font-family="KaiTi,STKaiti,serif" font-size="30" letter-spacing="4">'
             '<text x="470" y="220">鬼无法被杀死。</text>'
             '<text x="470" y="280">能对付鬼的只有鬼。</text>'
             '<text x="470" y="340">洞察鬼的规律。</text></g>')
    # 桌椅的剪影
    for i in range(5):
        x = 300 + i * 220
        s.append(f'<path d="M{x} 700 L{x+150} 700 L{x+166} 724 L{x-16} 724 Z" fill="#111a1d" opacity="0.9"/>')
        s.append(f'<path d="M{x+20} 724 L{x+24} 790 M{x+130} 724 L{x+134} 790" stroke="#0a0f10" stroke-width="6"/>')
    # 坐着的人（背对，身上开着红眼）
    s.append('<g>')
    s.append('<path d="M700 900 L700 640 C700 596 734 566 786 566 C838 566 872 596 872 640 L872 900 Z" fill="#050809"/>')
    s.append('<ellipse cx="786" cy="540" rx="52" ry="56" fill="#050809"/>')
    for (x, y, r, op) in [(748, 640, 12, .85), (826, 668, 14, .8), (786, 712, 10, .7),
                          (736, 736, 9, .6), (838, 760, 11, .65), (792, 800, 8, .5)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#c8382f" opacity="{op}"/>')
        s.append(f'<ellipse cx="{x}" cy="{y}" rx="{r*4}" ry="{r*3}" fill="url(#red)" opacity="{op*0.35:.2f}" filter="url(#b30)"/>')
    s.append('</g>')
    # 裂缝里的光
    s.append('<path d="M700 700 C760 690 800 720 872 700" fill="none" stroke="#7a1f1c" stroke-width="3" opacity="0.5"/>')
    s.append('<rect width="1600" height="900" fill="#1a0c0e" opacity="0.22"/>')
    s += [gs.fog(800, 620, 680, 200, .13), gs.grain(0.12), gs.vignet(1.0)]
    return gs.frame("".join(s))


# ---------------------------------------------------------------
# 5 · 第八个人：七道影子，其中一道没有主人
# ---------------------------------------------------------------
def e_eighth():
    s = [f'<rect width="{W}" height="{H}" fill="#0a0e10"/>']
    s.append('<rect width="1600" height="900" fill="#101719"/>')
    s.append(gs.stain_rect(0, 0, 1600, 900, .4))
    # 街面
    s.append('<path d="M0 620 L1600 620 L1600 900 L0 900 Z" fill="#141d20"/>')
    for i in range(8):
        s.append(f'<path d="M{-200+i*260} 900 L{300+i*180} 620" stroke="#1e2a2d" stroke-width="2" opacity="0.5"/>')
    # 一盏很低的路灯，光从右上斜射
    s.append('<path d="M1180 600 L1180 200 L1240 200" stroke="#2b383a" stroke-width="10" fill="none"/>')
    s.append('<circle cx="1240" cy="204" r="14" fill="#e8e2cf" opacity="0.8"/>')
    s.append('<path d="M1240 220 L200 900 L1560 900 Z" fill="#cfe0da" opacity="0.06" filter="url(#b30)"/>')
    s.append('<ellipse cx="1240" cy="230" rx="420" ry="300" fill="url(#lamp)" opacity="0.22" filter="url(#b30)"/>')
    # 六个人的影子（朝左下拖长）
    for i in range(6):
        x = 620 + i * 92
        s.append(f'<path d="M{x} 700 L{x-360-i*10} 900 L{x-250-i*10} 900 L{x+30} 700 Z" fill="#040708" opacity="0.85"/>')
    # 第七道影子——没有主人
    s.append('<path d="M1180 700 L920 900 L1060 900 L1210 700 Z" fill="#040708" opacity="0.9"/>')
    s.append('<path d="M1180 700 L920 900 L1060 900 L1210 700 Z" fill="none" stroke="#3a2a2c" stroke-width="2" opacity="0.5"/>')
    # 站在光里的六个人（很小的剪影，背对）
    for i in range(6):
        x = 620 + i * 92
        s.append(f'<g opacity="0.95"><ellipse cx="{x}" cy="654" rx="13" ry="16" fill="#050809"/>'
                 f'<path d="M{x-20} 700 L{x-13} 668 L{x+13} 668 L{x+20} 700 Z" fill="#050809"/></g>')
    s.append('<rect width="1600" height="900" fill="#0a1014" opacity="0.28"/>')
    s += [gs.fog(760, 660, 780, 160, .12), gs.grain(0.1), gs.vignet(0.94)]
    return gs.frame("".join(s))


# ---------------------------------------------------------------
# 6 · 被写下的人：纸上的字正在长出来
# ---------------------------------------------------------------
def e_written():
    s = [f'<rect width="{W}" height="{H}" fill="#0a0d0e"/>']
    s.append('<rect width="1600" height="900" fill="#101618"/>')
    s.append(gs.stain_rect(0, 0, 1600, 900, .45))
    # 桌面
    s.append('<path d="M180 470 L1420 440 L1560 900 L60 900 Z" fill="#1a2225"/>')
    s.append('<path d="M180 470 L1420 440 L1420 462 L180 492 Z" fill="#263134"/>')
    # 那张纸（人皮纸：边缘不齐、颜色发黄）
    s.append('<path d="M420 520 L1180 500 L1210 830 L390 850 Z" fill="#b8ab90" opacity="0.9"/>')
    s.append('<path d="M420 520 L1180 500 L1210 830 L390 850 Z" fill="none" stroke="#8a7d64" stroke-width="3" opacity="0.7"/>')
    s.append('<g filter="url(#rough)" opacity="0.5"><path d="M420 520 C460 540 430 570 470 590 C500 606 470 640 500 660 L390 850 Z" fill="#8a7d64"/></g>')
    # 纸上的字（正在显形的行）
    lines = ['我叫杨间，', '当你看到这封信的时候', '我已经死了，', '我是十年后的你。']
    s.append('<g fill="#3a2f24" font-family="KaiTi,STKaiti,serif" font-size="40" letter-spacing="6">')
    for i, t in enumerate(lines):
        s.append(f'<text x="{480}" y="{600 + i * 68}" opacity="{0.85 - i*0.16:.2f}">{t}</text>')
    s.append('</g>')
    # 还没写完的一行（墨迹发红）
    s.append('<path d="M480 872 C520 868 560 874 600 870" stroke="#6e1a1c" stroke-width="4" fill="none" opacity="0.7"/>')
    # 手与笔的影子
    s.append('<g opacity="0.85" filter="url(#b14)">')
    s.append('<path d="M980 300 C1040 320 1060 380 1030 430 C1010 462 960 470 930 450 C900 430 900 380 930 350 Z" fill="#050809"/>')
    s.append('<path d="M1000 430 L1046 520" stroke="#0b1214" stroke-width="14"/>')
    s.append('</g>')
    s.append('<ellipse cx="1000" cy="360" rx="220" ry="160" fill="url(#lamp)" opacity="0.16" filter="url(#b30)"/>')
    # 背景：校门的轮廓
    s.append('<rect x="520" y="200" width="560" height="240" fill="#0a1113" opacity="0.5"/>')
    s.append('<rect width="1600" height="900" fill="#140f10" opacity="0.18"/>')
    s += [gs.fog(800, 640, 700, 170, .13), gs.grain(0.11), gs.vignet(1.0)]
    return gs.frame("".join(s))


# ---------------------------------------------------------------
# 7 · 五点三十一分：七个人，一个不少
# ---------------------------------------------------------------
def e_true():
    s = [f'<rect width="{W}" height="{H}" fill="#141c21"/>']
    # 天快亮了
    s.append('<rect width="1600" height="440" fill="#33454d"/>')
    s.append('<ellipse cx="900" cy="330" rx="760" ry="240" fill="#c9c0a8" opacity="0.26" filter="url(#b60)"/>')
    s.append('<ellipse cx="300" cy="220" rx="520" ry="180" fill="#a9bcc0" opacity="0.12" filter="url(#b60)"/>')
    # 步行街两侧店铺
    s.append('<path d="M0 240 L520 320 L520 700 L0 900 Z" fill="#2a3538"/>')
    s.append('<path d="M1600 220 L1080 320 L1080 700 L1600 900 Z" fill="#273236"/>')
    for i in range(4):
        x = 60 + i * 120; y = 350 + i * 14
        s.append(f'<rect x="{x}" y="{y}" width="92" height="240" fill="#1e2a2d" stroke="#3c4a4e" stroke-width="3"/>')
    for i in range(4):
        x = 1600 - (70 + i * 120); y = 350 + i * 14
        s.append(f'<rect x="{x-92}" y="{y}" width="92" height="240" fill="#1e2a2d" stroke="#3c4a4e" stroke-width="3"/>')
    # 街面与路灯
    s.append('<path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="#2b3538"/>')
    s.append('<path d="M0 786 L1600 782" stroke="#46545a" stroke-width="3" opacity="0.6"/>')
    for x in (330, 1260):
        s.append(f'<path d="M{x} 700 L{x} 330 L{x+30} 330" stroke="#39474a" stroke-width="8" fill="none"/>')
        s.append(f'<circle cx="{x+30}" cy="332" r="10" fill="#e8e2cf" opacity="0.45"/>')
    # 七个人：一排背影，往光里走
    for i in range(7):
        x = 470 + i * 96
        sc = 0.86 + (i % 3) * 0.06
        h = 250 * sc
        y0 = 900
        s.append(f'<g opacity="0.96">')
        s.append(f'<ellipse cx="{x}" cy="{y0-h:.0f}" rx="{20*sc:.0f}" ry="{24*sc:.0f}" fill="#101a1d"/>')
        s.append(f'<path d="M{x-34*sc:.0f} {y0} L{x-26*sc:.0f} {y0-h+30:.0f} L{x+26*sc:.0f} {y0-h+30:.0f} L{x+34*sc:.0f} {y0} Z" fill="#101a1d"/>')
        s.append(f'<path d="M{x-18*sc:.0f} {y0} L{x-16*sc:.0f} {y0-h+96:.0f} M{x+18*sc:.0f} {y0} L{x+16*sc:.0f} {y0-h+96:.0f}" stroke="#101a1d" stroke-width="{13*sc:.1f}"/>')
        s.append('</g>')
        s.append(f'<ellipse cx="{x}" cy="{y0+6}" rx="{60*sc:.0f}" ry="{14*sc:.0f}" fill="#0c1417" opacity="0.5" filter="url(#b14)"/>')
    # 远处还没熄的红色余光（鬼域在退开）
    s.append('<ellipse cx="820" cy="700" rx="420" ry="120" fill="url(#red)" opacity="0.10" filter="url(#b60)"/>')
    s.append('<rect width="1600" height="900" fill="#1a2226" opacity="0.10"/>')
    s += [gs.fog(800, 720, 860, 150, .12), gs.grain(0.08), gs.vignet(0.84)]
    return gs.frame("".join(s))


ENDINGS = {
    "e_door": e_door,
    "e_stairs": e_stairs,
    "e_alone": e_alone,
    "e_absorb": e_absorb,
    "e_eighth": e_eighth,
    "e_written": e_written,
    "e_true": e_true,
}

EXPOSURE = {
    "e_door": 1.5, "e_stairs": 1.55, "e_alone": 1.15, "e_absorb": 1.5,
    "e_eighth": 1.35, "e_written": 1.3, "e_true": 1.2,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or list(ENDINGS.keys())
    for name in only:
        if name not in ENDINGS:
            print("SKIP", name, "(未定义)")
            continue
        pp = gs.render("end_" + name, ENDINGS[name]())
        dst = os.path.join(OUT, name + ".jpg")
        try:
            gs.post(pp, dst, EXPOSURE.get(name, 1.3))
            print("OK", name, os.path.getsize(dst))
        except Exception as e:
            print("FAIL", name, repr(e))


if __name__ == "__main__":
    main()