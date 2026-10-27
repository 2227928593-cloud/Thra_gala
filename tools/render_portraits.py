# -*- coding: utf-8 -*-
"""生成人物立绘（WebP，带透明通道）。
用法：python tools/render_portraits.py [角色名...]   # 缺省为全部
差分角色（如 wangshanshan_marked / zhouzheng_dying）沿用同一套头骨、光照与后期，
只改 extras / pallor 等参数，保证与本体风格完全一致。
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import portraits_sil as ps

RIMS = {
    "yangjian": "#a9c6c1", "yangjian_eye": "#c98f86", "zhangwei": "#c9b48a",
    "miaoshan": "#c9a3a3", "wangshanshan": "#b3a3c9", "wangshanshan_marked": "#8f7fae",
    "fangjing": "#9fb0b8", "zhouzheng": "#a8bfa0", "zhouzheng_dying": "#8fa88c",
    "laoren": "#d8d2b8",
}
for k, v in RIMS.items():
    if k in ps.CHARS:
        ps.CHARS[k]["rim"] = v

os.makedirs(ps.OUT, exist_ok=True)
only = sys.argv[1:] or [n for n in ps.CHARS if n != "guiying"]
for name in only:
    if name not in ps.CHARS:
        print("SKIP", name, "(未定义)")
        continue
    svg = ps.render(ps.CHARS[name])
    pp = ps.render_svg(name, svg)
    dst = os.path.join(ps.OUT, name + ".webp")
    ps.stylize(pp, dst)
    print("OK", name, os.path.getsize(dst), "bytes")