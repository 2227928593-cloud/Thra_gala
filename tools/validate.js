/* 剧情数据校验：跑 Node 检查孤立节点、悬空跳转、未知人物/线索/结局 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ['js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
}

const STORY = sandbox.window.STORY;
const { CHARACTERS, CODEX, ENDINGS } = vm.runInContext('({ CHARACTERS, CODEX, ENDINGS })', sandbox);
const nodes = STORY.nodes;
const ids = new Set(Object.keys(nodes));
const errors = [];
const warnings = [];

const clueIds = new Set(CODEX.clue.map(c => c.id));
const allCodex = new Set([...CODEX.clue, ...CODEX.ghost, ...CODEX.person, ...CODEX.memory].map(c => c.id));
const endingIds = new Set(ENDINGS.map(e => e.id));
const charIds = new Set(Object.keys(CHARACTERS));
const charNames = new Set(Object.values(CHARACTERS).map(c => c.name));
function isChar(w) { return charIds.has(w) || charNames.has(w); }

const targets = new Map();
function addTarget(from, to, where) {
  if (!to) return;
  targets.set(from, (targets.get(from) || []).concat([to]));
  if (!ids.has(to)) errors.push(`[${from}] ${where} 指向不存在的节点: ${to}`);
}

const reached = new Set();
function walk(from) {
  if (!from || !ids.has(from)) return;
  if (reached.has(from)) return;
  reached.add(from);
  const n = nodes[from];
  (n.cast || []).forEach(c => { if (!charIds.has(c.id)) errors.push(`[${from}] cast 未知人物: ${c.id}`); });
  (n.lines || []).forEach((l, i) => {
    if (l.who && !isChar(l.who)) errors.push(`[${from}] 第${i + 1}行说话人未知: ${l.who}`);
    if (l.cast) l.cast.forEach(c => { if (!charIds.has(c.id)) errors.push(`[${from}] line.cast 未知人物: ${c.id}`); });
    const fx = l.effects;
    if (fx) checkEffects(from, fx);
  });
  if (n.enter) checkEffects(from, n.enter);
  if (n.ending && !endingIds.has(n.ending)) errors.push(`[${from}] 未知结局: ${n.ending}`);
  if (n.costClock != null && (!Number.isFinite(+n.costClock) || +n.costClock < 0)) errors.push(`[${from}] costClock 必须是非负数`);
  if (n.rotAfter != null && typeof n.rotAfter !== 'string' && typeof n.rotAfter !== 'object') errors.push(`[${from}] rotAfter 类型异常`);
  (n.choices || []).forEach(c => {
    if (c.ending && !endingIds.has(c.ending)) errors.push(`[${from}] 选项结局未知: ${c.ending}`);
    addTarget(from, c.next, '选项');
    checkEffects(from, c.effects);
    if (c.when) checkCond(from, c.when);
    if (c.tell) {
      if (typeof c.tell !== 'object') errors.push(`[${from}] 选项 tell 必须是对象`);
      else {
        if (c.tell.pre != null && typeof c.tell.pre !== 'string') errors.push(`[${from}] tell.pre 必须是字符串`);
        if (c.tell.sub != null && !Array.isArray(c.tell.sub)) errors.push(`[${from}] tell.sub 必须是数组`);
      }
    }
  });
  (n.observe || []).forEach(o => { checkEffects(from + ' 观察:' + o.label, o.effects); });
  addTarget(from, n.next, 'next');
  const routeOut = [];
  if (n.route) {
    [{ flags: {} }, { flags: { left_wang: true } }, { flags: { got_paper: true } }].forEach(st => {
      try { const id = n.route(st); if (id) { routeOut.push(id); addTarget(from, id, 'route'); } } catch (e) { errors.push(`[${from}] route 异常: ${e.message}`); }
    });
  }
  // 递归
  (n.choices || []).forEach(c => { if (c.next) walk(c.next); });
  if (n.next) walk(n.next);
  routeOut.forEach(walk);
}

function checkCond(from, c) {
  if (typeof c === 'function') return;
  if (c.flag && typeof c.flag !== 'string') errors.push(`[${from}] when.flag 类型异常`);
  if (c.clue && !clueIds.has(c.clue)) errors.push(`[${from}] when 未知线索: ${c.clue}`);
  if (c.allClues) c.allClues.forEach(x => { if (!clueIds.has(x)) errors.push(`[${from}] when 未知线索: ${x}`); });
  /* when.diff：只允许 story / standard / nightmare（或它们的数组） */
  if (c.diff != null) {
    const list = Array.isArray(c.diff) ? c.diff : [c.diff];
    list.forEach(x => {
      if (!['story', 'standard', 'nightmare'].includes(x)) errors.push(`[${from}] when.diff 非法档位: ${JSON.stringify(x)}`);
    });
    if (Array.isArray(c.diff) && !c.diff.length) errors.push(`[${from}] when.diff 是空数组（永远不满足）`);
  }
  /* 理智门槛：0–100 的整数（越界的值会静默变成"永不满足"或"永远满足"） */
  for (const k of ['minSanity', 'maxSanity']) {
    if (c[k] == null) continue;
    if (!Number.isInteger(+c[k]) || +c[k] < 0 || +c[k] > 100) {
      errors.push(`[${from}] when.${k} 必须是 0–100 的整数，实际 ${JSON.stringify(c[k])}`);
    }
  }
}
function checkEffects(from, fx) {
  if (!fx) return;
  if (fx.clues) fx.clues.forEach(c => { if (!clueIds.has(c)) errors.push(`[${from}] 未知线索: ${c}`); });
  if (fx.codex) fx.codex.forEach(c => { if (!allCodex.has(c)) errors.push(`[${from}] 未知档案: ${c}`); });
}

