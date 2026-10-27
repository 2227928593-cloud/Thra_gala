/* =========================================================
   《恐怖复苏 · 敲门》第四幕之后的新增观察点（可直接粘贴）
   ---------------------------------------------------------
   依据：design/gdd/difficulty-redesign.md §4.2 / §12.3 / §12.6
   形态：与现有 `observe: [{ id, label, x, y, text, effects }]` 完全一致，
         额外带 light / risk（§12.6），o_f10_eyes 额外带 noDim。
   坐标：画布百分比，原点左上；已避开 y>70 的对话框带与选项区，
         同节点内两点间距 ≥ 6%（act5 三点两两最距 29）。
   ---------------------------------------------------------
   接入前必须做三件事（详见文件末尾 TODO）：
     1) CODEX.clue 注册 4 条新线索，否则 toast 只会显示 id；
     2) 引擎补 noDim（light / risk 已实现，只有 noDim 还没接）；
     3) f9 目前没有 choices，必须补一个推进选项，否则观察入口不渲染。
   ========================================================= */
'use strict';

/* ---------- 第四幕 · 操场 act5（3 处） ---------- */
const OBS_PLAYGROUND = [
  {
    id: 'o_pl_ash', label: '灯柱下的灰', x: 30, y: 38, light: 2, risk: 1,
    text: '我抬头看灯。灯罩里积着一层灰，灰上有一圈干净的圆，边缘很齐。'
        + '第二根灯柱的灰是满的，没有那个圆。我伸手比了一下，圆比我的脚大一点。',
    effects: { clues: ['ghost_domain'], codex: ['g_qiaomen'] }
  },
  {
    id: 'o_pl_watch', label: '苗小善的表', x: 72, y: 52, light: 1, risk: 0,
    text: '苗小善把表摘下来给我。秒针在抖，不走。背面有一道圆珠笔写的痕，'
        + '是个“8”，笔画很用力，像写的时候手在抖。她说她不记得写过。',
    effects: { clues: ['knock_rule', 'watch_eight'], flags: { watch_eight: true } }
  },
  {
    id: 'o_pl_seven', label: '跑道边坐着的人', x: 46, y: 66, light: 2, risk: 2,
    text: '我在数人。一、二、三……七个。孙仁的校服后襟上有个青黑的小手印，很小，'
        + '像婴儿的手，他自己不知道。我又数了一遍，还是七个。第三遍的时候我不敢数了。',
    effects: { clues: ['guiying_mark'], flags: { counted_seven: true } }
  }
];

/* ---------- 第四幕 · 校门 f1 / f2 / f9（3 处） ---------- */
const OBS_GATE = {
  f1: [
    {
      id: 'o_gate_socket', label: '保安亭的插排', x: 20, y: 62, light: 1, risk: 0,
      text: '我摸到保安亭里的插排。开关的红灯还亮着，说明这条线还有电。'
          + '我把线插上，红灯跳成绿的。亭子里的挂钟停在九点四十，比我的手机慢了六个小时。',
      effects: { stats: { battery: 20 }, codex: ['g_shadow'] }
    }
  ],
  f2: [
    {
      id: 'o_gate_window', label: '三楼亮着的窗', x: 66, y: 24, light: 2, risk: 1,
      text: '三楼那扇窗还亮着一点手机的光。窗后的人影贴着玻璃，脸朝下。'
          + '不是在往下看，是在找。玻璃上有一片手印，正在往下滑，滑到窗台就停住，'
          + '然后重新出现在最上面。',
      effects: { clues: ['forum_trap'], codex: ['g_hand'] }
    }
  ],
  f9: [
    {
      id: 'o_gate_steps', label: '他走过的地面', x: 34, y: 66, light: 1, risk: 2,
      text: '他走过的地方，地砖上的水渍干了，灰也没了。不是踩脏，是被收走。'
          + '我数了数：十二块干净的地砖，一块挨着一块。他还要再走一步。',
      effects: { clues: ['ghost_domain', 'counted_steps'], flags: { counted_steps: true } }
    }
  ]
};

/* ---------- 第四幕 · 五点三十 f10（2 处） ---------- */
const OBS_F10 = [
  {
    /* noDim：saw_sixth 全篇唯一来源，不能被电量收缩吞掉（§12.3） */
    id: 'o_f10_eyes', label: '手臂上的眼睛', x: 70, y: 58, light: 1, risk: 0, noDim: true,
    text: '我数手臂上的眼睛。五只，深浅不一，都睁着。第六只在更深的地方，闭着，'
        + '眼皮底下有东西在动。它不是长出来的，它是饿的。'
        + '我用指甲按了一下那一处，它往里缩了缩，像在躲。',
    effects: { clues: ['saw_sixth'], flags: { saw_sixth: true }, stats: { corruption: 4 } }
  },
  {
    id: 'o_f10_faces', label: '同学的脸', x: 40, y: 42, light: 1, risk: 1,
    text: '我一张一张看过去。张伟、苗小善、赵磊、孙仁、刘奇、王珊珊……七张脸。'
        + '看到第五张的时候我停住了：多了一张，不是人，是一张脸贴在他们背后，'
        + '跟着一起转过来。',
    effects: { clues: ['eighth'], flags: { saw_eighth: true }, stats: { corruption: 6 } }
  }
];

