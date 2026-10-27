/* =========================================================
   QA 独立验收驱动（quality-lead / T6）
   ---------------------------------------------------------
   不依赖 tests/suite_*.js 的任何断言：这里从标题页点「开始」开始，
   用真实的 #choices 按钮 / #stage 点击推进，跑完整局，记录每一步的状态。
   目的：验证"玩家真的会遇到什么"，而不是"引擎函数单独调用返回什么"。
   ========================================================= */
'use strict';
const { boot } = require('./harness');

function click(el) {
  el.dispatchEvent({ type: 'click', target: el, stopPropagation() {}, preventDefault() {} });
}

function snap(api) {
  const s = api.state;
  if (!s) return null;
  return {
    node: s.node,
    clock: s.stats.clock,
    knock: s.stats.knock,
    battery: s.stats.battery,
    eyes: s.stats.eyes,
    corruption: s.stats.corruption,
    sanity: s.stats.sanity,
    survivors: s.stats.survivors,
    clues: (s.clues || []).length,
    obsCount: s.obsCount || 0,
    rollbacks: s.rollbackCount || 0
  };
}

/* 观察层：点掉所有"看得见且点得动"的热点。
   不使用 harness.clearObserve（它会把已知缺陷 catch 掉），这里任何异常都会冒出来。 */
async function observeAll(api, maxClicks) {
  let guard = 0;
  let clicked = 0;
  const cap = maxClicks == null ? Infinity : maxClicks;
  while (api.observeOpen() && guard++ < 200 && clicked < cap) {
    const spots = api.$$('#observe-layer .hotspot:not(.found):not(.too-dark)');
    if (!spots.length) break;
    click(spots[0]); clicked++;
    await api.drain(300);
    if (!api.$('#observe-card').hidden) {
      const close = api.$('#observe-card-close');
      if (!close) throw new Error('观察卡片的关闭按钮不见了');
      click(close);
      await api.drain(300);
    }
  }
  if (api.observeOpen()) {
    const exit = api.$('#observe-exit');
    if (exit) click(exit);
    await api.drain(300);
  }
  if (api.observeOpen()) throw new Error('观察层关不掉（疑似刷新/退出逻辑缺陷）');
  return clicked;
}

async function startGame(diff, opts = {}) {
  const api = await boot({ quiet: true, search: opts.search || '', storage: opts.storage });
  if (diff) {
    api.run(`__game.setDifficulty(${JSON.stringify(diff)})`);
    await api.drain(200);
  }
  const btn = api.$('#boot .menu-item[data-act="new"]')
           || api.$$('#boot .menu-item').find(b => b.dataset.act === 'new');
  if (!btn) throw new Error('标题页没有「开始」入口');
  click(btn);
  await api.drain(1200);
  return api;
}

/* 主驱动。
   pick(cs, api, ctx) -> 选项下标；（cs 里的 .isObserve 是「观察四周」入口）
   observe: 'never' | 'all' | { nodes: Set/Array, limit? } */
async function play(opts = {}) {
  const api = await startGame(opts.diff, opts);
  const maxSteps = opts.maxSteps || 6000;
  const trace = [];
  const visits = [];              // 每次节点切换后的快照（含被强制转场的节点）
  const texts = [];               // 屏幕上出现过的台词（去重），用于验证"被超时拽走时读到的那句"
  let observeRuns = 0;
  let steps = 0;
  let stallSig = '', stall = 0;
  let lastNode = null;
  const darkNodes = new Set();     // 已经确认"全部热点点不动（太黑）"的节点，避免无限重进
  const darkVisits = [];           // 玩家点进观察层却发现"一处也点不动"的节点（UX 死胡同证据）
  const obsCapped = new Set();     // 只准看 N 处的节点，看完 N 处后不再重进
  const noteVisit = () => {
    const id = api.nodeId;
    if (id !== lastNode) {
      lastNode = id;
      visits.push({ ...snap(api), forcedF10: !!(api.state && api.state.flags.__timeup) });
    }
  };
  noteVisit();

  const wantsObserve = () => {
    const pol = opts.observe || 'never';
    if (darkNodes.has(api.nodeId) || obsCapped.has(api.nodeId)) return false;
    if (pol === 'all') return true;
    if (pol === 'only') {
      const list = opts.observeNodes || [];
      return list.indexOf(api.nodeId) >= 0;
    }
    return false;
  };

  while (steps++ < maxSteps) {
    noteVisit();
    { const shown = api.text(); if (shown && texts.indexOf(shown) < 0) texts.push(shown); }
    if (api.endingVisible()) break;
    if (api.observeOpen()) {
      const nodeNow = api.nodeId;
      const capMap = opts.observeMax || {};
      const cap = capMap[nodeNow];
      const got = await observeAll(api, cap);
      if (cap != null && got >= cap) obsCapped.add(nodeNow);
      if (!got) { darkNodes.add(nodeNow); darkVisits.push(nodeNow); }
      observeRuns++;
      noteVisit();
      continue;
    }

    const cs = api.choices();
    if (cs.length) {
      const obsBtn = cs.find(c => c.isObserve);
      if (obsBtn && !obsBtn.locked && wantsObserve()) {
        click(obsBtn.el);
        await api.drain(400);
        continue;
      }
      const idx = opts.pick ? await opts.pick(cs, api, { trace, steps }) : 0;
      if (idx == null || idx < 0 || idx >= cs.length) {
        return { stall: 'no-choice-picked', node: api.nodeId, choices: cs.map(c => c.text), steps, trace, api };
      }
      if (cs[idx].locked) {
        return { stall: 'picked-locked: ' + cs[idx].text, node: api.nodeId, steps, trace, api };
      }
      trace.push({ step: steps, node: api.nodeId, text: cs[idx].text, stats: snap(api) });
      click(cs[idx].el);
      await api.drain(400);
      continue;
    }
    const sig = api.nodeId + '|' + (api.text() || '');
    if (sig === stallSig) { if (++stall > 40) return { stall: 'stuck', node: api.nodeId, text: api.text(), steps, trace, api }; }
    else { stall = 0; stallSig = sig; }
    api.advance();
    await api.drain(400);
  }

  return {
    stall: api.endingVisible() ? null : 'max-steps',
    ending: api.endingVisible() ? api.endingTitle() : null,
    endStat: api.endingVisible() ? api.endingStat() : null,
    steps, observeRuns,
    final: snap(api),
    difficulty: api.state && api.state.difficulty,
    trace, visits, darkVisits, texts, api
  };
}

/* 「无脑流」：永远选第一个没被锁的剧情选项（不点观察） */
const firstUnlocked = (cs) => {
  for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve) return i;
  return null;
};
/* 按文本关键字选（找不到就退回第一个可选剧情项） */
const byText = (needle) => (cs) => {
  for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve && cs[i].text.indexOf(needle) >= 0) return i;
  return firstUnlocked(cs);
};

module.exports = { startGame, play, click, snap, observeAll, firstUnlocked, byText };
