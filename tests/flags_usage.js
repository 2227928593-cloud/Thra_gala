/* =========================================================
   静态数据检查：旗标 / 道具的"设置"与"读取"是否对得上
   用来发现"接线断了一半"的分支——某个旗标被多个选项设置，
   却从来没有任何 when 条件读取它。
   ========================================================= */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sb = { console }; sb.window = sb; vm.createContext(sb);
for (const f of ['js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sb, { filename: f });
}
const N = sb.window.STORY.nodes;

const setFlags = new Map(), readFlags = new Set();
const setItems = new Map(), readItems = new Set();

function takeSet(f, where) {
  if (!f) return;
  if (f.flags) Object.keys(f.flags).forEach(k => { if (!setFlags.has(k)) setFlags.set(k, where); });
  if (f.items) Object.keys(f.items).forEach(k => { if (!setItems.has(k)) setItems.set(k, where); });
}
function takeRead(c) {
  if (!c || typeof c === 'function') return;
  if (c.flag) readFlags.add(c.flag);
  if (c.notFlag) readFlags.add(c.notFlag);
  if (c.item) readItems.add(c.item);
}

for (const id of Object.keys(N)) {
  const n = N[id];
  takeSet(n.enter, id);
  (n.lines || []).forEach(l => { takeSet(l.effects, id); takeRead(l.when); });
  (n.choices || []).forEach(c => { takeSet(c.effects, id); takeRead(c.when); });
  (n.observe || []).forEach(o => takeSet(o.effects, id));
}

const unusedFlags = [...setFlags.keys()].filter(k => !readFlags.has(k) && !k.startsWith('__'));
const unusedItems = [...setItems.keys()].filter(k => !readItems.has(k));

console.log(`节点 ${Object.keys(N).length}`);
console.log(`被设置的旗标 ${setFlags.size} 个，其中被 when 读取的 ${readFlags.size} 个：${[...readFlags].join(', ')}`);
console.log(`被设置的道具 ${setItems.size} 个，其中被 when 读取的 ${readItems.size} 个：${[...readItems].join(', ')}`);

console.log(`\n=== 被设置但从未被任何 when 读取的旗标（${unusedFlags.length} 个）===`);
unusedFlags.forEach(k => console.log(`  ${k}  （首次设置于节点 ${setFlags.get(k)}）`));
console.log(`\n=== 被设置但从未被任何 when 读取的道具（${unusedItems.length} 个）===`);
unusedItems.forEach(k => console.log(`  ${k}  （首次设置于节点 ${setItems.get(k)}）`));

/* 说明：旗标只作叙事记账而不参与判定，可能是有意为之；
   此处只作为"分支层是否完工"的参考信号，不作为失败退出。 */
console.log('\n（本项为参考信息，不影响退出码）');