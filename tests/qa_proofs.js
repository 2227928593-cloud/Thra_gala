/* =========================================================
   T6 独立验收 · 8 项证明（quality-lead）
   ---------------------------------------------------------
   全部走真实引擎 + 真实 DOM 事件 + 虚拟时钟；不看现有测试的自述。
   运行：node tests/qa_proofs.js
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { boot } = require('./harness');
const { play, startGame, click, snap } = require('./qa_driver');

const ROOT = path.resolve(__dirname, '..');
const fmt = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const out = [];
const records = [];
let fails = 0;
function say(s) { out.push(s); console.log(s); }
function check(name, ok, detail) {
  records.push({ name, ok });
  if (!ok) fails++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
}

/* ---------- 通用：按 ?node= 直接落到某个节点（真实引擎，不算作弊，只跳过前摇） */
async function bootAt(node, params = {}) {
  const q = Object.entries({ node, diff: 'standard', ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const api = await boot({ quiet: true, search: '?' + q });
  await api.drain(600);
  await api.toDecision(600);
  return api;
}

/* 等到引擎真正空闲（黑幕/幕卡/打字机都结束、confirm 关掉）再读 DOM，
   否则会在黑幕期间读到空选项列表 —— 这是驱动问题，不是引擎问题。 */
async function settleGame(api, tries = 60) {
  for (let i = 0; i < tries; i++) {
    await api.drain(400);
    const busy = api.run('__game.busy');
    const typing = api.run('__game.typing');
    const confirmHidden = api.$('#confirm').hidden;
    if (!busy && !typing && confirmHidden) return true;
  }
  return false;
}

/* 一直点画面推进，直到出现选项 / 结局 / 观察层 / 达到目标节点 */
async function advanceUntil(api, stopNode, max = 400) {
  for (let i = 0; i < max; i++) {
    if (api.endingVisible()) return 'ending';
    if (api.nodeId === stopNode) return 'node';
    if (api.observeOpen()) return 'observe';
    if (api.choices().length) return 'choices';
    api.advance();
    await api.drain(400);
  }
  return 'limit';
}
/* 一路选第一个非 locked 剧情项，直到结局或到达目标节点 */
async function pushOn(api, stopNode, max = 400) {
  for (let i = 0; i < max; i++) {
    if (api.endingVisible()) return 'ending';
    if (api.nodeId === stopNode) return 'node';
    if (api.observeOpen()) { api.$('#observe-exit') && click(api.$('#observe-exit')); await api.drain(200); continue; }
    const cs = api.choices();
    if (cs.length) {
      const c = cs.find(x => !x.locked && !x.isObserve);
      if (c) { click(c.el); await api.drain(500); continue; }
      const ob = cs.find(x => x.isObserve);
      if (ob) { click(ob.el); await api.drain(300); continue; }
      return 'stuck';
    }
    api.advance();
    await api.drain(400);
  }
  return 'limit';
}

/* 用"系统开了减少动效"的沙箱加载真实引擎（harness 的 matchMedia 恒为 false，测不到这条） */
async function bootWithSystemReducedMotion() {
  const vm = require('vm');
  const { createEnvironment, createLocalStorage } = require('./dom');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const { doc, win } = createEnvironment(html, { search: '' });
  win.matchMedia = () => ({ matches: true, addEventListener() {}, addListener() {} });
  const sandbox = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    document: doc, localStorage: createLocalStorage(),
    location: win.location, navigator: win.navigator, Image: win.Image,
    getComputedStyle: win.getComputedStyle, matchMedia: win.matchMedia,
    requestAnimationFrame: fn => setTimeout(fn, 0), cancelAnimationFrame: id => clearTimeout(id),
    setTimeout, clearTimeout, setInterval, clearInterval,
    URLSearchParams, performance: { now: () => 0 }, queueMicrotask
  };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  sandbox.addEventListener = win.addEventListener;
  sandbox.removeEventListener = win.removeEventListener;
  sandbox.dispatchEvent = win.dispatchEvent;
  sandbox.innerWidth = 1366; sandbox.innerHeight = 768; sandbox.devicePixelRatio = 1;
  vm.createContext(sandbox);
  for (const f of ['js/audio.js', 'js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js', 'js/engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
  }
  doc.dispatchEvent({ type: 'DOMContentLoaded' });
  return { doc, sandbox };
}

/* ---------- P3 目标流：一手一脚的选项表 ---------- */
const P3_PLAN = {
  act1: '往下读', p2: '继续往下翻', p4: '往下翻', p5: '不点。把手机扣在',
  p8: '鼓掌', p9: '坐直', p10: '举手。', p11: '举手提问', p14: '方镜，你', p16: '拉着张伟',
  p17b: '跟着人群', p18: '转身，往楼下跑', act3: '停下来', c2: '停在这里', c3: '抓住方镜',
  d1: '顺着水声', d2: '用力挣扎', d4: '加快脚步', d5: '朝那点红光', d6: '站起来', d7: '立刻离开',
  act4: '周先生', e1: '接过电话', e2: '往下跑', e4: '行了', e6: '冲过去', e7: '咬紧牙', e8: '把她扶起来',
  act5: '去校门', f1: '回来', f2: '立刻挂断', f3: '扑过去', f4: '冲过去', f5: '把帖子再看一遍',
  f6: '点开线索', f7: '不打', f9: '还有一步', f10: '把所有人聚在一起',
  g1: '数一数', g2: '有件事', g4: '我家沙发', g5: '把手插进口袋', g7: '转过身'
};
const mkPick = over => {
  const P = Object.assign({}, P3_PLAN, over || {});
  return (cs, api) => {
    const want = P[api.nodeId];
    if (want) for (let i = 0; i < cs.length; i++)
      if (!cs[i].locked && !cs[i].isObserve && cs[i].text.indexOf(want) >= 0) return i;
    for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve) return i;
    return null;
  };
};
const firstUnlocked = (cs) => {
  for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve) return i;
  return null;
};
const DESC = (r, label) =>
  `${label}: 结局=${r.ending || ('卡住 ' + r.stall)} · 步数=${r.steps} · 末节点=${r.final.node} · ` +
  `时刻=${fmt(r.final.clock)} · 敲门=${r.final.knock} · 电量=${r.final.battery} · 鬼眼=${r.final.eyes} · ` +
  `复苏=${r.final.corruption} · 同伴=${r.final.survivors}`;

