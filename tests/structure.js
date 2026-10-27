/* 剧情图结构检查：环、重复节点 id、字段合法性、资源引用 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
const FILES = ['js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js'];

/* 重复 id 检测：每个剧情文件在独立上下文中执行，拦截 nd() 记录 id。
   注意：story 文件依赖 data.js 提供的 narr / say / nd 助手，因此先跑 data.js。 */
const defsByFile = [];
for (const f of FILES) {
  const ids = [];
  const s2 = { console };
  s2.window = s2;
  vm.createContext(s2);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), s2, { filename: 'js/data.js' });
  const origNd = s2.nd;
  s2.nd = (id, obj) => { ids.push(id); return origNd(id, obj); };
  if (f !== 'js/data.js') vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), s2, { filename: f });
  else ids.push(...Object.keys(s2.window.STORY.nodes));
  defsByFile.push([f, ids]);
}
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });

const STORY = sandbox.window.STORY;
const { CODEX, ENDINGS, CHARACTERS } = vm.runInContext('({CODEX, ENDINGS, CHARACTERS})', sandbox);
const NODES = STORY.nodes;
const problems = [];

/* --- 1. 重复节点 id --- */
const seenIds = new Map();
for (const [f, ids] of defsByFile) {
  const local = new Map();
  ids.forEach(id => {
    local.set(id, (local.get(id) || 0) + 1);
    const prev = seenIds.get(id);
    if (prev) problems.push(`节点 id 重复定义: "${id}" 同时出现在 ${prev} 和 ${f}（后者会覆盖前者）`);
    else seenIds.set(id, f);
  });
  for (const [id, c] of local) if (c > 1) problems.push(`文件 ${f} 内节点 id 重复 ${c} 次: "${id}"`);
}

/* --- 2. 环检测（含 once 选项的边也算，用来判断是否存在真正的死循环） --- */
const edges = new Map();   // node -> [{to, kind}]
function addEdge(from, to, kind) { if (!to) return; (edges.get(from) || edges.set(from, []).get(from)).push({ to, kind }); }
for (const id of Object.keys(NODES)) {
  const n = NODES[id];
  if (n.next) addEdge(id, n.next, 'next');
  (n.choices || []).forEach((c, i) => addEdge(id, c.next, `choice#${i}`));
  if (n.route) {
    [{ flags: {} }, { flags: { left_wang: true } }].forEach(st => {
      try { const t = n.route(st); if (t) addEdge(id, t, 'route'); } catch (e) { problems.push(`[${id}] route 抛异常: ${e.message}`); }
    });
  }
}
const WHITE = 0, GREY = 1, BLACK = 2;
const color = new Map(Object.keys(NODES).map(id => [id, WHITE]));
const cycles = [];
function dfs(id, stack) {
  color.set(id, GREY); stack.push(id);
  for (const e of edges.get(id) || []) {
    if (!NODES[e.to]) { continue; }
    if (color.get(e.to) === GREY) {
      const i = stack.indexOf(e.to);
      cycles.push(stack.slice(i).concat([e.to]));
    } else if (color.get(e.to) === WHITE) dfs(e.to, stack);
  }
  stack.pop(); color.set(id, BLACK);
}
dfs(STORY.meta.start, []);
for (const id of Object.keys(NODES)) if (color.get(id) === WHITE) dfs(id, []);
cycles.forEach(c => problems.push(`剧情图存在环（可能死循环）: ${c.join(' → ')}`));

/* --- 3. 字段合法性 --- */
const NODE_KEYS = new Set(['id', 'actCard', 'chapter', 'place', 'scene', 'mood', 'cast', 'lines', 'enter', 'stats', 'choices', 'ending', 'route', 'next', 'observe', 'sfxLine', 'rotAfter', 'costClock']);
const LINE_KEYS = new Set(['who', 'text', 'style', 'effects', 'cast', 'scene', 'mood', 'sfx', 'fx', 'when', 'tag']);
const CHOICE_KEYS = new Set(['text', 'next', 'when', 'lockedHint', 'hint', 'cls', 'effects', 'ending', 'once', 'action', 'req', 'tell']);
const OBS_KEYS = new Set(['id', 'label', 'x', 'y', 'text', 'effects', 'free', 'light', 'risk', 'noDim']);
const FX_KEYS = new Set(['flags', 'set', 'stats', 'clues', 'codex', 'items', 'toast', 'toastKind', 'fx', 'sfx']);
const COND_KEYS = new Set(['flag', 'notFlag', 'clue', 'item', 'minEyes', 'minKnock', 'maxBattery', 'minBattery', 'minCorruption', 'minSurvivors', 'maxCorruption', 'minSanity', 'maxSanity', 'diff', 'allClues', 'hallucination']);
const unusedNodeKeys = new Map();
for (const id of Object.keys(NODES)) {
  const n = NODES[id];
  for (const k of Object.keys(n)) if (!NODE_KEYS.has(k)) problems.push(`[${id}] 未知节点字段 "${k}"（引擎不会读取）`);
  if (n.sfxLine !== undefined) unusedNodeKeys.set(id, 'sfxLine');
  (n.lines || []).forEach((l, i) => {
    for (const k of Object.keys(l)) if (!LINE_KEYS.has(k)) problems.push(`[${id}] 第${i + 1}行未知字段 "${k}"`);
  });
  (n.choices || []).forEach((c, i) => {
    for (const k of Object.keys(c)) if (!CHOICE_KEYS.has(k)) problems.push(`[${id}] 选项${i + 1}未知字段 "${k}"`);
    if (c.when && typeof c.when === 'object') for (const k of Object.keys(c.when)) if (!COND_KEYS.has(k)) problems.push(`[${id}] 选项${i + 1} when 未知条件 "${k}"（会被静默忽略）`);
  });
  (n.observe || []).forEach((o, i) => {
    for (const k of Object.keys(o)) if (!OBS_KEYS.has(k)) problems.push(`[${id}] 观察点${i + 1}未知字段 "${k}"`);
    if (o.x == null || o.y == null) problems.push(`[${id}] 观察点${i + 1}「${o.label}」缺少坐标 x/y`);
    if (o.light != null && ![0, 1, 2].includes(+o.light)) problems.push(`[${id}] 观察点${i + 1} light 只能取 0/1/2，实际 ${o.light}`);
    if (o.risk != null && !(+o.risk >= 0 && +o.risk <= 3)) problems.push(`[${id}] 观察点${i + 1} risk 只能取 0–3，实际 ${o.risk}`);
    if (o.tell) problems.push(`[${id}] 观察点${i + 1} 不该有 tell（tell 只属于选项）`);
    if (o.x < 0 || o.x > 100 || o.y < 0 || o.y > 100) problems.push(`[${id}] 观察点${i + 1}「${o.label}」坐标越界 (${o.x},${o.y})`);
  });
  const checkFxKeys = (fx, where) => { if (fx) for (const k of Object.keys(fx)) if (!FX_KEYS.has(k)) problems.push(`[${id}] ${where} 未知效果字段 "${k}"`); };
  checkFxKeys(n.enter, 'enter');
  (n.lines || []).forEach((l, i) => checkFxKeys(l.effects, `第${i + 1}行 effects`));
  (n.choices || []).forEach((c, i) => checkFxKeys(c.effects, `选项${i + 1} effects`));
  (n.observe || []).forEach((o, i) => checkFxKeys(o.effects, `观察点${i + 1} effects`));
}
if (unusedNodeKeys.size) problems.push(`节点字段 sfxLine 从未被引擎读取（无用字段）: ${[...unusedNodeKeys.keys()].join(', ')}`);

