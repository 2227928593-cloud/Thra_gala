/* =========================================================
   理智系统（sanity）专项验收 · T8
   ---------------------------------------------------------
   真实引擎 + 真实 DOM 事件 + 虚拟时钟。10 组用例：
     1 初始与存档 / 2 门槛边界 / 3 f2 降级 / 4 f10 / 5 断片
     6 全锁兜底 / 7 数字键编号 / 8 周目内容清零 / 9 e_written 两侧 / 10 120 局压力
   运行：node tests/qa_sanity.js
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { boot } = require('./harness');
const { click, snap } = require('./qa_driver');
const { keydown } = require('./dom');

const ROOT = path.resolve(__dirname, '..');
const fmt = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const out = [];
const records = [];
let fails = 0;
const say = s => { out.push(s); console.log(s); };
function check(name, ok, detail) {
  records.push({ name, ok });
  if (!ok) fails++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
}

/* 统一用"快进设定"减少定时器开销（不影响任何逻辑判定） */
const FAST = { 'thragal.settings.v1': JSON.stringify({ volume: 0, ambience: 0, speed: 70, fx: false, reduced: false, hotspots: false, difficulty: 'standard' }) };

async function bootAt(node, params = {}) {
  const q = Object.entries({ node, diff: 'standard', ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const api = await boot({ quiet: true, search: '?' + q, storage: FAST });
  await api.drain(600);
  await api.toDecision(600);
  return api;
}
async function settle(api, tries = 60) {
  for (let i = 0; i < tries; i++) {
    await api.drain(400);
    if (!api.run('__game.busy') && !api.run('__game.typing') && api.$('#confirm').hidden) return true;
  }
  return false;
}
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
/* 一路点第一个可点选项，直到结局/目标节点 */
async function pushOn(api, stopNode, max = 500) {
  for (let i = 0; i < max; i++) {
    if (api.endingVisible()) return 'ending';
    if (stopNode && api.nodeId === stopNode) return 'node';
    if (api.observeOpen()) { const e = api.$('#observe-exit'); if (e) click(e); await api.drain(200); continue; }
    const cs = api.choices();
    if (cs.length) {
      const c = cs.find(x => !x.locked && !x.isObserve);
      if (c) { click(c.el); await api.drain(400); continue; }
      const ob = cs.find(x => x.isObserve);
      if (ob) { click(ob.el); await api.drain(300); continue; }
      return 'stuck';
    }
    api.advance();
    await api.drain(300);
  }
  return 'limit';
}
const opt = (api, needle) => api.choices().find(c => c.text.indexOf(needle) >= 0);

/* ---------------- 目标流选项表（与 qa_proofs 同源） ---------------- */
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
/* e_written 专用：f7 拨通方镜 → f8 再打一次拿 paper → f10 纸上；噩梦档要在 p16 先拿 knock_rule 才能屏息 */
const WRITTEN_PLAN = Object.assign({}, P3_PLAN, {
  act5: '先坐下', d4: '屏住呼吸', f7: '拨通方镜', f8: '再打一次', f10: '纸上是这么写的'
});

/* 从 act1 起跑一整局；返回结局/资源/断片次数 */
async function runPlan(opts) {
  const { diff = 'standard', sanity = 100, plan = {}, observeNodes = [], observeMax = {}, observeAll = false } = opts;
  const api = await boot({
    quiet: true, storage: FAST,
    search: `?node=act1&diff=${encodeURIComponent(diff)}&sanity=${sanity}`
  });
  await api.drain(600);
  await api.toDecision(600);
  const capped = new Set();
  for (let i = 0; i < 2500; i++) {
    if (api.endingVisible()) break;
    if (api.observeOpen()) {
      const node = api.nodeId;
      const cap = observeAll ? Infinity : (observeMax[node] == null ? 0 : observeMax[node]);
      let clicked = 0;
      while (clicked < cap) {
        const spots = api.$$('#observe-layer .hotspot:not(.found):not(.too-dark)');
        if (!spots.length) break;
        click(spots[0]); clicked++;
        await api.drain(300);
        if (!api.$('#observe-card').hidden) { const c = api.$('#observe-card-close'); if (c) click(c); await api.drain(250); }
      }
      if (clicked >= cap) capped.add(node);
      if (api.observeOpen()) { const e = api.$('#observe-exit'); if (e) click(e); await api.drain(250); }
      continue;
    }
    const cs = api.choices();
    if (cs.length) {
      /* 先处理"观察四周"入口：只有点了入口才会进入观察层 */
      const obsBtn = cs.find(c => c.isObserve && !c.locked);
      const wantObs = observeAll || observeNodes.indexOf(api.nodeId) >= 0;
      if (obsBtn && wantObs && !capped.has(api.nodeId)) { click(obsBtn.el); await api.drain(350); continue; }
      const want = plan[api.nodeId];
      let idx = -1;
      if (want) idx = cs.findIndex(c => !c.locked && !c.isObserve && c.text.indexOf(want) >= 0);
      if (idx < 0) idx = cs.findIndex(c => !c.locked && !c.isObserve);
      if (idx < 0) idx = cs.findIndex(c => !c.locked);
      if (idx < 0) return { api, ending: null, node: api.nodeId, finalSanity: api.state.stats.sanity, breaks: 0, clues: api.state.clues.length, knock: api.state.stats.knock };
      click(cs[idx].el); await settle(api); await api.drain(250);
      continue;
    }
    api.advance(); await api.drain(300);
  }
  const flags = api.state.flags || {};
  return {
    api,
    ending: api.endingVisible() ? api.endingTitle() : null,
    node: api.nodeId,
    finalSanity: api.state.stats.sanity,
    breaks: Object.keys(flags).filter(k => k.indexOf('__broke_') === 0).length,
    clues: api.state.clues.length,
    knock: api.state.stats.knock
  };
}

(async () => {
  say('════════ 理智系统（sanity）专项验收 ════════');

  /* ================= S1 初始与存档 ================= */
  say('\n【S1】初始值与旧存档迁移');
  {
    const api = await boot({ quiet: true, storage: FAST });
    const fresh = api.run('__game.state ? __game.state.stats.sanity : null');
    // 标题页还没有 state，先开一局
    click(api.$('#boot .menu-item[data-act="new"]'));
    await api.drain(800);
    const s0 = api.state.stats.sanity;
    say(`  新档：标题页 state=${fresh} → 开局 sanity=${s0}`);
    check('新档 sanity = 100', s0 === 100, String(s0));

    const v1 = {
      node: 'd2', line: 0, flags: {},
      stats: { clock: 1400, knock: 5, eyes: 0, corruption: 10, battery: 70, survivors: 38 },  // 没有 sanity
      clues: ['drip'], items: {}, codex: []
    };
    const api2 = await boot({ quiet: true, storage: Object.assign({ 'thragal.save.v1': JSON.stringify(v1) }, FAST) });
    await api2.drain(300);
    click(api2.$('#btn-continue'));
    await api2.drain(1500);
    const s = snap(api2);
    say(`  旧档（无 sanity 字段）读入：node=${api2.nodeId} sanity=${api2.state.stats.sanity} 敲门=${s.knock} 电量=${s.battery}`);
    check('旧档读入后 sanity = 100（不是 0）', api2.state.stats.sanity === 100, String(api2.state.stats.sanity));
    check('旧档进度不丢（节点/敲门/电量）', api2.nodeId === 'd2' && s.knock === 5 && s.battery === 70, JSON.stringify(s));
  }

  /* ================= S2 门槛边界 ================= */
  say('\n【S2】minSanity / maxSanity 边界（f2 的两个对立门槛：35 / 34）');
  {
    const at = async (sanity) => {
      const api = await bootAt('f2', { sanity, items: 'phone' });
      const hang = opt(api, '立刻挂断');
      const toss = opt(api, '扔进黑里');
      return { api, hang, toss };
    };
    const a35 = await at(35);
    const a34 = await at(34);
    const show = c => (c ? (c.locked ? '灰锁' : '可点') : '未渲染');
    say(`  sanity 35：「立刻挂断」=${show(a35.hang)} · 「扔进黑里」=${show(a35.toss)}`);
    say(`  sanity 34：「立刻挂断」=${show(a34.hang)} · 「扔进黑里」=${show(a34.toss)}`);
    check('minSanity:35 在 35 可见/可点', !!a35.hang && !a35.hang.locked);
    check('minSanity:35 在 34 不可选（灰锁）', !!a34.hang && a34.hang.locked);
    check('maxSanity:34 在 34 可见/可点', !!a34.toss && !a34.toss.locked);
    check('maxSanity:34 在 35 不可选（灰锁）', !!a35.toss && a35.toss.locked);
    /* 额外记录：门槛不满足时是"灰锁"而不是"从 DOM 移除" */
    say(`  （记录：理智门槛不满足时渲染为灰锁按钮，不从 DOM 移除；sanityHint 生效）`);
  }

  /* ================= S3 f2 降级分支 ================= */
  say('\n【S3】f2 降级：理智低时换成「把手机扔进黑里」，且必须仍给 no_answer');
  {
    const api = await bootAt('f2', { sanity: 34, items: 'phone', clock: '03:00', battery: 100 });
    const before = snap(api);
    const toss = opt(api, '扔进黑里');
    click(toss.el);
    await api.drain(800);
    const after = snap(api);
    const clues = api.state.clues.slice();
    say(`  选「把手机扔进黑里」→ 节点 ${after.node} · 线索 ${clues.join(',')} · 电量 ${before.battery}→${after.battery} · 时刻 ${fmt(before.clock)}→${fmt(after.clock)}`);
    check('低理智分支仍授予 no_answer（真结局门槛不断）', clues.indexOf('no_answer') >= 0, clues.join(','));
    check('额外扣 10 点电', after.battery === before.battery - 10, `${before.battery}→${after.battery}`);
    const nodeCost = api.run(`(()=>{const n=STORY.nodes['f3'];const d=__game.difficulty();
      const pace=n&&n.pace==='run'?'run':n&&n.pace==='still'?'still':'walk';
      return (n&&Number.isFinite(+n.costClock))?+n.costClock:d.nodeClock[pace];})()`);
    check('额外 +6 分钟（选项本身）', after.clock - before.clock === 6 + nodeCost,
      `${fmt(before.clock)}→${fmt(after.clock)}，其中进入 f3 的节点耗时 ${nodeCost} 分`);
    say(`  （clock 差 = 选项 +6 + 进入 f3 的节点耗时 ${nodeCost} 分）`);
  }

  /* ================= S4 f10 ================= */
  say('\n【S4】f10：理智 29 与 30 的差别（咬眼 minSanity:30）');
  {
    const at = async (sanity) => {
      const api = await bootAt('f10', { sanity, eyes: 5, clues: 'eye_rule,ghost_domain', corr: 40, survivors: 7 });
      return {
        api,
        bite: opt(api, '咬下手臂'),
        shield: opt(api, '鬼域罩住'),
        run: opt(api, '我跑得比他快'),
        close: opt(api, '闭上眼睛')
      };
    };
    const a29 = await at(29);
    const a30 = await at(30);
    const st = c => (c ? (c.locked ? '灰锁' : '可点') : '未渲染');
    say(`  sanity 29：咬眼=${st(a29.bite)} · 鬼域=${st(a29.shield)} · 跑=${st(a29.run)} · 闭眼=${st(a29.close)}`);
    say(`  sanity 30：咬眼=${st(a30.bite)}`);
    check('理智 29：咬眼不可选', !!a29.bite && a29.bite.locked);
    check('理智 29：鬼域 / 跑 / 闭眼 仍可选',
      !!a29.shield && !a29.shield.locked && !!a29.run && !a29.run.locked && !!a29.close && !a29.close.locked);
    check('理智 30：咬眼恢复可选', !!a30.bite && !a30.bite.locked);
    /* 29 时咬眼被锁，但"鬼域"这条真结局路径仍在 → 真结局不会因理智 29 断掉 */
  }

  /* ================= S5 断片 ================= */
  say('\n【S5】理智归零 → sanityBreak → 回 __sanity_back');
  {
    /* 真实路径：c2up 的「去碰一碰其中一个人」−10 理智，seed 10 → 进入下一节点时归零 */
    const api = await bootAt('c2up', { sanity: 10 });
    const before = snap(api);
    say(`  起点：${api.nodeId} · 同伴 ${before.survivors} · 敲门 ${before.knock} · 时刻 ${fmt(before.clock)} · actStart=${api.state.actStart} · ck=${api.state.ck && api.state.ck.node}`);
    const tChoice = api.state.stats.clock;          // 段 0：点下这个选择之前
    click(opt(api, '去碰一碰').el);
    await api.drain(800);
    const atBreak = {
      node: api.nodeId, sanity: api.state.stats.sanity, clock: api.state.stats.clock,
      back: api.state.flags.__sanity_back,
      survivors: api.state.stats.survivors, knock: api.state.stats.knock,
      ending: api.endingVisible()
    };
    say(`  归零瞬间：node=${atBreak.node} · sanity=${atBreak.sanity} · clock=${fmt(atBreak.clock)} · __sanity_back=${atBreak.back} · 同伴 ${atBreak.survivors} · 敲门 ${atBreak.knock}`);
    check('理智 0 进入 sanityBreak', atBreak.node === 'sanityBreak', atBreak.node);
    check('断片瞬间 sanity 抬到 40', atBreak.sanity === 40, String(atBreak.sanity));
    check('断片不判死（没进结局）', atBreak.ending === false);

    await advanceUntil(api, atBreak.back);
    await settle(api);
    const after = snap(api);
    say(`  断片结束：node=${api.nodeId} · 同伴 ${after.survivors} · 敲门 ${after.knock} · clock ${fmt(after.clock)}`);
    check('断片后回到 __sanity_back', api.nodeId === atBreak.back, `实际 ${api.nodeId}，期望 ${atBreak.back}`);
    check('断片本身不扣同伴（对比"断片瞬间"）', after.survivors === atBreak.survivors, `${atBreak.survivors}→${after.survivors}`);
    check('断片本身不加敲门（对比"断片瞬间"）', after.knock === atBreak.knock, `${atBreak.knock}→${after.knock}`);
    /* 三段打点：① 正常推进（对照局）② 断片触发 ③ 回跳 */
    const control = await bootAt('c2up', { sanity: 100 });
    const ct0 = control.state.stats.clock;
    click(opt(control, '去碰一碰').el);
    await control.drain(800);
    const ct1 = control.state.stats.clock;
    const normalNodeCost = ct1 - ct0;                       // ① 不触发断片时，这一跳的正常耗时
    const segBreak = atBreak.clock - tChoice;               // ② 触发断片那一段
    const segReturn = after.clock - atBreak.clock;          // ③ 回跳那一段
    say(`  三段打点：① 正常推进（对照局）${fmt(ct0)}→${fmt(ct1)} = +${normalNodeCost} 分`);
    say(`              ② 断片触发 ${fmt(tChoice)}→${fmt(atBreak.clock)} = +${segBreak} 分`);
    say(`              ③ 回跳 ${fmt(atBreak.clock)}→${fmt(after.clock)} = +${segReturn} 分`);
    check('断片本身正好 +30 分（不含被退掉的节点耗时）', segBreak === 30, `实测 +${segBreak}`);
    check('回跳不再扣时间', segReturn === 0, `实测 +${segReturn}`);
    check('断片总账 = 30 分，而不是 30 + 节点耗时',
      atBreak.clock - tChoice === 30 && normalNodeCost > 0,
      `断片段 +${segBreak}，对照局的正常节点耗时 +${normalNodeCost}`);

    /* 同幕第二次归零：不再断片，停在 0 */
    api.run('__game.state.stats.sanity = 0');
    await api.toDecision(400);
    const step = async () => {
      await settle(api);
      const cs = api.choices();
      if (cs.length) {
        const c = cs.find(x => !x.locked && !x.isObserve) || cs.find(x => !x.locked);
        if (c) { click(c.el); await settle(api); await api.drain(400); }
      } else { api.advance(); await api.drain(400); }
      return api.nodeId;
    };
    const n2 = await step();
    say(`  同幕第二次归零：node=${n2} · sanity=${api.state.stats.sanity}`);
    check('同幕第二次归零不再断片', n2 !== 'sanityBreak', n2);
    check('第二次归零后停在 0（不再抬起）', api.state.stats.sanity === 0, String(api.state.stats.sanity));

    /* 下一幕可再断一次：换 actStart 后再归零 */
    api.run("__game.state.actStart = 'act5'");
    api.run('__game.state.stats.sanity = 0');
    await api.toDecision(400);
    const n3 = await step();
    say(`  换幕后再次归零：node=${n3} · sanity=${api.state.stats.sanity}`);
    check('下一幕可以再断一次', n3 === 'sanityBreak', n3);
  }

  /* ================= S6 全锁兜底 ================= */
  say('\n【S6】全锁兜底（临时节点，测完删除）');
  {
    const api = await boot({ quiet: true, storage: FAST });
    click(api.$('#boot .menu-item[data-act="new"]'));
    await api.drain(800);
    api.run(`STORY.nodes.__qa_lock_next = { id:'__qa_lock_next', scene:'classroom', lines:[{who:'',text:'到了。'}] }; 1`);
    api.run(`STORY.nodes.__qa_lock1 = { id:'__qa_lock1', scene:'classroom',
      lines:[{who:'',text:'两条路都堵死了。'}], next:'__qa_lock_next',
      choices:[{text:'甲', next:'__qa_lock_next', when:{flag:'__never1'}},
               {text:'乙', next:'__qa_lock_next', when:{flag:'__never2'}}] }; 1`);
    api.run(`STORY.nodes.__qa_lock2 = { id:'__qa_lock2', scene:'classroom',
      lines:[{who:'',text:'无路可走。'}],
      choices:[{text:'甲', next:'__qa_lock_next', when:{flag:'__never1'}}] }; 1`);
    api.run(`__game.runNode('__qa_lock1', {silent:true, force:true}); 1`);
    await api.drain(1200);
    for (let i = 0; i < 20 && !api.choices().length && !api.endingVisible(); i++) { api.advance(); await api.drain(400); }
    const cs = api.choices();
    const cont = cs.find(c => c.text.indexOf('继续') >= 0);
    say(`  全锁 + next：渲染出 ${cs.length} 个按钮 → ${cs.map(c => `「${c.text}」${c.locked ? '(锁)' : ''}`).join(' ')}`);
    check('全锁 + next 出现「继续」', !!cont && !cont.locked, JSON.stringify(cs.map(c => c.text)));
    if (cont) {
      click(cont.el);
      await api.drain(800);
      check('「继续」能走到 next', api.nodeId === '__qa_lock_next', api.nodeId);
    }
    api.run(`__game.runNode('__qa_lock2', {silent:true, force:true}); 1`);
    await api.drain(1200);
    for (let i = 0; i < 20 && !api.choices().length && !api.endingVisible() && !api.$('#choices .observe-note'); i++) { api.advance(); await api.drain(400); }
    const note = api.$('#choices .observe-note');
    const cs2 = api.choices();
    const open2 = cs2.filter(c => !c.locked);
    say(`  全锁 + 无 next：选项 ${cs2.length} 个（可点 ${open2.length}）；说明行「${note ? note.textContent : '(无)'}」`);
    check('全锁 + 无 next 给出说明行，且没有任何可点选项（灰按钮可以留着，但不能是唯一出路）',
      !!note && open2.length === 0, `可点 ${open2.length} · ${note ? note.textContent : '无说明行'}`);
    api.run(`delete STORY.nodes.__qa_lock1; delete STORY.nodes.__qa_lock2; delete STORY.nodes.__qa_lock_next; 1`);
    say('  临时节点已删除：' + api.run(`JSON.stringify(['__qa_lock1','__qa_lock2','__qa_lock_next'].filter(k=>STORY.nodes[k]))`));
  }

  /* ================= S7 数字键编号 ================= */
  say('\n【S7】数字键按"显示编号"触发（甲 / 乙(锁) / 丙）');
  {
    const api = await boot({ quiet: true, storage: FAST });
    click(api.$('#boot .menu-item[data-act="new"]'));
    await api.drain(800);
    api.run(`STORY.nodes.__qa_num_a = { id:'__qa_num_a', scene:'classroom', lines:[{who:'',text:'甲'}], next:'act1' }; 1`);
    api.run(`STORY.nodes.__qa_num_c = { id:'__qa_num_c', scene:'classroom', lines:[{who:'',text:'丙'}], next:'act1' }; 1`);
    api.run(`STORY.nodes.__qa_num = { id:'__qa_num', scene:'classroom',
      lines:[{who:'',text:'选一个。'}],
      choices:[{text:'甲', next:'__qa_num_a'},
               {text:'乙', next:'__qa_num_a', when:{flag:'__never'}},
               {text:'丙', next:'__qa_num_c'}] }; 1`);
    api.run(`__game.runNode('__qa_num', {silent:true, force:true}); 1`);
    await api.drain(1200);
    for (let i = 0; i < 20 && !api.choices().length && !api.endingVisible(); i++) { api.advance(); await api.drain(400); }
    const nums = api.choices().map(c => `${c.text}:${c.num}${c.locked ? '(锁)' : ''}`);
    say('  编号渲染：' + nums.join(' · '));
    keydown(api.doc, '1');
    await api.drain(800);
    say(`  按 1 → node=${api.nodeId}`);
    check('按 1 触发甲', api.nodeId === '__qa_num_a', api.nodeId);

    api.run(`__game.runNode('__qa_num', {silent:true, force:true}); 1`);
    await api.drain(1200);
    for (let i = 0; i < 20 && !api.choices().length && !api.endingVisible(); i++) { api.advance(); await api.drain(400); }
    keydown(api.doc, '2');
    await api.drain(800);
    say(`  按 2 → node=${api.nodeId}（期望丙，且不能错位到被锁的乙）`);
    check('按 2 触发丙（不是乙、也不是跳过丙）', api.nodeId === '__qa_num_c', api.nodeId);
    api.run(`delete STORY.nodes.__qa_num; delete STORY.nodes.__qa_num_a; delete STORY.nodes.__qa_num_c; 1`);
  }

  /* ================= S8 周目内容清零 ================= */
  say('\n【S8】周目内容清零 + m_second_time 改由 sanityBreak 授予');
  {
    const files = ['js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js', 'js/engine.js'];
    const hits = { ng: [], escape: [] };
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      src.split('\n').forEach((ln, i) => {
        if (/flag:\s*'ng'/.test(ln) || /flag:\s*"ng"/.test(ln)) hits.ng.push(`${f}:${i + 1}`);
        if (ln.indexOf('你要先逃出过一次') >= 0) hits.escape.push(`${f}:${i + 1}`);
      });
    }
    say(`  grep flag:'ng' → ${hits.ng.length} 处 ${hits.ng.join(', ')}`);
    say(`  grep 「你要先逃出过一次」 → ${hits.escape.length} 处 ${hits.escape.join(', ')}`);
    check("数据里没有 flag:'ng' 的周目锁选项", hits.ng.length === 0, hits.ng.join(','));
    check('数据里没有「你要先逃出过一次」文案', hits.escape.length === 0, hits.escape.join(','));

    const api = await boot({ quiet: true, storage: FAST });
    const codex = JSON.parse(api.run(`JSON.stringify({
      total: CODEX.clue.length + CODEX.ghost.length + CODEX.person.length + CODEX.memory.length,
      hasSecond: [...CODEX.clue, ...CODEX.ghost, ...CODEX.person, ...CODEX.memory].some(x => x.id === 'm_second_time')
    })`));
    const giver = api.run(`JSON.stringify((()=>{const out=[];for(const id of Object.keys(STORY.nodes)){const n=STORY.nodes[id];const e=n.enter||{};if((e.codex||[]).includes('m_second_time'))out.push(id);}return out;})())`);
    say(`  档案总数=${codex.total} · m_second_time 存在=${codex.hasSecond} · 授予点=${giver}`);
    check('m_second_time 仍存在于档案中', codex.hasSecond === true);
    check('档案总数仍是 42', codex.total === 42, String(codex.total));
    check('m_second_time 由 sanityBreak 授予', /sanityBreak/.test(giver), giver);
  }

  /* ================= S9 f8 门槛 + e_written 可达性 ================= */
  say('\n【S9】f8:1「再打一次」的理智门槛（仅噩梦档）与 e_written 可达性');
  {
    /* --- S9a：门槛本身（在 f8 处直接设 29 / 30，绕开"跑到这里时理智已被恢复点抬起来"的干扰） --- */
    const atF8 = async (diff, sanity) => {
      const api = await bootAt('f8', { diff, sanity });
      const redo = opt(api, '再打一次');
      return { api, redo, hint: redo ? redo.hint : null };
    };
    const n29 = await atF8('nightmare', 29);
    const n30 = await atF8('nightmare', 30);
    const s29 = await atF8('standard', 29);
    const st = c => (c ? (c.locked ? '灰锁' : '可点') : '未渲染');
    say(`  噩梦 / 理智 29：「再打一次」=${st(n29.redo)} · 提示「${n29.hint}」`);
    say(`  噩梦 / 理智 30：「再打一次」=${st(n30.redo)} · 提示「${n30.hint}」`);
    say(`  标准 / 理智 29：「再打一次」=${st(s29.redo)} · 提示「${s29.hint}」`);
    check('噩梦 理智 29：f8:1 不可点', !!n29.redo && n29.redo.locked, st(n29.redo));
    check('噩梦 理智 29：提示是「你连这一步都想不清了」',
      n29.hint === '你连这一步都想不清了', `实际「${n29.hint}」`);
    check('噩梦 理智 30：f8:1 可点', !!n30.redo && !n30.redo.locked, st(n30.redo));
    check('标准 理智 29：f8:1 可点（标准档不受理智影响）', !!s29.redo && !s29.redo.locked, st(s29.redo));
    /* f8:1 的 when 是**函数**条件：修复后引擎能把它归因到理智，给出理智专属文案，
       而不是噩梦的档位兜底「你做不到」。这里钉住归因结果，防止回退。 */
    check('函数条件失败时能正确归因到理智（不是档位兜底「你做不到」）',
      n29.hint !== '你做不到' && n29.hint === '你连这一步都想不清了', `实际「${n29.hint}」`);

    /* --- S9b：可达性（理智 20 起跑，整局实跑；不作为门槛断言） --- */
    const rows = [];
    for (const [diff, sanity] of [['standard', 100], ['standard', 20], ['nightmare', 100], ['nightmare', 20]]) {
      const r = await runPlan({ diff, sanity, plan: WRITTEN_PLAN });
      rows.push({ diff, sanity, ending: r.ending, node: r.node, finalSanity: r.finalSanity, breaks: r.breaks });
      say(`  ${diff} / 起始理智 ${sanity} → 结局「${r.ending || '未到'}」· 末节点 ${r.node} · 终态理智 ${r.finalSanity} · 断片 ${r.breaks} 次 · 敲门 ${r.knock}`);
    }
    const at = (d, sn) => rows.find(r => r.diff === d && r.sanity === sn);
    check('标准档 理智 100 → e_written', at('standard', 100).ending === '被写下的人', at('standard', 100).ending || '未到');
    check('标准档 理智 20 → e_written', at('standard', 20).ending === '被写下的人', at('standard', 20).ending || '未到');
    check('噩梦档 理智 100 → e_written', at('nightmare', 100).ending === '被写下的人', at('nightmare', 100).ending || '未到');
    /* 低理智起跑到 f8 时已被恢复点抬高，所以这条是"可达性"而不是"门槛"：
       门槛的严格证明在 S9a。这里只记录整局实际结果。 */
    say(`  （记录：噩梦档理智 20 起跑整局 → ${at('nightmare', 20).ending}；到 f8 时理智已被恢复点抬到 30 以上，`
      + `所以这里能选是"恢复点起作用"，不是门槛失效——门槛见上面前三行）`);
    check('噩梦档理智 20 起跑整局仍能走到结局（可达性，不当作门槛断言）',
      !!at('nightmare', 20).ending, at('nightmare', 20).ending || '未到');
  }

  /* ================= S10 压力 ================= */
  say('\n【S10】压力：A) 120 局均匀随机  B) 策略矩阵（7 结局覆盖）');
  {
    /* --- A: 均匀随机（只看"会不会卡死"） --- */
    const N = 120;
    const endingsA = {};
    let stallsA = 0, arrivedA = 0, zeroHeavyA = 0;
    const cluesA = [];
    const t0 = Date.now();
    let seed = 20261023;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < N; i++) {
      const api = await boot({ quiet: true, storage: FAST });
      click(api.$('#boot .menu-item[data-act="new"]'));
      await api.drain(600);
      let steps = 0, zeroStreak = 0, maxZero = 0;
      while (steps++ < 3000) {
        if (api.endingVisible()) break;
        if (api.observeOpen()) {
          const spots = api.$$('#observe-layer .hotspot:not(.found):not(.too-dark)');
          if (spots.length) click(spots[0]);
          else { const e = api.$('#observe-exit'); if (e) click(e); }
          await api.drain(200);
          if (!api.$('#observe-card').hidden) { const c = api.$('#observe-card-close'); if (c) click(c); await api.drain(200); }
          continue;
        }
        const cs = api.choices();
        if (cs.length) {
          const open = cs.filter(c => !c.locked);
          const pick = open[Math.floor(rnd() * open.length)] || cs[0];
          click(pick.el); await api.drain(300);
        } else { api.advance(); await api.drain(250); }
        const sn = api.state && api.state.stats.sanity;
        if (sn === 0) { zeroStreak++; maxZero = Math.max(maxZero, zeroStreak); } else zeroStreak = 0;
      }
      if (api.endingVisible()) {
        arrivedA++;
        const t = api.endingTitle();
        endingsA[t] = (endingsA[t] || 0) + 1;
        cluesA.push(api.state.clues.length);
      } else stallsA++;
      if (maxZero >= 10) zeroHeavyA++;
    }
    const durA = ((Date.now() - t0) / 1000).toFixed(1);
    cluesA.sort((a, b) => a - b);
    const med = cluesA.length ? cluesA[Math.floor(cluesA.length / 2)] : 0;
    const ge18 = cluesA.filter(c => c >= 18).length;
    say(`  A) ${N} 局 / ${durA}s：到达结局 ${arrivedA} · 卡住 ${stallsA} · 线索 min/中位/max = ${cluesA[0]}/${med}/${cluesA[cluesA.length - 1]} · 线索≥18 的局 ${ge18} · "理智连续 0 ≥10 步"的局 ${zeroHeavyA}`);
    say('     结局分布：' + Object.entries(endingsA).map(([k, v]) => `${k}×${v}`).join(' · '));
    check(`A) ${N} 局均匀随机无 stall（无死路/无卡死）`, stallsA === 0, `卡住 ${stallsA}`);

    /* --- B: 策略矩阵，验证 7 结局在理智系统下仍全部可达 + 会观察的局线索够 --- */
    const MATRIX = [
      ['e_true', {}, ['act2', 'f10'], { act2: 1, f10: 1 }],
      ['e_alone', { g7: '一个人走开' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
      ['e_eighth', { e6: '转身，跑', e8: '我救不了', f10: '把所有人聚在一起', g7: '回头去找' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
      ['e_absorb', { g7: '把手背上的眼睛' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
      ['e_written', { f7: '拨通方镜', f8: '再打一次', f10: '纸上是这么写的' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
      ['e_door', { f10: '闭上眼睛' }, ['act2', 'f10'], { act2: 1, f10: 1 }],
      ['e_stairs', { c2: '往回走', c2c: '站着不动' }, [], {}]
    ];
    const titleOf = { e_true: '五点三十一分', e_alone: '一个人走出校门', e_eighth: '第八个人', e_absorb: '成为鬼', e_written: '被写下的人', e_door: '门后的第十三次', e_stairs: '永远的五楼' };
    const covered = {};
    let matrixStall = 0;
    const clueSamples = [];
    for (const [id, over, obsNodes, obsMax] of MATRIX) {
      const r = await runPlan({ diff: 'standard', sanity: 100, plan: Object.assign({}, P3_PLAN, over), observeNodes: obsNodes, observeMax: obsMax });
      covered[id] = r.ending === titleOf[id];
      if (!r.ending) matrixStall++;
      clueSamples.push({ id, clues: r.clues, ending: r.ending });
      say(`  B) ${id.padEnd(9)} → ${r.ending || '未到'}（期望「${titleOf[id]}」）· 线索 ${r.clues} · 终态理智 ${r.finalSanity} · 断片 ${r.breaks}`);
    }
    const coveredCount = Object.values(covered).filter(Boolean).length;
    check('B) 7 个结局在理智系统下全部可达', coveredCount === 7, `${coveredCount}/7`);
    check('B) 策略矩阵无 stall', matrixStall === 0, `未到结局 ${matrixStall}`);

    /* 会观察的局（P2 全观察 / P3 目标）线索数 */
    const p2 = await runPlan({ diff: 'standard', sanity: 100, plan: {}, observeAll: true });
    const p3 = await runPlan({ diff: 'standard', sanity: 100, plan: P3_PLAN, observeNodes: ['act2', 'f10'], observeMax: { act2: 1, f10: 1 } });
    say(`  B) 全观察流：结局「${p2.ending}」· 线索 ${p2.clues} · 终态理智 ${p2.finalSanity} · 断片 ${p2.breaks}`);
    say(`  B) 目标流：结局「${p3.ending}」· 线索 ${p3.clues} · 终态理智 ${p3.finalSanity} · 断片 ${p3.breaks}`);
    const pWritten = await runPlan({ diff: 'standard', sanity: 100, plan: WRITTEN_PLAN });
    say(`  B) e_written 目标线：结局「${pWritten.ending}」· 线索 ${pWritten.clues} · 终态理智 ${pWritten.finalSanity}`);
    check('B) 会观察的局线索 ≥18（全观察 / e_written 目标线）',
      p2.clues >= 18 && pWritten.clues >= 18, `全观察 ${p2.clues} · e_written ${pWritten.clues}`);
    say(`  （记录：最简目标流 P3 只观察 2 处 → 线索 ${p3.clues}，不适用 18 条这条线；它要的是"刚好够开真结局"）`);
    check('B) 全观察流拿不到 e_true（贪看仍受惩罚）', p2.ending !== '五点三十一分', p2.ending || '未到');
  }

  /* ================= S11 低理智专项（真结局是否被掐断 / 断片会不会吃穿时间） ================= */
  say('\n【S11】低理智专项');
  {
    const low20 = await runPlan({ diff: 'standard', sanity: 20, plan: P3_PLAN, observeNodes: ['act2', 'f10'], observeMax: { act2: 1, f10: 1 } });
    say(`  标准档 / 起始理智 20 / 目标流 → 结局「${low20.ending || '未到'}」· 线索 ${low20.clues} · 终态理智 ${low20.finalSanity} · 断片 ${low20.breaks} 次 · 敲门 ${low20.knock}`);
    check('标准档低理智（20）仍能拿到真结局', low20.ending === '五点三十一分', low20.ending || '未到');

    const low5 = await runPlan({ diff: 'standard', sanity: 5, plan: P3_PLAN, observeNodes: ['act2', 'f10'], observeMax: { act2: 1, f10: 1 } });
    say(`  标准档 / 起始理智 5 / 目标流 → 结局「${low5.ending || '未到'}」· 断片 ${low5.breaks} 次 · 敲门 ${low5.knock}`);
    const low5w = await runPlan({ diff: 'standard', sanity: 5, plan: WRITTEN_PLAN });
    say(`  标准档 / 起始理智 5 / e_written 线 → 结局「${low5w.ending || '未到'}」· 断片 ${low5w.breaks} 次 · 敲门 ${low5w.knock}`);
    check('理智极低（5）时整局仍能走到结局（断片不会把时间吃穿到无结局）',
      !!low5.ending && !!low5w.ending, `${low5.ending || '未到'} / ${low5w.ending || '未到'}`);
    say(`  记录：断片每幕最多 1 次、每次 +30 分；本局实测 ${low5.breaks} 次（理论上限 = 幕数 6 次 = +180 分）`);

    /* 静态扫描：是否存在"某个理智区间里所有选项都被理智条件锁死"的节点 */
    const scan = await (async () => {
      const api = await boot({ quiet: true, storage: FAST });
      return JSON.parse(api.run(`JSON.stringify((()=>{
        const bad = [];
        for (const id of Object.keys(STORY.nodes)) {
          const n = STORY.nodes[id];
          const cs = (n.choices || []);
          if (!cs.length) continue;
          const gaps = [];
          for (let v = 0; v <= 100; v++) {
            const ok = cs.some(c => {
              const w = c.when;
              if (!w || typeof w !== 'object') return true;               // 无门槛 = 永远可选
              if (w.minSanity != null && v < w.minSanity) return false;
              if (w.maxSanity != null && v > w.maxSanity) return false;
              return true;                                                 // 先只看理智维度
            });
            if (!ok) gaps.push(v);
          }
          if (gaps.length) bad.push({ id, from: gaps[0], to: gaps[gaps.length - 1], count: gaps.length });
        }
        return bad;
      })())`));
    })();
    say(`  静态扫描（只按理智维度、忽略其它条件）：${scan.length ? scan.map(x => `${x.id}:${x.from}-${x.to}(${x.count})`).join(' · ') : '没有任何节点会在某个理智区间里"所有选项都被理智锁死"'}`);
    check('没有任何节点会在某个理智值下"所有选项被理智锁死"', scan.length === 0,
      scan.length ? JSON.stringify(scan) : '0 个节点');
  }

  /* ================= S12 三档理智差异（设计 §3.10） ================= */
  say('\n【S12】三档理智差异：故事档豁免门槛 / 不断片 / 系数缩放 / 噩梦不显示档位');
  {
    const at = async (node, params) => {
      const q = Object.entries({ node, diff: 'standard', ...params })
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      const api = await boot({ quiet: true, search: '?' + q, storage: FAST });
      await api.drain(600); await api.toDecision(600);
      return api;
    };
    const st = c => (c ? (c.locked ? '灰锁' : '可点') : '未渲染');

    /* --- 12.1 故事档不锁三处关键选项（理智 10 远低于 45/35/30 三个门槛） --- */
    const sF6 = await at('f6', { diff: 'story', sanity: 10 });
    const sF2 = await at('f2', { diff: 'story', sanity: 10, items: 'phone' });
    const sF10 = await at('f10', { diff: 'story', sanity: 10, eyes: 5, clues: 'eye_rule', corr: 40, survivors: 7 });
    const sF6o = opt(sF6, '点开线索'), sF2o = opt(sF2, '立刻挂断'), sF10o = opt(sF10, '咬下手臂');
    say(`  故事 / 理智 10：f6「点开线索」=${st(sF6o)} · f2「立刻挂断」=${st(sF2o)} · f10「咬下手臂」=${st(sF10o)}`);
    check('故事档理智 10：f6「点开线索」可点（不被理智锁）', !!sF6o && !sF6o.locked, st(sF6o));
    check('故事档理智 10：f2「立刻挂断」可点', !!sF2o && !sF2o.locked, st(sF2o));
    check('故事档理智 10：f10「咬下手臂」可点', !!sF10o && !sF10o.locked, st(sF10o));

    /* --- 12.2 反向对照：标准档同条件仍锁（防止"豁免"被写成全局） --- */
    const nF6 = await at('f6', { diff: 'standard', sanity: 10 });
    const nF2 = await at('f2', { diff: 'standard', sanity: 10, items: 'phone' });
    const nF10 = await at('f10', { diff: 'standard', sanity: 10, eyes: 5, clues: 'eye_rule', corr: 40, survivors: 7 });
    const nF6o = opt(nF6, '点开线索'), nF2o = opt(nF2, '立刻挂断'), nToss = opt(nF2, '扔进黑里'), nF10o = opt(nF10, '咬下手臂');
    say(`  标准 / 理智 10：f6「点开线索」=${st(nF6o)} · f2「挂断」=${st(nF2o)}「扔黑里」=${st(nToss)} · f10「咬下手臂」=${st(nF10o)}`);
    check('标准档理智 10：f6 仍锁（豁免没有变成全局）', !!nF6o && nF6o.locked, st(nF6o));
    check('标准档理智 10：f2 降级（挂断锁、扔黑里可点）',
      !!nF2o && nF2o.locked && !!nToss && !nToss.locked, `挂断=${st(nF2o)} 扔黑里=${st(nToss)}`);
    check('标准档理智 10：f10 咬眼仍锁', !!nF10o && nF10o.locked, st(nF10o));

    /* --- 12.3 故事档理智 0：不断片、抬到 1、clock 不加 30 --- */
    const s0 = await at('c2up', { diff: 'story', sanity: 5 });   // 故事档 −5 → 归零
    const sb = snap(s0);
    click(opt(s0, '去碰一碰').el); await s0.drain(900);
    const sa = snap(s0);
    say(`  故事 / 理智 5 碰一下（−10 缩到 −5）→ 归零：node=${sa.node} · sanity=${sa.sanity} · clock ${fmt(sb.clock)}→${fmt(sa.clock)}`);
    check('故事档理智归零不进 sanityBreak', sa.node !== 'sanityBreak', sa.node);
    check('故事档理智归零后抬到 1', sa.sanity === 1, String(sa.sanity));
    const storyCost = s0.run(`(()=>{const n=STORY.nodes['c2touch'];const d=__game.difficulty();
      const pace=n&&n.pace==='run'?'run':n&&n.pace==='still'?'still':'walk';
      return (n&&Number.isFinite(+n.costClock))?+n.costClock:d.nodeClock[pace];})()`);
    check('故事档理智归零不加 30 分钟（只付节点耗时）', sa.clock - sb.clock === storyCost,
      `${fmt(sb.clock)}→${fmt(sa.clock)}，节点耗时 ${storyCost}`);

    /* --- 12.4 断片恢复值：标准 40 / 噩梦 30，且回触发节点 --- */
    const bStd = await at('c2up', { diff: 'standard', sanity: 10 });
    click(opt(bStd, '去碰一碰').el); await bStd.drain(900);
    const bNig = await at('c2up', { diff: 'nightmare', sanity: 10 });
    click(opt(bNig, '去碰一碰').el); await bNig.drain(900);
    say(`  断片恢复：标准 → node=${bStd.nodeId} sanity=${bStd.state.stats.sanity} · 噩梦 → node=${bNig.nodeId} sanity=${bNig.state.stats.sanity}`);
    check('标准档断片后理智 = 40', bStd.state.stats.sanity === 40, String(bStd.state.stats.sanity));
    check('噩梦档断片后理智 = 30（不是 40）', bNig.state.stats.sanity === 30, String(bNig.state.stats.sanity));
    check('噩夢断片回到触发节点 c2up', bNig.state.flags.__sanity_back === 'c2up', String(bNig.state.flags.__sanity_back));

    /* --- 12.5 系数缩放：负向 −10 与正向 +5 各一组 --- */
    const neg = {};
    for (const diff of ['story', 'standard', 'nightmare']) {
      const a = await at('c2up', { diff, sanity: 100 });
      click(opt(a, '去碰一碰').el); await a.drain(900);
      neg[diff] = a.state.stats.sanity - 100;
      const b = await at('e8', { diff, sanity: 50 });
      click(opt(b, '把她扶起来').el); await b.drain(1200);
      neg[diff + '_pos'] = b.state.stats.sanity - 50;
    }
    say(`  系数实测：−10 → 故事 ${neg.story} / 标准 ${neg.standard} / 噩梦 ${neg.nightmare}；`
      + `+5 → 故事 +${neg.story_pos} / 标准 +${neg.standard_pos} / 噩梦 +${neg.nightmare_pos}`);
    check('负向 −10 的缩放：故事 −5 / 标准 −10 / 噩梦 −13',
      neg.story === -5 && neg.standard === -10 && neg.nightmare === -13,
      `${neg.story}/${neg.standard}/${neg.nightmare}`);
    check('正向 +5 的缩放：故事 +7 / 标准 +5 / 噩梦 +5',
      neg.story_pos === 7 && neg.standard_pos === 5 && neg.nightmare_pos === 5,
      `+${neg.story_pos}/+${neg.standard_pos}/+${neg.nightmare_pos}`);

    /* --- 12.5b 故事档低理智整局：豁免不能把任何结局弄成不可达 --- */
    const storyLow = await runPlan({ diff: 'story', sanity: 10, plan: P3_PLAN, observeNodes: ['act2', 'f10'], observeMax: { act2: 1, f10: 1 } });
    say(`  故事 / 起始理智 10 / 目标流整局 → 结局「${storyLow.ending || '未到'}」· 线索 ${storyLow.clues} · 终态理智 ${storyLow.finalSanity} · 断片 ${storyLow.breaks} 次`);
    check('故事档理智 10 起跑仍能拿真结局（豁免没有把结局弄成不可达）',
      storyLow.ending === '五点三十一分', storyLow.ending || '未到');

    /* --- 12.6 档案页档位行：标准显示、噩梦不显示 --- */
    const cStd = await at('d2', { diff: 'standard', sanity: 50 });
    cStd.run('__game.openCodex("clue")'); await cStd.drain(400);
    const lineStd = cStd.$('#codex-body .codex-sanity');
    const cNig = await at('d2', { diff: 'nightmare', sanity: 50 });
    cNig.run('__game.openCodex("clue")'); await cNig.drain(400);
    const lineNig = cNig.$('#codex-body .codex-sanity');
    say(`  档案页档位行：标准「${lineStd ? lineStd.textContent : '(无)'}」 · 噩梦「${lineNig ? lineNig.textContent : '(无)'}」`);
    check('标准档档案页显示理智档位行', !!lineStd && /理智 · /.test(lineStd.textContent), lineStd ? lineStd.textContent : '无');
    check('噩梦档档案页不显示档位行', !lineNig, lineNig ? lineNig.textContent : '无（符合）');
  }

  /* ---------- 汇总 ---------- */
  const bad = records.filter(r => !r.ok);
  say(`\n══════ 汇总：${records.length - bad.length} / ${records.length} 条断言通过 ══════`);
  if (bad.length) { say('失败项：'); bad.forEach(b => say('  ✗ ' + b.name)); }
  fs.mkdirSync(path.join(ROOT, 'docs/qa'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs/qa/sanity-output.txt'), out.join('\n'), 'utf8');
  process.exitCode = bad.length ? 1 : 0;
})().catch(e => { console.error('理智验收驱动异常:', e); process.exit(2); });