walk(STORY.meta.start);

/* 引擎强制入口：由 forcedTarget() 直接转入的节点，数据里没有入边。
     k13         —— 敲门到点（噩梦档不进 k13，直接判死；故事档不触发）
     sanityBreak —— 理智归零断片
   从这些节点再走一遍，把它们和它们的下游纳入可达性/引用检查。
   新增这类节点时**加进这张白名单**，不要改成"忽略所有警告"。 */
const ENGINE_ENTRY_NODES = ['k13', 'sanityBreak'];
ENGINE_ENTRY_NODES.forEach(id => { if (ids.has(id)) walk(id); });

// 从所有节点出发检查悬空跳转（包括不可达的）
for (const id of ids) {
  const n = nodes[id];
  addTarget(id, n.next, 'next');
  (n.choices || []).forEach(c => addTarget(id, c.next, '选项'));
  if (n.route) {
    [{ flags: {} }, { flags: { left_wang: true } }].forEach(st => {
      try { const id = n.route(st); if (id) addTarget(id, null, 'x'); } catch (e) {}
    });
  }
}

// 不可达节点
for (const id of ids) if (!reached.has(id) && id !== STORY.meta.start) warnings.push(`不可达节点: ${id}`);

/* 观察点检查：坐标必须在可点击范围内（底部对话框会盖住 y>72%），
   同一节点内的热点不能挤在一起，且 hotspot 必须属于真实存在的场景。 */
const sceneFiles = new Set(fs.readdirSync(path.join(root, 'art', 'scenes'))
  .filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4)));
let inheritedScene = null;
for (const id of ids) {
  const n = nodes[id];
  if (n.scene) inheritedScene = n.scene;
  if (!n.observe || !n.observe.length) continue;
  const sc = n.scene || inheritedScene;
  if (sc && !sceneFiles.has(sc)) errors.push(`[${id}] 观察点所在场景不存在: ${sc}`);
  n.observe.forEach((o, i) => {
    if (typeof o.x !== 'number' || typeof o.y !== 'number') { errors.push(`[${id}] 观察点缺坐标: ${o.label}`); return; }
    if (o.x < 4 || o.x > 96) errors.push(`[${id}] 观察点横向越界: ${o.label} x=${o.x}`);
    if (o.light != null && ![0, 1, 2].includes(+o.light)) errors.push(`[${id}] 观察点 light 只能取 0/1/2: ${o.label} light=${o.light}`);
    if (o.risk != null && !(+o.risk >= 0 && +o.risk <= 3)) errors.push(`[${id}] 观察点 risk 只能取 0–3: ${o.label} risk=${o.risk}`);
    if (o.noDim != null && typeof o.noDim !== 'boolean') errors.push(`[${id}] 观察点 noDim 必须是布尔值: ${o.label}`);
    if (o.y < 8 || o.y > 70) errors.push(`[${id}] 观察点落在对话框/不可点区: ${o.label} y=${o.y}（应 ≤ 70）`);
    for (let k = i + 1; k < n.observe.length; k++) {
      const p = n.observe[k];
      const d = Math.hypot(o.x - p.x, o.y - p.y);
      if (d < 6) warnings.push(`[${id}] 观察点过近: ${o.label} 与 ${p.label} 相距 ${d.toFixed(1)}%`);
    }
  });
}