/* --- 4. 资源引用 --- */
const scenes = new Set(), arts = new Set();
for (const id of Object.keys(NODES)) {
  const n = NODES[id];
  if (n.scene) scenes.add(n.scene);
  (n.lines || []).forEach(l => { if (l.scene) scenes.add(l.scene); });
  const castAll = [...(n.cast || []), ...(n.lines || []).flatMap(l => l.cast || [])];
  /* cast 里的 art 是立绘差分（王珊珊被咬前后、周正濒死）——也要算"被使用" */
  castAll.forEach(c => { const ch = CHARACTERS[c.id]; if (c.art) arts.add(c.art); else if (ch && ch.art) arts.add(ch.art); });
}
const missingAssets = [];
for (const s of scenes) if (!fs.existsSync(path.join(root, 'art/scenes', s + '.jpg'))) missingAssets.push(`art/scenes/${s}.jpg`);
for (const a of arts) if (!fs.existsSync(path.join(root, 'art/characters', a + '.webp'))) missingAssets.push(`art/characters/${a}.webp`);
for (const id of Object.keys(CHARACTERS)) {
  const ch = CHARACTERS[id];
  if (!ch.voice && !ch.art) problems.push(`人物 ${id} 既无立绘也无 voice 标记（立绘会 404）`);
  // 所有声明了 art 的人物，其立绘文件都必须存在（即使当前没有节点引用）
  if (ch.art && !fs.existsSync(path.join(root, 'art/characters', ch.art + '.webp'))) {
    problems.push(`人物 ${id} 的立绘文件不存在: art/characters/${ch.art}.webp`);
  }
}
missingAssets.forEach(m => problems.push(`引用的资源文件不存在: ${m}`));

/* --- 5. 立绘文件未被使用 --- */
const usedArts = new Set(arts);
const charDir = path.join(root, 'art/characters');
fs.readdirSync(charDir).forEach(f => {
  const base = f.replace(/\.webp$/, '');
  if (!usedArts.has(base)) problems.push(`立绘文件未被任何节点使用: art/characters/${f}`);
});

/* --- 5b. 有人物立绘但从未在任何节点出场的角色 --- */
const castIds = new Set();
for (const id of Object.keys(NODES)) {
  const n = NODES[id];
  [...(n.cast || []), ...(n.lines || []).flatMap(l => l.cast || [])].forEach(c => castIds.add(c.id));
}
for (const id of Object.keys(CHARACTERS)) {
  const ch = CHARACTERS[id];
  if (ch.art && !ch.voice && !castIds.has(id)) {
    problems.push(`人物 ${id}（${ch.name}）有立绘文件，但没有任何节点让它出场（art/characters/${ch.art}.webp 永远不会显示）`);
  }
}

/* --- 6. 结局/档案统计 --- */
const codexIds = new Set();
[...CODEX.clue, ...CODEX.ghost, ...CODEX.person, ...CODEX.memory].forEach(c => {
  if (codexIds.has(c.id)) problems.push(`档案 id 重复: ${c.id}`);
  codexIds.add(c.id);
});

console.log(`节点 ${Object.keys(NODES).length} · 场景引用 ${scenes.size} · 立绘引用 ${arts.size}`);
console.log(`结局 ${ENDINGS.length} · 档案 ${codexIds.size} · 人物 ${Object.keys(CHARACTERS).length}`);
console.log(`剧情图环数 ${cycles.length}`);
if (problems.length) { console.log('\n--- 问题 ---'); problems.forEach(p => console.log('  ! ' + p)); }
else console.log('\n✓ 结构检查通过');
process.exitCode = problems.length ? 1 : 0;