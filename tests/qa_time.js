/* =========================================================
   时间预算审计（quality-lead / T6）
   ---------------------------------------------------------
   用真实引擎 + 虚拟时钟，跑三种玩家策略，回答三件事：
     1) 每一幕结束时的 clock 是多少；
     2) 有没有"还没到终幕就被强行拖去五点三十（f10）"，拖走时在哪个节点；
     3) 自然抵达 f10 的 clock 与距离 05:30 的余额。
   外加两条硬不变量（每次改数值都应该重跑）：
     T1 三条策略都必须"自然"抵达 f10（不能被 timeup 拽）；
     T2 f10 只允许播一次（终幕不能被 deadline 拽回去重播结局）。
   ========================================================= */
'use strict';
const { play, firstUnlocked } = require('./qa_driver');

const START = 22 * 60 + 10;      // 22:10
const DEADLINE = 5 * 60 + 30;    // 05:30
const DEADLINE_ABS = START + ((DEADLINE - START) + 1440) % 1440;   // = 1770（当天分钟数）
const ACTS = [['act1', '序幕'], ['act2', '第一幕'], ['act3', '第二幕'], ['act4', '第三幕'], ['act5', '第四幕'], ['act6', '终幕']];
const fmt = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

/* P3 目标流：只在必要处观察，其余取"省时间且不涨敲门"的选项 */
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
const pickP3 = (cs, api) => {
  const want = P3_PLAN[api.nodeId];
  if (want) for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve && cs[i].text.indexOf(want) >= 0) return i;
  for (let i = 0; i < cs.length; i++) if (!cs[i].locked && !cs[i].isObserve) return i;
  return null;
};
const STRATS = {
  P1: { pick: firstUnlocked, observe: 'never' },
  P2: { pick: firstUnlocked, observe: 'all' },
  P3: { pick: pickP3, observe: 'only', observeNodes: ['act2', 'f10'], observeMax: { act2: 1, f10: 1 } }
};

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
}