(async () => {
  /* ================= §1 P1 无脑流 ================= */
  say('\n════ §1 P1 无脑流（每步选第一个非 locked、不观察、不用眼睛照明）════');
  const p1 = await play({ diff: 'standard', pick: firstUnlocked, observe: 'never' });
  say('  ' + DESC(p1, 'P1'));
  say('  节点序列: ' + p1.visits.map(v => v.node).join(' > '));
  check('P1 最终不是 e_true', p1.ending !== '五点三十一分', '实际结局「' + p1.ending + '」');

  /* ================= §2 P2 全观察流 ================= */
  say('\n════ §2 P2 全观察流（能看就看，其余同 P1）════');
  const p2 = await play({ diff: 'standard', pick: firstUnlocked, observe: 'all' });
  say('  ' + DESC(p2, 'P2'));
  say(`  观察次数=${p2.observeRuns} · 观察点总次数=${p2.final.obsCount} · 点进去"一处也点不动"的节点=${JSON.stringify(p2.darkVisits)}`);
  const p2nodes = p2.visits.map(v => v.node);
  const iAct6 = p2nodes.indexOf('act6');
  const afterAct6 = iAct6 >= 0 ? p2nodes[iAct6 + 1] : null;
  const corrAtAct6 = (p2.visits.find(v => v.node === 'act6') || {}).corruption;
  say(`  到终幕时复苏=${corrAtAct6}%，act6 之后的节点=${afterAct6}（g1 入口的复苏判定）`);
  say('  节点序列: ' + p2nodes.join(' > '));
  check('P2 最终不是 e_true', p2.ending !== '五点三十一分', '实际结局「' + p2.ending + '」');
  check('P2 走完第四幕后在 g1 入口被判复苏失控（不是靠跳过 f9 侥幸活下来）',
    afterAct6 === 'end_absorb', `act6 之后是 ${afterAct6}；复苏 ${corrAtAct6}%`);

  /* ================= §3 P3 目标流 ================= */
  say('\n════ §3 P3 目标流（只在 act2 看 1 处 ghost_domain、f10 看 o_f10_eyes，其余不贪）════');
  const p3 = await play({ diff: 'standard', pick: mkPick(), observe: 'only', observeNodes: ['act2', 'f10'], observeMax: { act2: 1, f10: 1 } });
  say('  ' + DESC(p3, 'P3'));
  say('  完整选项序列：');
  p3.trace.forEach((t, i) => say(`   ${String(i + 1).padStart(2)}. ${t.node} 「${t.text}」 (${fmt(t.stats.clock)} · 敲${t.stats.knock} · 电${t.stats.battery} · 眼${t.stats.eyes} · 复${t.stats.corruption})`));
  say('  最终线索：' + p3.api.state.clues.join(', '));
  check('P3 能到 e_true', p3.ending === '五点三十一分', '实际结局「' + p3.ending + '」');
  {
    const g1v = p3.visits.find(v => v.node === 'g1');
    say(`  到 g1 时复苏=${g1v ? g1v.corruption : '(未到)'}%（标准档失控线 85%）`);
    check('P3 到 g1 复苏未过线，因此仍能拿 e_true',
      !!g1v && g1v.corruption < 85 && p3.ending === '五点三十一分',
      `g1 复苏 ${g1v && g1v.corruption}%`);
  }

  /* ================= §4 七结局可达性 ================= */
  say('\n════ §4 七个结局可达性（真实引擎逐条构造）════');
  const SEVEN = [
    ['e_true', '五点三十一分', {}, ['act2', 'f10'], { act2: 1, f10: 1 }],
    ['e_alone', '一个人走出校门', { g7: '一个人走开' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
    ['e_eighth', '第八个人', { e6: '转身，跑', e8: '我救不了', f10: '把所有人聚在一起', g7: '回头去找' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
    ['e_absorb', '成为鬼', { g7: '把手背上的眼睛' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
    ['e_written', '被写下的人', { f7: '拨通方镜', f8: '再打一次', f10: '纸上是这么写的' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
    ['e_door', '门后的第十三次', { f10: '闭上眼睛' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
    ['e_stairs', '永远的五楼', { c2: '往回走', c2c: '站着不动' }, [], {}]
  ];
  const reach = {};
  for (const [id, title, over, nodes, max] of SEVEN) {
    const r = await play({ diff: 'standard', pick: mkPick(over), observe: 'only', observeNodes: nodes, observeMax: max });
    reach[id] = r.ending === title;
    const path = r.trace.map(t => t.node).join('>');
    const f10n = r.visits.filter(v => v.node === 'f10').length;
    say(`  ${id.padEnd(9)} → ${r.ending}（期望「${title}」）  进入时资源：敲${r.final.knock}/电${r.final.battery}/眼${r.final.eyes}/复${r.final.corruption}/同伴${r.final.survivors}/时刻${fmt(r.final.clock)}  f10播放${f10n}次`);
    say(`            最短路径：${path}`);
    check(`${id} 可达`, reach[id], r.ending === title ? '' : '实际 ' + r.ending);
  }

  /* 噩梦档存在性证明：三条常规策略全灭，但"精确走线"能通关（否则噩梦=不可玩） */
  {
    const NIGHT_PLAN = Object.assign({}, P3_PLAN, {
      e6: '冲过去', e7: '咬紧牙', d4: '屏住呼吸', act5: '先坐下', f10: '把所有人聚在一起'
    });
    const pickN = (cs, api) => {
      const want = NIGHT_PLAN[api.nodeId];
      if (want) for (let i = 0; i < cs.length; i++)
        if (!cs[i].locked && !cs[i].isObserve && cs[i].text.indexOf(want) >= 0) return i;
      for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve) return i;
      return null;
    };
    /* 关键：先在 p16 看一处拿到 knock_rule，d4 才有「屏息」可用（−2 敲门） */
    const rn = await play({ diff: 'nightmare', pick: pickN, observe: 'only', observeNodes: ['p16', 'f10'], observeMax: { p16: 1, f10: 1 } });
    say(`  噩梦档精确走线：结局=${rn.ending} · 敲门=${rn.final.knock}（阈值 11）· 复苏=${rn.final.corruption}（失控线 75）· 同伴=${rn.final.survivors} · 时刻=${fmt(rn.final.clock)}`);
    say('  路径：' + rn.visits.map(v => v.node).join('>'));
    check('噩梦档存在可通关走线（不是不可玩）', rn.ending === '五点三十一分', '实际 ' + rn.ending);
    check('噩梦档通关走线必须在敲门阈值下方留出余量（≤10）', rn.final.knock <= 10, '敲门 ' + rn.final.knock);
  }

  /* ================= §5 k13 回跳 ================= */
  say('\n════ §5 k13 回跳（敲门到 13 → k13 → 屏息）════');
  {
    const api = await bootAt('d5', { knock: 12, clues: 'knock_rule', clock: '01:10' });
    say('  起手：node=' + api.nodeId + ' knock=' + api.state.stats.knock + '（阈值 13）');
    const cs = api.choices();
    say('  d5 选项：' + cs.map(c => `「${c.text}」${c.locked ? '(锁)' : ''}`).join(' '));
    const idx = cs.findIndex(c => c.text.indexOf('朝那点红光') >= 0);
    click(cs[idx].el); await api.drain(600);
    say('  选「朝那点红光」→ 敲门 ' + api.state.stats.knock + '，当前节点 ' + api.nodeId);
    // k13 的台词要先播完才会出选项
    for (let i = 0; i < 40 && !api.choices().length && !api.endingVisible(); i++) { api.advance(); await api.drain(400); }
    check('敲门到 13 会进入 k13', api.nodeId === 'k13', '当前节点 ' + api.nodeId);
    say('  k13 选项：' + api.choices().map(c => `「${c.text}」${c.locked ? '(锁)' : ''}`).join(' '));
    const pass = api.choices().find(c => c.text.indexOf('屏住呼吸') >= 0);
    check('k13 的「屏息」在持有 knock_rule 时可点', !!pass && !pass.locked, pass ? (pass.locked ? '被锁' : '可点') : '不存在');
    click(pass.el);
    await api.drain(600);
    await advanceUntil(api, 'd6');
    await api.drain(400);
    say('  屏息之后：node=' + api.nodeId + ' · knock=' + api.state.stats.knock + ' · 同伴=' + api.state.stats.survivors + ' · actStart=' + api.state.actStart);
    check('屏息后回到"触发节点 d6"而不是 actStart(act3)', api.nodeId === 'd6', '实际 ' + api.nodeId);
    // 继续走两步，确认不会二次触发
    const still = await pushOn(api, 'd7');
    say('  继续推进到 ' + api.nodeId + '（' + still + '），敲门 ' + api.state.stats.knock);
    check('k13 不会二次触发', api.nodeId !== 'k13', '当前 ' + api.nodeId);
    say('  __k13_back=' + api.state.flags.__k13_back + ' · __k13=' + api.state.flags.__k13 + ' · __k13_return=' + api.state.flags.__k13_return);
  }

  /* ================= §6 三档存档语义 ================= */
  say('\n════ §6 三档存档语义 ════');
  const menuOf = async (diff) => {
    const api = await startGame(diff);
    click(api.$('#btn-menu')); await api.drain(300);
    const vis = {};
    ['save', 'load', 'restart'].forEach(a => {
      const b = api.$(`#modal-menu [data-act="${a}"]`);
      vis[a] = !!(b && !b.hidden);
    });
    vis.note = api.$('#menu-note').textContent;
    api.$('#modal-menu').hidden = true;
    return { api, vis };
  };
  const story = await menuOf('story');
  const std = await menuOf('standard');
  const night = await menuOf('nightmare');
  say(`  故事档菜单：保存=${story.vis.save} 读取=${story.vis.load} 回到本节点开头=${story.vis.restart}  文案「${story.vis.note}」`);
  say(`  标准档菜单：保存=${std.vis.save} 读取=${std.vis.load} 回到本节点开头=${std.vis.restart}  文案「${std.vis.note}」`);
  say(`  噩梦档菜单：保存=${night.vis.save} 读取=${night.vis.load} 回到本节点开头=${night.vis.restart}  文案「${night.vis.note}」`);
  check('故事档：保存/读取/回到本节点都在', story.vis.save && story.vis.load && story.vis.restart);
  check('标准档：无手动保存/读取，只有「回到本场景开头」', !std.vis.save && !std.vis.load && std.vis.restart,
    `保存=${std.vis.save} 读取=${std.vis.load} 回退=${std.vis.restart}`);
  check('噩梦档：三个入口全部移除', !night.vis.save && !night.vis.load && !night.vis.restart);

  /* 死亡回滚：标准 = 场景开头 */
  const dieOnce = async (diff, params = {}) => {
    const api = await bootAt('d4', { diff, clock: '01:00', knock: 5, corr: 0, ...params });
    const sceneStart = api.state.ck && api.state.ck.node;
    const c1 = api.choices();
    click(c1.find(c => c.text.indexOf('加快脚步') >= 0).el); await api.drain(600);
    await api.toDecision(600);
    const at = api.nodeId;
    const ckAtDeath = api.state.ck && api.state.ck.node;
    const knockAtDeath = api.state.stats.knock;
    const c2 = api.choices();
    click(c2.find(c => c.text.indexOf('我不跑了') >= 0).el); await api.drain(800);
    const endTitle = api.endingTitle();
    const deathPending = !!api.state.deathPending;
    const again = api.$('#modal-end [data-act="again"]');
    const againText = again ? again.textContent : '(无)';
    if (again) { click(again); await api.drain(1200); }
    return { api, sceneStart, ckAtDeath, knockAtDeath, at, endTitle, deathPending, againText, nodeAfter: api.nodeId, stats: snap(api), rollbackCount: api.state.rollbackCount };
  };
  const dStd = await dieOnce('standard');
  say(`  标准档死在 e_door：deathPending=${dStd.deathPending} · 按钮「${dStd.againText}」 · 死亡节点=${dStd.at} · 进 d4 时锚点=${dStd.sceneStart} · 死亡时锚点=${dStd.ckAtDeath} → 回滚到 ${dStd.nodeAfter} · 资源 ${JSON.stringify(dStd.stats)} · rollbackCount=${dStd.rollbackCount}`);
  check('标准档：死亡回滚到场景开头（d4，而不是死亡节点 d5）', dStd.nodeAfter === 'd4', '实际 ' + dStd.nodeAfter + '（死亡时 ck=' + dStd.ckAtDeath + '）');
  check('标准档：回滚后资源维持当时值（敲门不扣）', dStd.stats.knock === dStd.knockAtDeath, `死亡时 ${dStd.knockAtDeath} → 回滚后 ${dStd.stats.knock}`);

  /* 定位根因：rotAfter 换图让 "场景" 变了名，ck（场景锚点）被重写 */
  {
    const api = await bootAt('d4', { diff: 'standard', clock: '01:00' });
    const s4 = api.run("(()=>{const n=STORY.nodes.d4;return (n.rotAfter?String(n.rotAfter):'')+'|'+n.scene})()");
    const ckAtD4 = api.state.ck && api.state.ck.node;
    const c1 = api.choices();
    click(c1.find(c => c.text.indexOf('加快脚步') >= 0).el); await api.drain(600);
    await api.toDecision(600);
    const s5 = api.run("(()=>{const n=STORY.nodes.d5;return (n.rotAfter?String(n.rotAfter):'')+'|'+n.scene})()");
    say(`  d4 定义=${s4} → d5 定义=${s5}；进入 d5 后可见场景=${api.visibleScene()}`);
    say(`  进 d4 时 ck=${ckAtD4}；进入 d5（rot 图换了名字）后 ck=${api.state.ck && api.state.ck.node}`);
    check('死亡锚点应在换"场景"时才写，rotAfter 换图不应重置锚点',
      (api.state.ck && api.state.ck.node) === ckAtD4,
      (api.state.ck && api.state.ck.node) === ckAtD4
        ? `ck 保持 ${ckAtD4}（rot 换图没有重置锚点）`
        : `ck 从 ${ckAtD4} 漂移到 ${api.state.ck && api.state.ck.node}`);
  }

  const dNight = await dieOnce('nightmare', { knock: 8, corr: 90 });
  say(`  噩梦档死一次：→ ${dNight.nodeAfter} · knock=${dNight.stats.knock}（死亡时 ${dNight.knockAtDeath}）· 同伴=${dNight.stats.survivors} · 复苏=${dNight.stats.corruption} · rollbackCount=${dNight.rollbackCount}`);
  check('噩梦档：回滚到场景开头 d4', dNight.nodeAfter === 'd4', '实际 ' + dNight.nodeAfter);
  check('噩梦档：knock 惩罚净效果不为负（夹上限也不能变成奖励）',
    dNight.stats.knock >= dNight.knockAtDeath,
    `${dNight.knockAtDeath} → ${dNight.stats.knock}（+3 被夹到 danger−1=9，但不得低于死亡时）`);
  check('噩梦档：同伴 −1', dNight.stats.survivors === 39, '同伴 ' + dNight.stats.survivors);
  check('噩梦档：复苏夹到 brk−15=60', dNight.stats.corruption === 60, '复苏 ' + dNight.stats.corruption);

  /* knock 还没顶到上限时，+3 必须真的加上去 */
  const dNightLow = await dieOnce('nightmare', { knock: 2 });
  say(`  噩梦档低敲门死一次：死亡时 ${dNightLow.knockAtDeath} → 回滚后 ${dNightLow.stats.knock}`);
  check('噩梦档：低敲门时 +3 真实生效（3 → 6）', dNightLow.stats.knock === dNightLow.knockAtDeath + 3,
    `${dNightLow.knockAtDeath} → ${dNightLow.stats.knock}`);

  /* 噩梦回滚次数上限 3：每次都在"引擎空闲"之后才读 DOM（黑幕期间读会误判） */
  {
    const api = await bootAt('d4', { diff: 'nightmare', clock: '01:00', knock: 2 });
    let deaths = 0, guard = 0;
    while (guard++ < 12) {
      await settleGame(api);
      if (api.nodeId === 'act1') break;                 // 次数用尽 → 已按"再来一夜"重开
      if (api.endingVisible()) {
        deaths++;
        const again = api.$('#modal-end [data-act="again"]');
        const label = again ? again.textContent : '(无)';
        say(`    第 ${deaths} 次死：按钮「${label}」`);
        if (again) click(again);
        await settleGame(api);
        continue;
      }
      const run = api.choices().find(c => c.text.indexOf('加快脚步') >= 0);
      if (!run) { await api.toDecision(400); continue; }
      click(run.el); await settleGame(api); await api.toDecision(400);
      const die = api.choices().find(c => c.text.indexOf('我不跑了') >= 0);
      if (!die) { await api.toDecision(300); continue; }
      click(die.el); await settleGame(api);
    }
    check('噩梦档：回滚次数上限 3 次，第 4 次死会重开', deaths === 4 && api.nodeId === 'act1',
      `死亡 ${deaths} 次，最终节点 ${api.nodeId}，rollbackCount=${api.state.rollbackCount}`);
  }

  /* 故事档：坏结局不回滚 */
  const dStory = await dieOnce('story');
  say(`  故事档死在 e_door：deathPending=${dStory.deathPending} · 按钮「${dStory.againText}」 · 之后 node=${dStory.nodeAfter}`);
  check('故事档：坏结局不回滚（按钮为「再来一夜」并重开）', !dStory.deathPending && dStory.againText === '再来一夜' && dStory.nodeAfter === 'act1',
    `deathPending=${dStory.deathPending} 按钮=${dStory.againText} node=${dStory.nodeAfter}`);

  /* 旧 v1 存档 */
  say('\n  旧版存档（v1：无 v / 无 difficulty / 无锚点）：');
  {
    const v1 = { node: 'd2', line: 0, flags: {}, stats: { clock: 1400, knock: 5, eyes: 0, corruption: 10, battery: 70, survivors: 38 }, clues: ['drip'], items: {}, codex: [] };
    const api = await boot({ quiet: true, storage: { 'thragal.save.v1': JSON.stringify(v1) } });
    await api.drain(300);
    say('  标题页「继续」按钮 disabled=' + api.$('#btn-continue').disabled + ' 文案「' + api.$('#continue-meta').textContent + '」');
    click(api.$('#btn-continue')); await api.drain(1500);
    const s = snap(api);
    say('  读入后 node=' + api.nodeId + ' 档位=' + api.state.difficulty + ' 资源=' + JSON.stringify(s));
    check('v1 存档按标准档继续', api.state.difficulty === 'standard', api.state.difficulty);
    check('v1 存档不丢进度（节点/敲门/电量都在）', api.nodeId === 'd2' && s.knock === 5 && s.battery === 70, JSON.stringify(s));
  }

  /* resume 不重复结算 stats */
  {
    const v2 = { v: 2, node: 'e8r', line: 0, flags: {}, stats: { clock: 1500, knock: 4, eyes: 5, corruption: 29, battery: 80, survivors: 37 }, clues: [], items: {}, codex: [], difficulty: 'standard' };
    const api = await boot({ quiet: true, storage: { 'thragal.save.v1': JSON.stringify(v2) } });
    await api.drain(300);
    click(api.$('#btn-continue')); await api.drain(1500);
    const s = snap(api);
    say(`\n  读档重入 e8r（enter 里有 stats eyes+4 / corruption+18）：读入后 眼=${s.eyes} 复苏=${s.corruption}（存档里是 5 / 29）`);
    check('resume 不重复结算节点 stats', s.eyes === 5 && s.corruption === 29, `眼 ${s.eyes} 复苏 ${s.corruption}`);
  }

  /* ================= §7 资源真的咬人 ================= */
  say('\n════ §7 电量/复苏是否真的咬人 ════');
  /* 7.1 同一节点、同一状态，只改电量：d7 的 4 个观察点能看到几处 */
  {
    const probe = async (battery) => {
      const api = await bootAt('d7', { battery, eyes: 0, corr: 0, diff: 'standard', clock: '00:05' });
      const all = api.run('__game.observationRemaining(STORY.nodes.d7).length');
      const vis = api.run('__game.observationVisible(STORY.nodes.d7).length');
      const labels = api.run('JSON.stringify(__game.observationVisible(STORY.nodes.d7).map(o=>o.id))');
      return { all, vis, labels, api };
    };
    const hi = await probe(100), lo = await probe(0);
    say(`  d7（4 个观察点）电量100%：可见 ${hi.vis}/${hi.all} → ${hi.labels}`);
    say(`  d7（4 个观察点）电量  0%：可见 ${lo.vis}/${lo.all} → ${lo.labels}`);
    const cls = lo.api.run('JSON.stringify(__game.observationRemaining(STORY.nodes.d7).map(o=>[o.id,__game.lightPlan(o).kind]))');
    say('  电量 0 且 eyes=0 时，每个点的照明方案：' + cls);
    check('电量 0 会吞掉部分观察点', lo.vis < hi.vis, `${hi.vis} → ${lo.vis}`);
  }
  /* 7.2 关键线索是否被吞：ghost_domain 的三处来源在电量 0 时还在不在 */
  {
    const api = await bootAt('act2', { battery: 0, eyes: 0, diff: 'standard', clock: '22:20' });
    const vis = api.run('JSON.stringify(__game.observationVisible(STORY.nodes.act2).map(o=>[o.id,__game.lightPlan(o).kind]))');
    say('  电量 0 / eyes 0 的 act2：' + vis);
    const plan = api.run("__game.lightPlan(STORY.nodes.act2.observe[0]).kind");
    check('电量 0 且没有鬼眼时，关键线索点变成"太黑点不开"', plan === 'too-dark', 'lightPlan=' + plan);
  }
  /* 7.3 缺任一关键线索 → 终幕第一个选项锁死（真结局进不去）。门槛从数据里读，不写死。 */
  {
    const probe = await boot({ quiet: true });
    const gate = JSON.parse(probe.run('JSON.stringify(STORY.nodes.g7.choices[0].when)'));
    const allClues = gate.allClues || [];
    const minSurv = gate.minSurvivors || 0;
    const open = await bootAt('g7', { clues: allClues.join(','), eyes: 5, corr: 40, survivors: minSurv, diff: 'standard', clock: '05:20' });
    const openOpt = open.choices().find(c => c.text.indexOf('转过身') >= 0);
    say(`  g7 真结局门槛（读自数据）：allClues=[${allClues.join(',')}] · minSurvivors=${minSurv}`);
    say(`  线索齐 + 同伴 ${minSurv}：真结局选项 locked=${openOpt && openOpt.locked}`);
    check('线索齐时真结局选项可点', !!openOpt && !openOpt.locked, 'locked=' + (openOpt && openOpt.locked));

    const lack = allClues[allClues.length - 1];
    const partial = allClues.filter(c => c !== lack);
    const shut = await bootAt('g7', { clues: partial.join(','), eyes: 5, corr: 40, survivors: minSurv, diff: 'standard', clock: '05:20' });
    const shutOpt = shut.choices().find(c => c.text.indexOf('转过身') >= 0);
    say(`  只缺 ${lack}：真结局选项 locked=${shutOpt && shutOpt.locked}`);
    check(`缺「${lack}」→ 真结局选项锁死`, !!shutOpt && shutOpt.locked, 'locked=' + (shutOpt && shutOpt.locked));
  }
  /* 7.4 电量 0 能不能靠鬼眼补救 → 真结局还能不能到 */
  {
    const api = await bootAt('f10', { battery: 0, eyes: 5, corr: 20, clues: 'eye_rule,ghost_domain', diff: 'standard', clock: '05:20' });
    const kind = api.run('__game.lightPlan(STORY.nodes.f10.observe[0]).kind');
    say('  f10 / 电量0 / 鬼眼5 / 复苏20：o_f10_eyes 的照明方案 = ' + kind);
    check('电量 0 时关键观察点会被鬼眼顶上来（不锁死）', kind === 'eye' || kind === 'eye-free' || kind === 'free', kind);
  }
  /* 7.5 真正咬人的是复苏：电量 0 → 只能用鬼眼 → 幕末 end_absorb */
  {
    const api = await bootAt('act5', { battery: 0, eyes: 5, corr: 84, clues: 'eye_rule,ghost_domain', diff: 'standard', clock: '03:10' });
    say('  act5 / 电量0 / 鬼眼5 / 复苏84（失控线 85）：当前节点 ' + api.nodeId);
    const ob = api.choices().find(c => c.isObserve);
    click(ob.el); await api.drain(400);
    const hs = api.$$('#observe-layer .hotspot:not(.too-dark)');
    const plan = hs.length ? hs[0].className : '(无)';
    click(hs[0]); await api.drain(400);
    const c0 = api.$('#observe-card-close');
    if (c0) { click(c0); await api.drain(300); }
    if (api.observeOpen()) { click(api.$('#observe-exit')); await api.drain(300); }
    say(`  电量 0 → 第一处热点 class=${plan}；看完后复苏 ${api.state.stats.corruption}%`);
    const beforeCorr = api.state.stats.corruption;
    await pushOn(api, 'f9');
    say('  走到 ' + api.nodeId + '，复苏 ' + api.state.stats.corruption + '% → 结局 ' + (api.endingVisible() ? api.endingTitle() : '(未到)'));
    check('电量 0 逼出鬼眼照明 → 复苏过线 → 幕末 end_absorb（这条链是真的）',
      api.endingVisible() && api.endingTitle() === '成为鬼', `复苏 ${beforeCorr} → ${api.state.stats.corruption}`);
  }

  /* ================= §8 可访问性 ================= */
  say('\n════ §8 可访问性 ════');
  {
    const api = await bootAt('d7', { diff: 'standard', clock: '00:05' });
    // 进入观察层
    const ob = api.choices().find(c => c.isObserve);
    click(ob.el); await api.drain(500);
    const hs = api.$$('#observe-layer .hotspot');
    say('  d7 观察层热点数=' + hs.length);
    const tabs = hs.map(h => h.getAttribute('tabindex'));
    const labels = hs.map(h => h.getAttribute('aria-label'));
    const classes = hs.map(h => h.className);
    say('  tabindex：' + JSON.stringify(tabs));
    say('  aria-label：' + JSON.stringify(labels));
    say('  class：' + JSON.stringify(classes));
    check('热点全部可 Tab 聚焦（tabindex=0）', tabs.every(t => t === '0'));
    check('分级有可读文本（aria-label 含"关键线索/档案/细节"）',
      labels.every(l => /关键线索|档案|细节/.test(l)));
    // Enter 触发
    const before = api.$('#observe-card').hidden;
    hs[0].dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {}, stopPropagation() {} });
    await api.drain(400);
    const after = api.$('#observe-card').hidden;
    say('  Enter 前卡片 hidden=' + before + '，Enter 后 hidden=' + after + '，标题「' + api.$('#observe-card-title').textContent + '」');
    check('Enter 能打开观察点', before === true && after === false);
  }
  {
    const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
    const shapes = {
      key: /\.hotspot\.key::before\{[^}]*border-radius:50%/.test(css),
      ref: /\.hotspot\.ref::before\{[^}]*rotate\(45deg\)/.test(css),
      plain: /\.hotspot\.plain::before\{[^}]*scale\(\.62\)/.test(css)
    };
    say('  CSS 形状区分：' + JSON.stringify(shapes));
    check('分级不只靠颜色（圆 / 菱形 / 小方块）', shapes.key && shapes.ref && shapes.plain);
    const hasMedia = /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css);
    const killsAnim = /body:not\(\.motion-ok\)\s+\*\{[^}]*animation-duration:\.001s/.test(css);
    const readsMM = /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/.test(fs.readFileSync(path.join(ROOT, 'js/engine.js'), 'utf8'));
    say(`  prefers-reduced-motion：CSS @media=${hasMedia} · 关动画规则=${killsAnim} · 引擎读 matchMedia=${readsMM}`);
    check('跟随系统 prefers-reduced-motion（CSS 兜底 + 引擎默认值）', hasMedia && killsAnim && readsMM,
      `@media=${hasMedia} 关动画=${killsAnim} matchMedia=${readsMM}`);
  }
  {
    /* 真跑一次"系统开了减少动效"：用一个 matchMedia 返回 true 的沙箱加载真实引擎 */
    const rec = await bootWithSystemReducedMotion();
    const cls = rec.doc.body.className;
    say('  系统 prefers-reduced-motion=true 时，body.class=' + JSON.stringify(cls));
    check('系统级减少动效会真的打开 body.reduced', /\breduced\b/.test(cls), 'body.class=' + cls);
    const normal = await boot({ quiet: true });
    say('  默认（系统未开）时，body.class=' + JSON.stringify(normal.doc.body.className));
  }
  {
    const api = await bootAt('d6', { diff: 'standard', clock: '00:05' });
    const imgs = api.$$('.sprite img');
    say('  d6 立绘：' + imgs.map(i => i.alt).join(','));
    check('立绘 alt = 角色名', imgs.length > 0 && imgs.every(i => i.alt && i.alt.length > 0), JSON.stringify(imgs.map(i => i.alt)));
    const bgs = api.$$('.bg');
    say('  背景图 aria-hidden=' + bgs.map(b => b.getAttribute('aria-hidden')).join(','));
  }

  /* ================= §9 数据与 README 一致性 ================= */
  say('\n════ §9 数据 / README 一致性（独立核对）════');
  {
    const api = await boot({ quiet: true });
    const counts = api.run(`JSON.stringify({
      nodes: Object.keys(STORY.nodes).length,
      endings: ENDINGS.length,
      clue: CODEX.clue.length, ghost: CODEX.ghost.length,
      person: CODEX.person.length, memory: CODEX.memory.length
    })`);
    const c = JSON.parse(counts);
    const total = c.clue + c.ghost + c.person + c.memory;
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const nums = (readme.match(/\d[\d,]*/g) || []).map(x => +x.replace(/,/g, ''));
    say(`  实际：节点 ${c.nodes} · 结局 ${c.endings} · 档案 ${total}（线索 ${c.clue}+鬼物 ${c.ghost}+人物 ${c.person}+记忆 ${c.memory}）`);
    const has = n => nums.includes(n);
    /* 不写死节点数：数据每加一个节点都要能过。断言的是"README 与数据一致"。 */
    say(`  README 是否出现 节点 ${c.nodes} / 档案 ${total} / 线索 ${c.clue}：${has(c.nodes)} / ${has(total)} / ${has(c.clue)}`);
    check(`README 的数字与数据一致（节点 ${c.nodes} · 档案 ${total} · 线索 ${c.clue}）`,
      has(c.nodes) && has(total) && has(c.clue));
  }

  /* ================= §10 其余对抗性检查 ================= */
  say('\n════ §10 对抗性检查 ════');
  /* f9 观察入口是否真的可点 */
  {
    const api = await bootAt('f9', { diff: 'standard', clock: '02:20' });
    const ob = api.choices().find(c => c.isObserve);
    say('  f9 选项：' + api.choices().map(c => `「${c.text}」${c.isObserve ? '[观察]' : ''}${c.locked ? '(锁)' : ''}`).join(' '));
    check('f9 有可点的观察入口', !!ob && !ob.locked);
    if (ob) {
      click(ob.el); await api.drain(500);
      const hs = api.$$('#observe-layer .hotspot');
      say('  进入后热点数=' + hs.length + ' 提示「' + api.$('#observe-hint').textContent + '」');
      check('f9 观察层真的打开且有热点', api.observeOpen() && hs.length > 0);
    }
  }
  /* rotAfter 跨 03:00 */
  {
    const before = await bootAt('d7', { diff: 'standard', clock: '00:00' });
    const after = await bootAt('d7', { diff: 'standard', clock: '00:05' });
    const plain = await bootAt('d6', { diff: 'standard', clock: '02:59' });
    const late = await bootAt('d6', { diff: 'standard', clock: '03:05' });
    say(`  d7（rotAfter 00:10；?clock 会先被节点耗时 +6 分钟）00:00→实际 ${fmt(before.state.stats.clock)} → ${before.visibleScene()}；00:05→实际 ${fmt(after.state.stats.clock)} → ${after.visibleScene()}`);
    say(`  d6（无 rotAfter）02:59 → ${plain.visibleScene()}；03:05 → ${late.visibleScene()}`);
    check('rotAfter 到点后切图', before.visibleScene() !== after.visibleScene(), `${before.visibleScene()} vs ${after.visibleScene()}`);
    check('未写 rotAfter 的节点行为不变', plain.visibleScene() === late.visibleScene(), `${plain.visibleScene()} vs ${late.visibleScene()}`);
    /* 跨午夜：阈值在 23:xx 的节点，过了 00:00 会不会"腐烂复原" */
    const probe = async (node, clock) => {
      const api = await bootAt(node, { diff: 'standard', clock });
      return `${node}@${fmt(api.state.stats.clock)}→${api.visibleScene()}`;
    };
    const rows = [
      await probe('c2a', '23:15'), await probe('c2a', '00:20'),
      await probe('c3', '23:30'), await probe('c3', '00:22'),
      await probe('d2', '23:40'), await probe('d2', '00:40')
    ];
    say('  跨午夜对照：' + rows.join('  '));
    check('rotAfter 阈值在午夜前时，过了午夜不应"腐烂复原"',
      rows[1].indexOf('_rot') > 0 && rows[3].indexOf('_rot') > 0 && rows[5].indexOf('_rot') > 0,
      '实测 ' + rows[1] + ' / ' + rows[3] + ' / ' + rows[5]);
  }
  /* 电量不足且没有鬼眼：观察入口不该是可点的按钮（m4 修复点） */
  {
    const api = await bootAt('p16', { diff: 'standard', battery: 0, eyes: 0, clock: '23:40' });
    const entry = api.choices().find(c => c.isObserve);
    const note = api.$('#choices .observe-note');
    say('  p16（电量0 / 无鬼眼 / 3 处热点）选项：' + api.choices().map(c => `「${c.text.slice(0, 16)}」`).join(' '));
    say('  太黑说明行：' + (note ? '「' + note.textContent + '」（aria-live=' + note.getAttribute('aria-live') + '）' : '(无)'));
    check('全部热点太黑时不渲染可点的观察入口', !entry, entry ? '仍有可点入口' : '没有入口');
    check('太黑时给一行不可交互的说明', !!note && /太黑/.test(note.textContent || ''), note ? note.textContent : '(无)');
  }

  /* R1 回归（独立验证，只读 HUD 文本，不看引擎内部状态）：
     04:20 进 g1 → 终幕 HUD 与结局页都必须是 05:31，g7 不许退回到达时刻 */
  {
    const probe = await boot({ quiet: true });
    const gate = JSON.parse(probe.run('JSON.stringify(STORY.nodes.g7.choices[0].when)'));
    const api = await bootAt('g1', {
      diff: 'standard', clock: '04:20', eyes: 5, corr: 40,
      survivors: gate.minSurvivors || 5, clues: (gate.allClues || []).join(',')
    });
    const hudAt = () => (api.$('#v-clock') || {}).textContent;
    const hudG1 = hudAt();
    say(`  进 g1 前 seed=04:20 → g1 的 HUD=「${hudG1}」`);
    await pushOn(api, 'g7');
    await api.toDecision(600);          // g7 的台词要先播完才会出选项
    const hudG7 = hudAt();
    say(`  走到 g7 的 HUD=「${hudG7}」（不许退回 04:11 / 04:20）`);
    const opt = api.choices().find(c => c.text.indexOf('转过身') >= 0);
    check('g7 的真结局选项仍然可点（线索门槛没被时钟改动影响）', !!opt && !opt.locked,
      opt ? (opt.locked ? '被锁' : '可点') : '不存在');
    if (opt) {
      click(opt.el);
      await api.drain(1500);
      for (let i = 0; i < 300 && !api.endingVisible(); i++) { api.advance(); await api.drain(400); }
      const stat = api.endingVisible() ? api.endingStat() : '';
      say(`  最终结局「${api.endingVisible() ? api.endingTitle() : '?'}」· 结局页：${stat}`);
      check('R1 g1 的 HUD 是 05:31', hudG1 === '05:31', '实际 ' + hudG1);
      check('R1 g7 不退回到达时刻', hudG7 === '05:31', '实际 ' + hudG7);
      check('R1 结局页时刻是 05:31', /时刻：05:31/.test(stat || ''), stat || '(未到结局)');
    }
  }

  /* 设定下拉框是否覆盖三档 id（m2 修复点） */
  {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const opts = [...html.matchAll(/<option value="([^"]+)"/g)].map(m => m[1]);
    say('  #set-difficulty 的 option 值：' + JSON.stringify(opts));
    check('难度下拉框覆盖 story/standard/nightmare 三个引擎 id',
      ['story', 'standard', 'nightmare'].every(id => opts.includes(id)),
      '实际 ' + JSON.stringify(opts));
  }

  /* ---------- 汇总 ---------- */
  const bad = records.filter(r => !r.ok);
  say(`\n══════ 汇总：${records.length - bad.length} / ${records.length} 条断言通过 ══════`);
  if (bad.length) {
    say('失败项：');
    bad.forEach(b => say('  ✗ ' + b.name));
  }
  fs.mkdirSync(path.join(ROOT, 'docs/qa'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs/qa/proofs-output.txt'), out.join('\n'), 'utf8');
  process.exitCode = bad.length ? 1 : 0;
})().catch(e => { console.error('QA 驱动异常:', e); process.exit(2); });
