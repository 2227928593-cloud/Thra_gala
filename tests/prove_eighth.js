/* =========================================================
   针对性可达性证明：在"放弃王珊珊"(left_wang) 的分支下，
   是否还能走到终幕 g7 / end_eighth？
   做法：对 e7r 之后的子图做穷举（状态 = 节点 + 事实集 + 眼睛数 + 复苏值）。
   剧情图是无环的，且眼睛/复苏只增不减，因此该子图状态空间很小。
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

function check(cond, st) {
  if (!cond) return true;
  if (typeof cond === 'function') return cond(st);
  if (cond.flag && !st.flags[cond.flag]) return false;
  if (cond.notFlag && st.flags[cond.notFlag]) return false;
  if (cond.clue && !st.clues.includes(cond.clue)) return false;
  if (cond.item && !(st.items[cond.item] > 0)) return false;
  if (cond.minEyes != null && st.stats.eyes < cond.minEyes) return false;
  if (cond.minKnock != null && st.stats.knock < cond.minKnock) return false;
  if (cond.maxBattery != null && st.stats.battery > cond.maxBattery) return false;
  if (cond.minCorruption != null && st.stats.corruption < cond.minCorruption) return false;
  if (cond.allClues && !cond.allClues.every(c => st.clues.includes(c))) return false;
  return true;
}
function fx(f, st) {
  if (!f) return;
  if (f.flags) Object.assign(st.flags, f.flags);
  if (f.stats) for (const k in f.stats) st.stats[k] = (st.stats[k] || 0) + f.stats[k];
  if (f.clues) f.clues.forEach(c => { if (!st.clues.includes(c)) st.clues.push(c); });
  if (f.items) for (const k in f.items) st.items[k] = (st.items[k] || 0) + f.items[k];
}

/* 从某个节点开始穷举后续所有可能（含观察"全看/不看"两支）
   initStats 用于给出真实的进入状态（例如从 e7r 开始时，玩家已经拿到白骨树那只鬼眼） */
function explore(startNode, initFlags, initStats = {}, initClues = [], maxStates = 200000) {
  const st0 = {
    flags: { ...initFlags }, clues: [...initClues], items: {},
    stats: { clock: 1000, knock: 0, eyes: 0, corruption: 0, battery: 100, survivors: 40, minutes: 0, ...initStats }
  };
  const endings = new Set();
  const nodesSeen = new Set();
  let maxEyesAtF10 = 0;
  const key = (s, id) => [id, s.stats.eyes, s.stats.corruption,
    Object.keys(s.flags).filter(k => s.flags[k]).sort().join(','), [...s.clues].sort().join(','),
    Object.keys(s.items).filter(k => s.items[k] > 0).sort().join(',')].join('|');
  const seen = new Set([key(st0, startNode)]);
  const q = [{ st: st0, id: startNode }];
  let head = 0, n = 0;
  while (head < q.length && n++ < maxStates) {
    const { st, id } = q[head++];
    const node = N[id];
    if (!node) continue;
    nodesSeen.add(id);
    if (id === 'f10') maxEyesAtF10 = Math.max(maxEyesAtF10, st.stats.eyes);
    const base = { flags: { ...st.flags }, clues: [...st.clues], items: { ...st.items }, stats: { ...st.stats } };
    fx(node.enter, base);
    if (node.stats) for (const k in node.stats) base.stats[k] = (base.stats[k] || 0) + node.stats[k];
    (node.lines || []).forEach(l => { if (l.when && !check(l.when, base)) return; fx(l.effects, base); });

    const branches = [base];
    if (node.observe && node.observe.length) {
      const all = { flags: { ...base.flags }, clues: [...base.clues], items: { ...base.items }, stats: { ...base.stats } };
      node.observe.forEach(o => fx(o.effects, all));
      branches.push(all);
    }
    branches.forEach(cur => {
      (node.choices || []).forEach(c => {
        if (!check(c.when, cur)) return;
        const nx = { flags: { ...cur.flags }, clues: [...cur.clues], items: { ...cur.items }, stats: { ...cur.stats } };
        fx(c.effects, nx);
        if (c.ending) { endings.add(c.ending); return; }
        if (c.next) { const k = key(nx, c.next); if (!seen.has(k)) { seen.add(k); q.push({ st: nx, id: c.next }); } }
        else if (node.ending) endings.add(node.ending);
      });
      if (node.ending) endings.add(node.ending);
      if (node.route) { const t = node.route(cur); if (t) { const k = key(cur, t); if (!seen.has(k)) { seen.add(k); q.push({ st: cur, id: t }); } } }
      else if (node.next) { const k = key(cur, node.next); if (!seen.has(k)) { seen.add(k); q.push({ st: cur, id: node.next }); } }
    });
  }
  return { endings, nodesSeen, states: seen.size, truncated: n >= maxStates, maxEyesAtF10 };
}