/* ---------- 终幕 g1 / g4 / g5（3 处，全部 light:0：天亮了） ---------- */
const OBS_EPILOGUE = {
  g1: [
    {
      id: 'o_end_lamp', label: '路灯罩', x: 24, y: 18, light: 0, risk: 0,
      text: '路灯罩玻璃上的眼睛是印上去的印花，我数了三只。盯久了，最上面那只眨了一下。'
          + '我再看，它又不动了。玻璃很干净，干净得像有人刚擦过。',
      effects: { clues: ['eye_rule'], codex: ['g_guiyan'], stats: { corruption: 2 } }
    }
  ],
  g4: [
    {
      id: 'o_end_hand', label: '王珊珊的手', x: 60, y: 64, light: 0, risk: 0,
      text: '王珊珊抓着我的袖子，指节是白的。晨光从侧面打过来，把所有人的影子拉得很长。'
          + '我低头找她的影子，找了很久。她没有。她还在跟我说谢谢。',
      effects: { clues: ['wang_no_shadow'], flags: { wang_no_shadow: true }, stats: { corruption: 4 } }
    }
  ],
  g5: [
    {
      id: 'o_end_phone', label: '口袋里的卫星电话', x: 44, y: 54, light: 0, risk: 0,
      text: '我把卫星电话从口袋里摸出来。屏幕是黑的，按一下就亮。里面只有一条信息，'
          + '没有署名：“活着就好。下午三点，人民公园东门。别带别人。” 时间戳是五点三十一。',
      effects: { clues: ['only_ghost'], flags: { phone_msg: true } }
    }
  ]
};

/* =========================================================
   TODO 1 · CODEX 注册（data.js 的 CODEX.clue 里追加这 4 条）
   ---------------------------------------------------------
   3 条来自本次新增（saw_sixth / wang_no_shadow / watch_eight / counted_steps 共 4 条）；
   不注册的话 addClue 的 toast 会退化成显示 id（engine.js: c ? c.name : id）。
   ========================================================= */
const CODEX_CLUE_APPEND = [
  {
    id: 'saw_sixth', name: '第六只还没有睁眼',
    text: '手臂上的五只眼睛都睁着，第六只闭在更深的地方。它在动，像是在等什么。\n\n'
        + '——它不是长出来的，它是饿的。',
    links: ['eye_rule', 'eighth']
  },
  {
    id: 'wang_no_shadow', name: '没有影子的人',
    text: '晨光把所有人的影子都拉得很长，只有她没有。\n\n'
        + '后颈上的手印在晨光里几乎看不见了，可她抓着袖子的那只手，一直是凉的。',
    links: ['eighth', 'guiying_mark']
  },
  {
    id: 'watch_eight', name: '表背面的 8',
    text: '她的卡通表停在四点零五分，秒针一直在抖。背面有一个用圆珠笔写的“8”，'
        + '笔画很用力。\n\n她自己不记得写过。',
    links: ['eighth', 'm_531']
  },
  {
    id: 'counted_steps', name: '十二块地砖',
    text: '他走过的地方，水渍干了，灰也没了。一行十二块干净的地砖。\n\n'
        + '我数完之后，他还在往前走。',
    links: ['knock_rule', 'knock_rhythm']
  }
];

/* =========================================================
   TODO 2 · 引擎（当日改动清单）
   ---------------------------------------------------------
   ✅ 已实现（22:29 工作树，无需再动）：
        lightPlan() 的 light 0/1/2 + 鬼眼照明 + corruption ≥ power 时 light:1 免电量
        knockDeltaFor() 的累计取整 + o.risk 结算
   ⚠️ 还差一项：
        observationVisible() 不认 noDim → 在收缩前加 `if (o.noDim) return true;`
        （否则 o_f10_eyes 会被电量收缩吞掉，而 saw_sixth 全篇只有这一个来源）
   ========================================================= */

/* =========================================================
   TODO 3 · f9 需要一个推进选项
   ---------------------------------------------------------
   engine 的观察入口挂在 renderChoices 里（`观察四周` 作为第 0 项），
   而 f9 只有 `next: 'f10'`、没有 choices → 观察入口不会渲染，
   o_gate_steps 将永远不可点。补一个空推进即可：
     choices: [{ text: '……还有一步。', next: 'f10' }]
   同理检查：g6 无 choices（本次已把电话点挪到 g5 规避）。
   ========================================================= */

/* 导出（供测试或 data.js 合并使用；浏览器里挂到 window 便于调试） */
if (typeof window !== 'undefined') {
  window.NEW_HOTSPOTS = {
    act5: OBS_PLAYGROUND,
    f1: OBS_GATE.f1,
    f2: OBS_GATE.f2,
    f9: OBS_GATE.f9,
    f10: OBS_F10,
    g1: OBS_EPILOGUE.g1,
    g4: OBS_EPILOGUE.g4,
    g5: OBS_EPILOGUE.g5
  };
  window.CODEX_CLUE_APPEND = CODEX_CLUE_APPEND;
}