(async () => {
  const audit = [];
  for (const diff of ['story', 'standard', 'nightmare']) {
    for (const key of ['P1', 'P2', 'P3']) {
      const r = await play({ diff, ...STRATS[key] });
      const actClock = {};
      for (const [id] of ACTS) {
        const v = r.visits.find(x => x.node === id);
        actClock[id] = v ? v.clock : null;
      }
      const f10visits = r.visits.filter(v => v.node === 'f10');
      const firstF10 = f10visits[0] || null;
      const forcedIdx = r.visits.findIndex(v => v.forcedF10);
      const forcedFrom = forcedIdx > 0 ? r.visits[forcedIdx - 1] : null;
      audit.push({
        diff, key, ending: r.ending, stall: r.stall, steps: r.steps, observeRuns: r.observeRuns,
        actClock, f10count: f10visits.length, firstF10, forced: forcedIdx >= 0,
        forcedFrom, timeup: !!(r.api.state.flags.__timeup),
        teleported: f10visits.length > 0 && (r.visits[r.visits.findIndex(v => v.node === 'f10') - 1] || {}).node !== 'f9',
        margin: firstF10 ? DEADLINE_ABS - firstF10.clock : null,
        final: r.final, visits: r.visits, texts: r.texts
      });
    }
  }

  console.log('\n【1】每一幕进入时的 clock（虚拟时钟，真实引擎）');
  console.log('档位   策略  结局            序幕   第一幕 第二幕 第三幕 第四幕 终幕');
  for (const a of audit) {
    const c = ACTS.map(([id]) => a.actClock[id] == null ? '  --  ' : fmt(a.actClock[id]));
    console.log(`${a.diff.padEnd(9)} ${a.key}  ${(a.ending || ('卡住:' + a.stall)).padEnd(14)} ${c.join(' ')}`);
  }

  console.log('\n【2】是否被"时间到"空投到 f10（跳过剧情）');
  for (const a of audit) {
    if (a.teleported) {
      const i = a.visits.findIndex(v => v.node === 'f10');
      const from = a.visits[i - 1];
      console.log(`  ${a.diff}/${a.key}: **是** — 从 ${from.node}@${fmt(from.clock)} 直接空投到 f10（跳过 f1–f9）；f10 播 ${a.f10count} 次`);
    } else if (a.timeup) {
      console.log(`  ${a.diff}/${a.key}: 否 — 超时只在终幕/第四幕"报时"，没有转场（f10 ${a.firstF10 ? '自然从 f9 进入 @' + fmt(a.firstF10.clock) : '未抵达'}）`);
    } else {
      console.log(`  ${a.diff}/${a.key}: 否（自然抵达 f10 = ${a.firstF10 ? fmt(a.firstF10.clock) : '未抵达'}）`);
    }
  }

  console.log('\n【3】自然抵达 f10 的 clock 与 05:30 余额');
  for (const a of audit) {
    if (!a.firstF10) { console.log(`  ${a.diff}/${a.key}: 未抵达 f10（结局 ${a.ending}）`); continue; }
    const how = a.teleported ? '空投' : (a.firstF10.forcedF10 ? '自然（超时只报时）' : '自然');
    console.log(`  ${a.diff}/${a.key}: f10 @ ${fmt(a.firstF10.clock)}（${how}），距 05:30 余额 ${a.margin} 分；f10 播放 ${a.f10count} 次`);
  }

  console.log('\n【D1 回归用例】终幕选真结局不再被 deadline 拽回 f10');
  {
    const { boot } = require('./harness');
    /* 不要让复现脚本自己写死线索：真结局门槛（allClues / minSurvivors）从数据里读，
       数据以后再改，这条复现也不会假红。 */
    const api0 = await boot({ quiet: true });
    const gate = api0.run('JSON.stringify(STORY.nodes.g7.choices[0].when)');
    const when = JSON.parse(gate);
    const clues = (when.allClues || []).join(',');
    const survivors = when.minSurvivors || 0;
    const needEyes = 5;
    const api = await boot({
      quiet: true,
      search: `?node=g7&diff=standard&clock=05%3A20&clues=${encodeURIComponent(clues)}&eyes=${needEyes}&survivors=${survivors}`
    });
    await api.drain(600); await api.toDecision(600);
    console.log(`  真结局门槛（读自数据）：allClues=[${clues}] · minSurvivors=${survivors}`);
    const opt = api.choices().find(c => c.text.indexOf('转过身') >= 0);
    console.log('  g7 选项：' + api.choices().map(c => `「${c.text.slice(0, 12)}」${c.locked ? '(锁)' : ''}`).join(' '));
    if (opt) {
      /* 注意：?clock= 按 HH:MM 解析成"当天分钟数"，而真实进度里的 clock 是"从 22:10 起的绝对分钟数"。
         这里直接写绝对分钟数（1772 = 05:32），等价于自然跑到终幕的时刻。 */
      api.run('__game.state.stats.clock = 1772');
      opt.el.dispatchEvent({ type: 'click', target: opt.el, stopPropagation() {}, preventDefault() {} });
      await api.drain(1500);
      console.log(`  选「转过身，和他们一起回去」后：node=${api.nodeId}（期望 end_true）· clock=${fmt(api.state.stats.clock)} · __timeup=${!!api.state.flags.__timeup}`);
      check('D1 g7 选真结局后应进入 end_true，而不是被拽回 f10', api.nodeId === 'end_true', '实际 ' + api.nodeId);
    } else {
      check('D1 复现脚本能找到「转过身」选项', false, '选项列表里没有');
    }
  }

  console.log('\n【硬不变量】');
  const std = k => audit.find(a => a.diff === 'standard' && a.key === k);
  const F1_F9 = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f9'];
  for (const k of ['P1', 'P2', 'P3']) {
    const a = std(k);
    const nodes = a.visits.map(v => v.node);
    const iF10 = nodes.indexOf('f10');
    const prev = iF10 > 0 ? nodes[iF10 - 1] : null;
    /* T1：f10 只能从 f9 进来。若 f10 前面不是 f9，说明被 deadline 从别处空投过来（会跳过 f1–f9）。 */
    check(`T1 标准/${k} 没有"跳过 f1–f9"（f10 只能从 f9 进入）`,
      iF10 < 0 || prev === 'f9', iF10 < 0 ? '未到 f10' : `f10 前一个是 ${prev}`);
    /* T2：f10 只播一次（终幕不再被拽回去重播） */
    check(`T2 标准/${k} 终幕不重播（f10 只播 1 次）`, a.f10count === 1, `实际 ${a.f10count} 次`);
  }
  /* T3：P1/P3 必须自然抵达且留有余量（P2 允许超时，见 T4/T5） */
  for (const k of ['P1', 'P3']) {
    const a = std(k);
    const natural = !!a.firstF10 && !a.firstF10.forcedF10;
    check(`T3 标准/${k} 自然抵达 f10（未超时）`, natural, a.firstF10 ? `f10@${fmt(a.firstF10.clock)}${a.firstF10.forcedF10 ? '（超时）' : ''}` : '未抵达');
    check(`T4 标准/${k} 抵达 f10 时距 05:30 至少留 30 分`, a.margin != null && a.margin >= 30, `余额 ${a.margin} 分`);
  }
  /* T5：P2（贪看）被允许超时，但结局不得是 e_true；超时了就必须读到那句"看到天亮了" */
  {
    const a = std('P2');
    check('T5 标准/P2 贪看流拿不到 e_true', a.ending !== '五点三十一分', '结局「' + a.ending + '」');
    const f1f9 = F1_F9.filter(id => a.visits.some(v => v.node === id));
    check('T6 标准/P2 第四幕 f1–f9 全部走到', f1f9.length === F1_F9.length, `走到 ${f1f9.length}/${F1_F9.length}：${f1f9.join(',')}`);
    const hasLine = (a.texts || []).some(t => t.indexOf('看到天亮了') >= 0);
    check('T7 标准/P2 超时后读到「我一直在看。看到天亮了」',
      !a.timeup || hasLine, a.timeup ? (hasLine ? '已读到' : '没读到') : '本局未超时');
  }

  const all = results.filter(r => /^T\d/.test(r.name) || r.name.startsWith('D1'));
  const bad = all.filter(r => !r.ok);
  console.log(`\n${bad.length ? '✗ 时间预算审计 FAIL' : '✓ 时间预算审计 PASS'}：${all.length - bad.length} / ${all.length} 条不变量通过`);
  process.exitCode = bad.length ? 1 : 0;
})();