/* 场景 A：从 e7r 继续（e6 已选「转身，跑。」）。
   进入 e7r 时玩家已经有 1 只鬼眼和 eye_rule 线索——两者都由 d6 的必经选项
   「站起来，看清这里。」给出，若这里按空起算，就等于把它们凭空抹掉，结论会失真。 */
console.log('=== 场景 A：放弃王珊珊（left_wang = true），从 e7r 继续 ===');
const A = explore('e7r', { left_wang: true }, { eyes: 1 }, ['eye_rule']);
console.log('  到达节点数:', A.nodesSeen.size, '| 状态数:', A.states, A.truncated ? '(已截断)' : '');
console.log('  可达结局:', [...A.endings].join(', ') || '（无）');
console.log('  是否到达终幕 g7:', A.nodesSeen.has('g7') ? '是' : '否');
console.log('  是否到达 end_eighth:', A.nodesSeen.has('end_eighth') ? '是' : '否');
console.log('  是否到达 f11（通往终幕的节点）:', A.nodesSeen.has('f11') ? '是' : '否');
console.log('  在 f10 处最多能有多少只鬼眼:', A.maxEyesAtF10);

/* 场景 B：从 e8 继续（e6 已选「冲过去」，救下王珊珊）。
   e7 被咬一口会给 +4，加上前面那只，进入 e8 时应为 5 只。 */
console.log('\n=== 场景 B：救下王珊珊（从 e8 继续，眼睛 = 1 + 4 = 5） ===');
const B = explore('e8', { saved_wang: true }, { eyes: 5 }, ['eye_rule']);
console.log('  到达节点数:', B.nodesSeen.size, '| 状态数:', B.states, B.truncated ? '(已截断)' : '');
console.log('  可达结局:', [...B.endings].join(', ') || '（无）');
console.log('  是否到达终幕 g7:', B.nodesSeen.has('g7') ? '是' : '否');

/* 场景 C：从 d6 全量穷举（两条路都算），用于交叉验证 */
console.log('\n=== 场景 C：从 d6 全量穷举（含两条分支） ===');
const C = explore('d6', {});
console.log('  到达节点数:', C.nodesSeen.size, '| 状态数:', C.states, C.truncated ? '(已截断)' : '');
console.log('  可达结局:', [...C.endings].join(', ') || '（无）');
console.log('  在 f10 处最多能有多少只鬼眼:', C.maxEyesAtF10);

console.log('\n=== 结论 ===');
const okA = A.nodesSeen.has('g7') && A.endings.has('e_eighth');
const okB = B.nodesSeen.has('g7') && !B.endings.has('e_eighth');
if (okA && okB) {
  console.log('  ✓ 放弃王珊珊的分支已可通往终幕：');
  console.log('    e7r → e8r（鬼婴咬伤，+4 只鬼眼）→ act5 … f10「咬下手臂上的一只眼睛」→ f11 → g1b → g7，');
  console.log('    并在 g7 触发以 flag:left_wang 为条件的「回头去找那个第八个人」→ e_eighth。');
  console.log('  ✓ 救下王珊珊的分支保持不变：可抵达 g7，且不会出现 e_eighth（该选项被 left_wang 锁住）。');
} else {
  console.log('  ✗ 与预期不符：A 到 g7 =', A.nodesSeen.has('g7'), '，A 到 e_eighth =', A.endings.has('e_eighth'),
              '，B 到 g7 =', B.nodesSeen.has('g7'), '，B 出现 e_eighth =', B.endings.has('e_eighth'));
  process.exitCode = 1;
}