/* 档案授予覆盖：每条档案都必须至少有一个授予点，否则玩家永远解锁不了。
   （这条真的发生过：文档曾宣称全部可解锁，实际有一批没有授予点。固化成校验。） */
const grantSources = new Map();
function noteGrant(id, where) {
  if (!grantSources.has(id)) grantSources.set(id, []);
  grantSources.get(id).push(where);
}
for (const id of ids) {
  const n = nodes[id];
  const take = (fx, where) => {
    if (!fx) return;
    (fx.clues || []).forEach(c => noteGrant(c, where));
    (fx.codex || []).forEach(c => noteGrant(c, where));
  };
  take(n.enter, id + '.enter');
  (n.lines || []).forEach((l, i) => take(l.effects, `${id}.lines[${i}]`));
  (n.choices || []).forEach((c, i) => take(c.effects, `${id}.choices[${i}]`));
  (n.observe || []).forEach((o, i) => take(o.effects, `${id}.observe[${i}]`));
}
[...allCodex].filter(id => !grantSources.has(id))
  .forEach(id => errors.push(`档案永远无法解锁（没有任何授予点）: ${id}`));

/* rotAfter（可选）：字符串 = 'HH:MM'；对象 = { at:'HH:MM', scene:'xxx' }。
   到点后引擎会用 <scene>_rot 或显式指定的场景。 */
for (const id of ids) {
  const ra = nodes[id].rotAfter;
  if (ra == null) continue;
  const at = typeof ra === 'string' ? ra : (ra && ra.at);
  if (typeof at !== 'string' || !/^\d{1,2}:\d{2}$/.test(at)) {
    errors.push(`[${id}] rotAfter 时刻格式应为 HH:MM: ${JSON.stringify(ra)}`);
    continue;
  }
  const [h, m] = at.split(':').map(Number);
  if (h > 23 || m > 59) errors.push(`[${id}] rotAfter 时刻非法: ${at}`);
  if (ra && typeof ra === 'object') {
    if (ra.scene && !sceneFiles.has(ra.scene)) errors.push(`[${id}] rotAfter.scene 场景不存在: ${ra.scene}`);
    if (!ra.scene) warnings.push(`[${id}] rotAfter 未指定 scene，将按 <scene>_rot 约定取图`);
  }
}

/* 理智门槛的两条静态不变量（软锁守门，见 design/gdd/sanity-system.md §3.7） */
for (const id of ids) {
  const n = nodes[id];
  if (!n.choices || !n.choices.length) continue;
  /* I1：每个有选项的节点，至少一条选项不受 minSanity 约束（否则理智不足时整屏灰） */
  const notSanityGated = n.choices.filter(c => !(c.when && c.when.minSanity != null));
  if (!notSanityGated.length) {
    errors.push(`[${id}] 所有选项都被 minSanity 锁住：理智不足时会把玩家卡死`);
  }
}
/* I2：通往结局的关键节点必须留一条无条件出口 */
const CRITICAL_NODES = ['f10', 'g7', 'k13'];
for (const id of CRITICAL_NODES) {
  const n = nodes[id];
  if (!n || !n.choices || !n.choices.length) continue;
  const open = n.choices.filter(c => !c.when).length;
  const gated = n.choices.length - open;
  console.log(`  ${id}: 无条件出口 ${open} / 共 ${n.choices.length}（有条件 ${gated}）`);
  if (!open) errors.push(`[${id}] 关键节点没有任何无条件出口：理智/线索一变就可能软锁`);
}

// 统计
let lineCount = 0, wordCount = 0;
for (const id of ids) {
  lineCount += (nodes[id].lines || []).length;
  for (const l of nodes[id].lines || []) wordCount += (l.text || '').length;
}
console.log(`节点 ${ids.size} · 台词 ${lineCount} 行 · 正文约 ${wordCount} 字`);
console.log(`结局 ${ENDINGS.length} · 档案 ${allCodex.size} · 线索 ${clueIds.size} · 人物 ${charIds.size}`);
if (warnings.length) { console.log('\n--- 警告 ---'); warnings.forEach(w => console.log('  ' + w)); }
if (errors.length) { console.log('\n--- 错误 ---'); errors.forEach(e => console.log('  ' + e)); process.exitCode = 1; }
else console.log('\n✓ 数据校验通过');
