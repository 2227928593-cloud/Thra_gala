/* =========================================================
   资源完整性检查（美术接入守门）
   ---------------------------------------------------------
   用途：在把新美术切进 art/ 之前/之后各跑一次，确认"剧情要的图都在"。
     1) 扫描 STORY 里所有 node.scene（含继承）、rotAfter、cast（含 line.cast）；
     2) 扫描 ENDINGS 的全部结局 id 与 ui/title.jpg；
     3) 任一缺失 → 非零退出码，按分组打印 `缺失 → 被哪个节点引用`。

   口径刻意与引擎一致（js/engine.js）：
     · 场景：节点没写 scene 时继承上一个节点的 scene（declaration order）；
     · rotAfter：数据写 {at, scene} 就用那个 scene，否则用 `<scene>_rot`；
       场景名本身已以 `_rot` 结尾时不重复叠加；
     · 立绘：cast 可写 art 覆盖（差分），否则用 CHARACTERS[id].art 或 id；
       只出声不出画的 voice 角色（voice 且无 art）跳过。
   ========================================================= */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const FILES = ['js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js'];

const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
FILES.forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }));

const { STORY, CHARACTERS, ENDINGS } = vm.runInContext('({ STORY, CHARACTERS, ENDINGS })', sandbox);
const nodes = STORY.nodes;
const ids = Object.keys(nodes);

const has = rel => fs.existsSync(path.join(root, rel));
const add = (map, key, from) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(from); };

/* ---------- 1. 场景（含继承）与 rot 变体 ---------- */
const scenes = new Map();     // sceneId → Set(引用节点)
const rots = new Map();       // rotSceneId → Set(引用节点)
const endings = new Map();    // endingId → Set('ENDINGS')
const chars = new Map();      // artId → Set(引用节点)

let inherited = null;
for (const id of ids) {
  const n = nodes[id];
  if (n.scene) inherited = n.scene;
  const scene = n.scene || inherited;
  if (scene) add(scenes, scene, id);

  const ra = n.rotAfter;
  if (ra && scene) {
    const at = typeof ra === 'string' ? ra : ra.at;
    if (at) {
      const explicit = typeof ra === 'object' && ra.scene ? ra.scene : null;
      let rotScene = explicit || (/[\\/]|_rot$/.test(scene) ? null : scene + '_rot');
      if (rotScene) add(rots, rotScene, id);
    }
  }

  const takeCast = (list, where) => (list || []).forEach(c => {
    if (!c || !c.id) return;
    const ch = CHARACTERS[c.id];
    const art = c.art || (ch && ch.art) || c.id;
    if (ch && ch.voice && !c.art && !ch.art) return;   // 只出声的 voice 角色不占画面
    add(chars, art, where);
  });
  takeCast(n.cast, id);
  (n.lines || []).forEach((l, i) => takeCast(l.cast, `${id}.lines[${i}]`));
}
(ENDINGS || []).forEach(e => add(endings, e.id, 'ENDINGS'));

/* ---------- 2. 存在性检查 ---------- */
const missing = { scenes: [], rot: [], characters: [], endings: [], ui: [] };
const fmt = set => Array.from(set).slice(0, 6).join(', ') + (set.size > 6 ? ` …共 ${set.size} 处` : '');

for (const [id, from] of scenes) if (!has(`art/scenes/${id}.jpg`)) missing.scenes.push({ id, from });
for (const [id, from] of rots) if (!has(`art/scenes/${id}.jpg`)) missing.rot.push({ id, from });
for (const [id, from] of chars) if (!has(`art/characters/${id}.webp`)) missing.characters.push({ id, from });
for (const [id, from] of endings) if (!has(`art/endings/${id}.jpg`)) missing.endings.push({ id, from });
if (!has('art/ui/title.jpg')) missing.ui.push({ id: 'title.jpg', from: new Set(['boot']) });

/* ---------- 3. 报告 ---------- */
const GROUP = [
  ['scenes', '场景 art/scenes/*.jpg'],
  ['rot', '腐蚀变体 art/scenes/*_rot.jpg'],
  ['characters', '立绘 art/characters/*.webp'],
  ['endings', '结局 art/endings/*.jpg'],
  ['ui', '界面 art/ui/*']
];

const DIR = { scenes: 'art/scenes', rot: 'art/scenes', characters: 'art/characters', endings: 'art/endings', ui: 'art/ui' };
const EXT = { scenes: '.jpg', rot: '.jpg', characters: '.webp', endings: '.jpg', ui: '' };

let bad = 0;
for (const [key, label] of GROUP) {
  const list = missing[key];
  bad += list.length;
  if (!list.length) continue;
  console.log(`\n--- 缺失 · ${label}（${list.length}）---`);
  list.forEach(m => console.log(`  ${DIR[key]}/${m.id}${EXT[key]}   ← 被引用于：${fmt(m.from)}`));
}

console.log(`\n扫描：场景 ${scenes.size} · rot 变体 ${rots.size} · 立绘 ${chars.size} · 结局 ${endings.size} · UI 1`);
if (bad) {
  console.log(`✗ 资源完整性检查失败：${bad} 项缺失`);
  process.exitCode = 1;
} else {
  console.log('✓ 资源完整性检查通过：剧情需要的图全部存在');
  process.exitCode = 0;
}
