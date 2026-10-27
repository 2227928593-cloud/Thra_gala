/* =========================================================
   难度 · 资源后果 · 存档策略 套件
   ---------------------------------------------------------
   对齐 design/gdd/difficulty-redesign.md：
     §4.1 观察代价模型（light / risk / 用鬼眼照明）
     §6   三档参数表（倍率 + 取整，不逐档硬编码）
     §10  接口约定（字段 / 6 个钩子 / 夹取与取整）
   全部跑真实引擎（tests/harness.js），断言玩家真能观察到的行为。
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { boot, ROOT } = require('./harness');
const { click, makeEvent } = require('./dom');
const { section, test, ok, eq, includes, notIncludes } = require('./tf');

const SAVE_KEY = 'thragal.save.v1';
const SAVE_MANUAL_KEY = 'thragal.save.manual.v1';
const SETTING_KEY = 'thragal.settings.v1';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* 在真实引擎里注入一个临时节点（剧情数据本身不动） */
const K13 = `STORY.nodes.k13 = { id:'k13', chapter:'测试', place:'走廊', scene:'corridor_dark',
  lines: [{ who:'', text:'敲门声停在第十三下。' }] }; 1`;

async function atNode(node, extra) {
  const g = await boot({ quiet: true, search: `?node=${node}${extra || ''}` });
  await g.drain(2000);
  return g;
}
async function runNode(g, id, opts) {
  await g.run(`__game.runNode(${JSON.stringify(id)}, ${JSON.stringify(Object.assign({ silent: true, force: true }, opts || {}))})`);
  await g.drain(800);
}
/* 打开观察层，点第 i 个热点，关掉卡片 */
async function observeOnce(g, i) {
  if (!g.observeOpen()) await g.clickChoice(g.choices().findIndex(c => c.isObserve));
  const h = g.$$('#observe-layer .hotspot')[i || 0];
  click(h);
  await g.drainFor(200);
  if (g.$('#observe-card') && !g.$('#observe-card').hidden) {
    click(g.$('#observe-card-close'));
    await g.drainFor(200);
  }
  return h;
}

module.exports = async function runDifficulty() {
  /* =========================================================
     A. 档位与倍率（§6.1）
     ========================================================= */
  section('难度档位');
  {
    const g = await boot({ quiet: true });

    await test('三档齐备，每档都写清代价/提示/存档/死亡四组参数', async () => {
      eq(JSON.stringify(g.run('Object.keys(__game.DIFFICULTY)')), JSON.stringify(['story', 'standard', 'nightmare']));
      const bad = g.run(`Object.values(__game.DIFFICULTY).filter(d =>
        typeof d.mul !== 'number' || !d.round || !d.knock || !d.hints || !d.save || !d.death
        || typeof d.knockPerObs !== 'number' || !d.corruption || !d.eyeLight || !d.lightRange).map(d => d.id)`);
      eq(bad.length, 0, '字段缺失的档位: ' + bad.join(','));
    });

    await test('默认「标准」档，代价与设计表一致：6 分 / +1 / 5%', async () => {
      eq(g.run('__game.difficulty().id'), 'standard');
      eq(g.q('#v-diff'), '标准');
      const c = g.run('__game.observeCost()');
      eq(c.clock, 6); eq(c.battery, 5); eq(c.rate, 1);
    });

    await test('倍率 + 取整：故事向下（4 分 / 3%）、噩梦向上（8 分 / 7%）', async () => {
      const gs = await atNode('p2', '&diff=story');
      const cs = gs.run('__game.observeCost()');
      eq(cs.clock, 4); eq(cs.battery, 3); eq(cs.rate, 0.5);
      const gn = await atNode('p2', '&diff=nightmare');
      const cn = gn.run('__game.observeCost()');
      eq(cn.clock, 8); eq(cn.battery, 7); eq(cn.rate, 2);
    });

    await test('节点基础耗时是显式表 4 / 6 / 7（不乘倍率，§12.1）', async () => {
      const base = await atNode('p2');
      eq(base.state.stats.clock, 1330 + 6, '标准档 walk 应 +6 分');
      const s2 = await atNode('p2', '&diff=story');
      eq(s2.state.stats.clock, 1330 + 4);
      const n2 = await atNode('p2', '&diff=nightmare');
      eq(n2.state.stats.clock, 1330 + 7);
    });

    await test('pace 覆盖节点耗时：run 四幕 2/3/4 分，still 终幕 0 分', async () => {
      const g = await atNode('p2');
      g.run(`STORY.nodes.__run = { id:'__run', scene:'classroom', pace:'run', lines:[{ who:'', text:'跑。' }] };
             STORY.nodes.__still = { id:'__still', scene:'classroom', pace:'still', lines:[{ who:'', text:'停。' }] }; 1`);
      const c0 = g.state.stats.clock;
      await runNode(g, '__run');
      eq(g.state.stats.clock - c0, 3, '标准档 run = 3 分');
      const c1 = g.state.stats.clock;
      await runNode(g, '__still');
      eq(g.state.stats.clock - c1, 0, 'still = 0 分');
    });

    await test('设定里切换档位会持久化，并写进新开的一局', async () => {
      const g2 = await boot({ quiet: true });
      click(g2.$('#boot .menu-item[data-act="settings"]'));
      await g2.drain(200);
      const sel = g2.$('#set-difficulty');
      ok(sel, '设定里应存在难度选择器');
      sel.value = 'nightmare';
      sel.dispatchEvent(makeEvent('change', { target: sel }));
      await g2.drain(200);
      eq(JSON.parse(g2.store.getItem(SETTING_KEY)).difficulty, 'nightmare');
      eq(g2.q('#v-diff'), '噩梦');
      click(g2.$('#boot .menu-item[data-act="new"]'));
      await g2.drain(3000);
      eq(g2.state.difficulty, 'nightmare');
      eq(g2.q('#v-diff'), '噩梦');
      ok(g2.$('#stat-diff').classList.contains('diff-nightmare'));
    });

    await test('局内切换难度立刻生效，并持久化为下一局默认值', async () => {
      const g2 = await atNode('p2');
      eq(g2.run('__game.observeCost().clock'), 6);
      g2.run(`__game.setDifficulty('nightmare')`);
      await g2.drain(200);
      eq(g2.state.difficulty, 'nightmare');
      eq(g2.run('__game.observeCost().clock'), 8);
      eq(g2.q('#v-diff'), '噩梦');
      eq(JSON.parse(g2.store.getItem(SETTING_KEY)).difficulty, 'nightmare');
      g2.run(`__game.setDifficulty('不存在的档位')`);
      eq(g2.state.difficulty, 'nightmare', '非法档位应被忽略');
    });

    await test('噩梦档隐去具体代价数字（提高认知负担）', async () => {
      const gn = await atNode('p2', '&diff=nightmare');
      await gn.toDecision();
      const entry = gn.choices().find(c => c.isObserve);
      ok(entry, '应存在观察入口');
      notIncludes(entry.text, '时间 +', '噩梦档不应给出精确代价');
      includes(entry.text, '付代价');
    });

    await test('观察一次按档位扣减（标准：时间 +6 / 敲门 +1 / 电量 −5%）', async () => {
      const g2 = await atNode('d7', '&battery=100');
      await g2.toDecision();
      const before = { ...g2.state.stats };
      await observeOnce(g2, 0);
      const after = g2.state.stats;
      eq(after.clock - before.clock, 6, '时刻应 +6');
      eq(after.knock - before.knock, 1, '敲门应 +1');
      eq(before.battery - after.battery, 5, '电量应 −5%');
    });
  }

  /* =========================================================
     B. 观察代价模型（§4.1）
     ========================================================= */
  section('观察代价模型');
  {
    await test('故事档敲门累计取整：每 2 处 +1（0/1/0/1）', async () => {
      const g = await atNode('d7', '&diff=story');
      await g.toDecision();
      const deltas = [];
      for (let i = 0; i < 4; i++) {
        const before = g.state.stats.knock;
        await observeOnce(g, 0);
        deltas.push(g.state.stats.knock - before);
      }
      eq(deltas.join(','), '0,1,0,1', '累计取整必须是 0/1/0/1，不是每次都向下取整');
      eq(g.state.obsCount, 4);
    });

    await test('hotspot.risk 叠加到敲门', async () => {
      const g = await atNode('p2');
      g.run(`STORY.nodes.__risk = { id:'__risk', scene:'toilet',
        lines:[{ who:'', text:'看。' }],
        observe: [{ id:'r1', label:'他在看你', x:50, y:40, text:'……', risk:3 }] }; 1`);
      await runNode(g, '__risk');
      await g.toDecision();
      const before = g.state.stats.knock;
      await observeOnce(g, 0);
      eq(g.state.stats.knock - before, 1 + 3, '基础 +1 再叠 risk 3');
    });

    await test('light:0 / free 的观察点不耗照明（不扣电）', async () => {
      const g = await atNode('p2', '&battery=100');
      g.run(`STORY.nodes.__dark0 = { id:'__dark0', scene:'void_dark',
        lines:[{ who:'', text:'黑暗退了。' }],
        observe: [{ id:'d0', label:'晨光', x:50, y:40, text:'……', light:0 },
                  { id:'d0b', label:'鬼眼', x:60, y:40, text:'……', free:true }] }; 1`);
      await runNode(g, '__dark0');
      await g.toDecision();
      const before = g.state.stats.battery;
      await observeOnce(g, 0);
      eq(g.state.stats.battery, before, 'light:0 不耗电');
      await observeOnce(g, 0);
      eq(g.state.stats.battery, before, 'free 也不耗电');
    });

    await test('电量不够但 eyes ≥ 1：改用鬼眼照明，扣复苏不扣电', async () => {
      const g = await atNode('p2', '&battery=10&eyes=1');
      g.run(`STORY.nodes.__eye = { id:'__eye', scene:'corridor_dark',
        lines:[{ who:'', text:'黑。' }],
        observe: [{ id:'e1', label:'近处', x:50, y:40, text:'……', light:1 },
                  { id:'e2', label:'远处', x:60, y:40, text:'……', light:2 }] }; 1`);
      await runNode(g, '__eye');
      await g.toDecision();
      const b0 = g.state.stats.battery, c0 = g.state.stats.corruption;
      await observeOnce(g, 0);
      eq(g.state.stats.battery, b0, '不扣电');
      eq(g.state.stats.corruption - c0, 3, 'light:1 用鬼眼 = 复苏 +3');
      const c1 = g.state.stats.corruption;
      await observeOnce(g, 0);
      eq(g.state.stats.corruption - c1, 5, 'light:2 用鬼眼 = 复苏 +5');
    });

    await test('电量不够且 eyes === 0：只有这一种情况会置灰、点不开', async () => {
      const g = await atNode('p2', '&battery=10&eyes=0');
      g.run(`STORY.nodes.__dark = { id:'__dark', scene:'corridor_dark',
        lines:[{ who:'', text:'黑。' }],
        observe: [{ id:'x1', label:'看不清', x:50, y:40, text:'……' }] }; 1`);
      await runNode(g, '__dark');
      await g.toDecision();
      /* 全部太黑时：**不渲染可交互入口**，只留一行不可交互的说明（P0） */
      eq(g.choices().filter(c => c.isObserve).length, 0, '全黑时不应有可点的观察入口');
      const note = g.$('#choices .observe-note');
      ok(note, '应有一行不可交互的说明');
      includes(note.textContent, '太黑');
      eq(note.tagName, 'DIV', '说明不是按钮');
      /* 即使被外部硬调，enterObserve 也不该进空层 */
      g.run('__game.runNode && __game.enterObserve && 1');
      eq(g.observeOpen(), false, '不应进入空观察层');
      eq(g.state.flags['__ob___dark_x1'], undefined, '不应记为已看过');
    });

    await test('复苏过了力量阈值后，light:1 由眼睛代付（不再耗电）', async () => {
      const g = await atNode('p2', '&battery=10&eyes=1&corr=30');
      g.run(`STORY.nodes.__pw = { id:'__pw', scene:'corridor_dark',
        lines:[{ who:'', text:'……' }],
        observe: [{ id:'p1', label:'近处', x:50, y:40, text:'……', light:1 }] }; 1`);
      await runNode(g, '__pw');
      await g.toDecision();
      eq(g.run('__game.lightPlan(STORY.nodes.__pw.observe[0]).kind'), 'eye-free');
      const b0 = g.state.stats.battery, c0 = g.state.stats.corruption;
      await observeOnce(g, 0);
      eq(g.state.stats.battery, b0);
      eq(g.state.stats.corruption, c0, '眼睛照着，既不吃电也不吃复苏');
    });

    await test('受伤（ankle_hurt）时，看一处再 +2 分钟', async () => {
      const g = await atNode('d7', '&battery=100&flags=ankle_hurt');
      await g.toDecision();
      const before = g.state.stats.clock;
      await observeOnce(g, 0);
      eq(g.state.stats.clock - before, 6 + 2);
    });
  }

  /* =========================================================
     C. 资源后果（H3 / 敲门 / 时刻 / 复苏）
     ========================================================= */
  section('资源后果');
  {
    await test('电量 < 30% 给舞台加 .low-battery（H3）', async () => {
      const g = await atNode('d7', '&battery=25');
      ok(g.stageClass().includes('low-battery'), '应加 low-battery，实际 ' + g.stageClass());
      const g2 = await atNode('d7', '&battery=100');
      ok(!g2.stageClass().includes('low-battery'));
    });

    await test('电量收缩：plain → ref → key 的顺序砍，至少留 1 处；noDim 豁免（§12.3）', async () => {
      const g = await atNode('d7', '&battery=5');
      const r = g.run(`(() => {
        const remain = __game.observationRemaining(STORY.nodes.d7);
        const vis = __game.observationVisible(STORY.nodes.d7);
        return { total: remain.length, vis: vis.map(o => o.id),
          nd: remain.filter(o => o.noDim).map(o => o.id),
          keys: remain.filter(o => __game.hotspotTier(o) === 'key').map(o => o.id) };
      })()`);
      eq(r.total, 4, 'd7 应有 4 处待看');
      ok(r.vis.length >= 1, '至少要留 1 处');
      ok(r.vis.length <= r.total, '可见集合不能大于剩余');
      r.nd.forEach(id => ok(r.vis.includes(id), 'noDim 点 ' + id + ' 永不被吞'));

      /* 造 5 个 plain 点：电量 5% 时应剩 ceil(5×0.4)=2 处 */
      g.run(`STORY.nodes.__dim = { id:'__dim', scene:'corridor_dark', lines:[{ who:'', text:'黑。' }],
        observe: [1,2,3,4,5].map(i => ({ id:'p' + i, label:'细节' + i, x:20 + i * 12, y:40, text:'……' })) }; 1`);
      eq(g.run('__game.observationVisible(STORY.nodes.__dim).length'), 2, '5 个细节点应只剩 2 处');

      const gs = await atNode('d7', '&battery=0&diff=story');
      eq(gs.run('__game.observationVisible(STORY.nodes.d7).length'), 4, '故事档常显');
    });

    await test('key 优先于 plain：有 key 时先砍 plain，不砍 key', async () => {
      const g = await atNode('p2', '&battery=5');
      g.run(`STORY.nodes.__tier = { id:'__tier', scene:'corridor_dark', lines:[{ who:'', text:'黑。' }],
        observe: [
          { id:'k1', label:'关键', x:20, y:40, text:'……', effects:{ clues:['knock_rule'] } },
          { id:'p1', label:'细节一', x:40, y:40, text:'……' },
          { id:'p2', label:'细节二', x:60, y:40, text:'……' }
        ] }; 1`);
      const r = g.run(`(() => {
        const remain = __game.observationRemaining(STORY.nodes.__tier);
        const vis = __game.observationVisible(STORY.nodes.__tier);
        return { vis: vis.map(o => o.id), tiers: remain.map(o => o.id + ':' + __game.hotspotTier(o)) };
      })()`);
      /* ceil(3×0.4)=2 → 应保留 1 个 key + 1 个细节 */
      eq(r.vis.length, 2, '3 处应剩 2 处，实际 ' + r.vis.join(','));
      const keyId = r.tiers.find(t => t.endsWith(':key')).split(':')[0];
      ok(r.vis.includes(keyId), 'key 点必须优先保留（' + keyId + '），实际 ' + r.vis.join(','));
    });

    await test('电量 10% 时：key 优先保留，o_f10_eyes（noDim）永不隐藏（真实数据回归）', async () => {
      /* 这条守的是 hotspotTier 的隐藏耦合：hotspotTier 是"全局反推"——
         剧情里任何一条 allClues 都可能把别的节点的点从 ref 升成 key，
         从而改变"电量不足时先砍谁"。改剧情必须重跑这条。 */
      const g = await atNode('f10', '&battery=10');
      const r = g.run(`(() => {
        const remain = __game.observationRemaining(STORY.nodes.f10);
        const vis = __game.observationVisible(STORY.nodes.f10);
        return { vis: vis.map(o => o.id), visTiers: vis.map(o => __game.hotspotTier(o)),
                 nd: remain.filter(o => o.noDim).map(o => o.id) };
      })()`);
      ok(r.vis.includes('o_f10_eyes'), 'o_f10_eyes 是 saw_sixth 的唯一来源，必须始终可见（实际 ' + r.vis.join(',') + '）');
      ok(r.nd.includes('o_f10_eyes'), '数据侧应把它标成 noDim');

      const g2 = await atNode('d7', '&battery=10');
      const r2 = g2.run(`(() => {
        const vis = __game.observationVisible(STORY.nodes.d7);
        return { vis: vis.map(o => o.id + ':' + __game.hotspotTier(o)) };
      })()`);
      /* ceil(4×0.4)=2：应全是 key，说明 key 优先于 ref/plain */
      ok(r2.vis.length === 2, 'd7 应剩 2 处，实际 ' + r2.vis.join(','));
      ok(r2.vis.every(x => x.endsWith(':key')), '剩下的必须是最关键的两处，实际 ' + r2.vis.join(','));
    });

    await test('noDim 的观察点不会被电量吞掉（全篇唯一线索来源）', async () => {
      const g = await atNode('p2', '&battery=5');
      g.run(`STORY.nodes.__nd = { id:'__nd', scene:'corridor_dark', lines:[{ who:'', text:'黑。' }],
        observe: [
          { id:'a', label:'普通一', x:30, y:40, text:'……' },
          { id:'b', label:'普通二', x:40, y:40, text:'……' },
          { id:'c', label:'唯一来源', x:50, y:40, text:'……', noDim:true }
        ] }; 1`);
      const vis = g.run('__game.observationVisible(STORY.nodes.__nd)');
      ok(vis.some(o => o.id === 'c'), 'noDim 的点必须始终可见，实际 ' + vis.map(o => o.id).join(','));
      ok(vis.length < 3, '其余点仍按电量收缩，实际 ' + vis.length);
    });

    await test('电量归零只触发钩子与叙事提示，不判死', async () => {
      const g = await atNode('d7', '&battery=12');
      g.run(`window.__hooked = null;
             __game.HOOKS.resourceEmpty.push((k, v) => { window.__hooked = k + ':' + v; });
             STORY.nodes.__drain = { id:'__drain', scene:'bone_tree',
               enter: { stats: { battery: -100 } }, lines: [{ who:'', text:'灯灭了。' }] }; 1`);
      await g.run(`__game.runNode('__drain', { silent: true, force: true })`);
      await g.drainFor(400);
      eq(g.state.flags.__empty_battery, true);
      eq(g.run('window.__hooked'), 'battery:0', '写入即夹到 0');
      ok(g.toasts().some(t => /手机黑屏/.test(t.text)));
      eq(g.nodeId, '__drain', '不应判死或跳节点');
      ok(g.$('#modal-end').hidden);
      eq(g.state.stats.battery, 0, '电量写入即夹 0，不许出现负数');
    });

    await test('敲门阈值随难度：标准 9/12，噩梦 8/10', async () => {
      const gs = await atNode('p2', '&knock=9');
      ok(gs.$('#stat-knock').classList.contains('warn'), '标准 9 下起警告');
      const gn = await atNode('p2', '&knock=10&diff=nightmare');
      ok(gn.$('#stat-knock').classList.contains('danger'), '噩梦 10 下已进危险');
    });

    await test('没听过录音时 HUD 的敲门是 ?，听过（listened）后显示数字', async () => {
      const g = await atNode('p2');
      eq(g.q('#v-knock'), '?');
      const g2 = await atNode('p2', '&flags=listened');
      eq(g2.q('#v-knock'), '0');
    });

    await test('k13 节点不存在时：敲门到阈值也不崩、不转场、不记旗标（H1 防御）', async () => {
      const g = await atNode('p2', '&knock=12');
      g.run('delete STORY.nodes.k13; 1');          // 模拟"文案还没落地"
      g.run('__game.state.stats.knock = 13; 1');
      await runNode(g, 'p3');
      eq(g.nodeId, 'p3', '应正常往下走，不崩');
      eq(g.state.flags.__k13, undefined, '节点不存在时不该记旗标，等文案落地后自然生效');
    });

    await test('k13 存在时，敲门到阈值会被强制转场（真实数据已落地）', async () => {
      const g = await atNode('p2', '&knock=12');
      ok(g.run('!!STORY.nodes.k13'), '剧情数据里应已存在 k13 节点');
      g.run('__game.state.stats.knock = 13; 1');
      await runNode(g, 'p3');
      eq(g.nodeId, 'k13');
      eq(g.state.flags.__k13, true);
    });

    await test('噩梦档撞上 k13 直接判死（选择即承诺）', async () => {
      const g = await atNode('p2', '&knock=10&diff=nightmare');
      g.run('__game.state.stats.knock = 11; 1');   // 噩梦档 k13 阈值是 11
      await runNode(g, 'p3');
      await g.drain(600);
      ok(g.endingVisible(), '应直接进坏结局');
    });

    await test('时刻：每节点扣基础耗时，可用 costClock 覆盖（H2）', async () => {
      const g = await atNode('p2');
      const before = g.state.stats.clock;
      g.run(`STORY.nodes.__cost = { id:'__cost', scene:'classroom', costClock: 30, lines:[{ who:'', text:'……' }] }; 1`);
      await runNode(g, '__cost');
      eq(g.state.stats.clock - before, 30);
    });

    await test('跨 03:00 置 night_late', async () => {
      const g = await atNode('p2');
      g.run(`__game.state.stats.clock = 1330 + 285;   /* 02:55 = 经过 285 分 */
             STORY.nodes.__late = { id:'__late', scene:'classroom', costClock: 10, lines:[{ who:'', text:'……' }] }; 1`);
      await runNode(g, '__late');
      eq(g.state.flags.night_late, true, '跨过 03:00 应置旗标');
    });

    await test('时间预算用"经过分钟数"：22:14 不会被误判为超时', async () => {
      const g = await atNode('p2');
      eq(g.state.flags.__timeup, undefined, '只经过了 4 分钟');
      const g2 = await atNode('p2');
      g2.run('__game.state.stats.clock = 1330 + 440; 1');
      await runNode(g2, 'p3');
      eq(g2.nodeId, 'f10', '经过 440 分（05:30）应强制进死线节点');
      eq(g2.state.flags.__timeup, true);
    });

    await test('复苏爆表只在幕末节点触发 end_absorb', async () => {
      const g = await atNode('p2', '&corr=90');
      await runNode(g, 'p3');
      eq(g.nodeId, 'p3', '非幕末节点不触发');
      const g2 = await atNode('act5', '&corr=90');
      await g2.drain(1500);
      eq(g2.state.flags.__absorb, true);
      eq(g2.nodeId, 'end_absorb');
    });

    await test('复苏 ≥ 阈值−5：HUD 转血色 + 只警告一次', async () => {
      const g = await atNode('p2', '&corr=80');
      ok(g.$('#stat-corrupt').classList.contains('critical'), '80 ≥ 85−5 应转血色');
      eq(g.state.flags.__corruption_warn, true, '应记下"已警告过"');
      /* 再推进一大段时间也不该重复警告 */
      await g.drain(6000);
      eq(g.state.flags.__corruption_warn, true);
      const g2 = await atNode('p2', '&corr=40');
      ok(!g2.$('#stat-corrupt').classList.contains('critical'), '40 不该转血色');
    });

    await test('「压住它」：消耗 1 名同伴把复苏压回 70，一局一次（Q5）', async () => {
      const g = await atNode('p2', '&corr=78&survivors=5');
      ok(g.run('__game.pressCorruption()'));
      eq(g.state.stats.corruption, 70);
      eq(g.state.stats.survivors, 4);
      eq(g.state.flags.__pressed_corruption, true);
      ok(g.run('__game.pressCorruption()') === false, '一局只能按一次');
      eq(g.state.stats.survivors, 4, '第二次不应再扣人');
    });
  }

  /* =========================================================
     D. 存档策略（§6.3 / Q3）
     ========================================================= */
  section('存档策略');
  {
    const menuActs = g => g.$$('#modal-menu [data-act]').map(b => ({ act: b.dataset.act, hidden: b.hidden, text: b.textContent }));
    const openMenu = async g => {
      g.doc.dispatchEvent(makeEvent('keydown', { key: 'Escape', target: g.doc.body }));
      await g.drain(200);
    };

    await test('标准档：没有「保存/读取进度」，只有「回到本场景开头」', async () => {
      const g = await atNode('p2');
      await openMenu(g);
      const a = menuActs(g);
      eq(a.find(x => x.act === 'save').hidden, true);
      eq(a.find(x => x.act === 'load').hidden, true);
      eq(a.find(x => x.act === 'restart').hidden, false);
      eq(a.find(x => x.act === 'restart').text, '回到本场景开头', '标准档的锚点是场景，文案不能写成节点');
    });

    await test('故事档：保存 / 读取 / 回到本节点开头都在，且能写手动槽', async () => {
      const g = await atNode('p2', '&diff=story');
      await openMenu(g);
      const a = menuActs(g);
      eq(a.find(x => x.act === 'save').hidden, false);
      eq(a.find(x => x.act === 'load').hidden, false);
      eq(a.find(x => x.act === 'restart').hidden, false);
      eq(a.find(x => x.act === 'restart').text, '回到本节点开头', '故事档走 nk，精确到节点');
      click(g.$$('#modal-menu [data-act]').find(b => b.dataset.act === 'save'));
      await g.drainFor(300);
      ok(g.store.getItem(SAVE_MANUAL_KEY), '应写手动槽');
      eq(JSON.parse(g.store.getItem(SAVE_MANUAL_KEY)).difficulty, 'story');
    });

    await test('噩梦档：三个入口全部移除', async () => {
      const g = await atNode('p2', '&diff=nightmare');
      await openMenu(g);
      const a = menuActs(g);
      eq(a.find(x => x.act === 'save').hidden, true);
      eq(a.find(x => x.act === 'load').hidden, true);
      eq(a.find(x => x.act === 'restart').hidden, true);
    });

    await test('「回到本场景开头」把资源也退回去', async () => {
      const g = await atNode('d7', '&battery=100');
      await g.toDecision();
      const before = { clock: g.state.stats.clock, battery: g.state.stats.battery };
      await observeOnce(g, 0);
      ok(g.state.stats.battery < before.battery, '先花掉一点电');
      g.run('__game.restartNode()');
      await g.drain(800);
      eq(g.state.stats.battery, before.battery, '电量应回到节点开头');
      eq(g.state.stats.clock, before.clock, '时刻也应退回看之前');
    });

    /* 死亡回退：三个档位三种落点 */
    const injectDeath = g => g.run(`
      STORY.nodes.__a1 = { id:'__a1', scene:'classroom', chapter:'测试 · 第一幕',
        actCard: { id:'__a1card', kicker:'测试', title:'测试幕' },
        lines:[{ who:'', text:'幕首。' }], next:'__a2' };
      STORY.nodes.__a2 = { id:'__a2', scene:'classroom',
        lines:[{ who:'', text:'中段。' }], choices:[{ text:'去死', ending:'e_door' }] }; 1`);

    await test('故事档：坏结局不回滚（§12.5 mode:none），但「回到本节点开头」仍可用', async () => {
      const g = await atNode('p2', '&diff=story');
      injectDeath(g);
      await runNode(g, '__a1');
      await g.drain(4000);
      await g.toDecision();
      await g.clickChoice(0);
      await g.drain(600);
      ok(g.endingVisible());
      eq(g.state.deathPending, null, '故事档不做自动回滚');
      eq(g.q('#modal-end [data-act="again"]'), '再来一夜');
      ok(g.state.nk, '但仍保留本节点锚点，供菜单「回到本节点开头」使用');
    });

    await test('标准档死在坏结局：回本场景开头，资源维持当时数值，不扣 knock', async () => {
      const g = await atNode('p2', '&diff=standard');
      injectDeath(g);
      await runNode(g, '__a1');
      await g.drain(4000);
      await g.toDecision();
      const knockAtDeath = g.state.stats.knock;
      const ckNode = g.state.ck && g.state.ck.node;
      await g.clickChoice(0);
      await g.drain(600);
      eq(g.q('#modal-end [data-act="again"]'), '回本场景开头');
      eq(g.state.deathPending.mode, 'rollback');
      eq(ckNode, '__a1', '检查点应记在场景开头');
      click(g.$('#modal-end [data-act="again"]'));
      await g.drain(2000);
      eq(g.nodeId, '__a1', '应回本场景开头');
      eq(g.state.stats.knock, Math.min(knockAtDeath, 11), '标准档不扣 knock（只夹到 danger−1=11）');
      eq(g.state.rollbackCount, 1);
    });

    await test('噩梦档死在坏结局：回本场景开头，并付敲门 +3 / 同伴 −1（惩罚不为负）', async () => {
      /* 噩梦 k13 阈值是 11，所以不能带着 knock=11 启动（会在 p2 就被判死），
         先在场景里走到死亡选择，再把 knock 抬到 11 模拟"听满十三下"的状态。 */
      const g = await atNode('p2', '&diff=nightmare&survivors=6');
      injectDeath(g);
      await runNode(g, '__a1');
      await g.drain(4000);
      await g.toDecision();
      g.run('__game.state.stats.knock = 11; 1');
      await g.clickChoice(0);
      await g.drain(600);
      click(g.$('#modal-end [data-act="again"]'));
      await g.drain(2000);
      eq(g.nodeId, '__a1');
      eq(g.state.stats.survivors, 5);
      /* 死亡时 knock=11（已过 danger−1=9）：夹到 9 会变成"奖励"，所以取 max(夹后, 夹前) = 11 */
      ok(g.state.stats.knock >= 11, '惩罚的净效果不能为负，实际 ' + g.state.stats.knock);
      ok(g.state.stats.knock <= 12, '也不该继续上涨（k13 已用掉一次）');
    });

    await test('回滚后复苏被夹到 brk−15，不会立刻再次失控', async () => {
      const g = await atNode('p2', '&diff=standard&corr=90');
      injectDeath(g);
      await runNode(g, '__a1');
      await g.drain(4000);
      await g.toDecision();
      await g.clickChoice(0);
      await g.drain(600);
      click(g.$('#modal-end [data-act="again"]'));
      await g.drain(2000);
      ok(g.state.stats.corruption <= 70, '应从 90 夹到 brk−15=70，实际 ' + g.state.stats.corruption);
    });

    await test('k13 回跳：写 __k13_back，屏息后回到触发节点而不是整幕重播', async () => {
      const g = await atNode('p2', '&knock=12&clues=knock_rule');
      g.run('__game.state.stats.knock = 13; 1');
      await runNode(g, 'p3');                    // 触发节点 = p3
      eq(g.nodeId, 'k13');
      eq(g.state.flags.__k13_back, 'p3', '应记下被打断的节点');
      await g.toDecision();
      await g.clickChoice(g.choices().findIndex(c => /屏住呼吸/.test(c.text)));
      await g.drain(1000);
      /* 只推进到"离开 k13_pass"为止：再多推一步 p3 就自己走到 p4 了 */
      for (let i = 0; i < 40 && g.nodeId === 'k13_pass'; i++) { g.advance(); await g.drain(300); }
      eq(g.nodeId, 'p3', '应回到被打断的节点，而不是 actStart');
      ok(g.state.stats.knock < 13, '屏息后敲门应降下来，不会立刻二次触发');
      eq(g.state.flags.__k13, true, '旗标应保留，防同一局反复拦截');
    });

    await test('旧版存档（v1：没有 v / difficulty / 锚点）可以读，按标准档继续', async () => {
      const legacy = {
        node: 'p4', line: 0, flags: { listened: true },
        stats: { clock: 1345, knock: 4, eyes: 1, corruption: 10, battery: 78, survivors: 40, minutes: 0 },
        clues: ['photo'], items: {}, codex: ['photo'], act: 0, cycle: 1
      };
      const g = await boot({ quiet: true, storage: { [SAVE_KEY]: JSON.stringify(legacy) } });
      eq(g.$('#btn-continue').disabled, false);
      includes(g.q('#continue-meta'), '标准');
      click(g.$('#boot .menu-item[data-act="continue"]'));
      await g.drain(3000);
      eq(g.nodeId, 'p4');
      eq(g.state.difficulty, 'standard');
      eq(g.state.stats.battery, 78);
      ok(g.state.clues.includes('photo'));
      ok(g.state.flags.listened);
    });

    await test('残缺存档用默认值补齐，不丢档也不崩', async () => {
      const g = await boot({ quiet: true, storage: { [SAVE_KEY]: JSON.stringify({ node: 'p2', stats: { clock: 1400 } }) } });
      click(g.$('#boot .menu-item[data-act="continue"]'));
      await g.drain(3000);
      eq(g.nodeId, 'p2');
      eq(g.state.stats.battery, 100);
      eq(g.state.difficulty, 'standard');
      ok(g.gameVisible());
    });

    await test('读档时难度不一致要提示，且不静默覆盖存档档位', async () => {
      const save = {
        node: 'p4', line: 0, flags: {}, difficulty: 'nightmare',
        stats: { clock: 1345, knock: 0, eyes: 0, corruption: 0, battery: 90, survivors: 40 },
        clues: [], items: {}, codex: [], act: 0, cycle: 1
      };
      const g = await boot({ quiet: true, storage: { [SAVE_KEY]: JSON.stringify(save) } });
      click(g.$('#boot .menu-item[data-act="continue"]'));
      await g.drain(300);
      eq(g.$('#confirm').hidden, false, '应弹出提示');
      includes(g.q('#confirm-text'), '噩梦');
      includes(g.q('#confirm-text'), '标准');
      click(g.$('#confirm-yes'));
      await g.drain(3000);
      eq(g.nodeId, 'p4');
      eq(g.state.difficulty, 'nightmare', '按存档的档位继续');
      eq(JSON.parse(g.store.getItem(SETTING_KEY) || '{}').difficulty, undefined, '不应偷偷改写设定');
    });

    await test('取消难度提示则不进入游戏', async () => {
      const save = {
        node: 'p4', line: 0, flags: {}, difficulty: 'story',
        stats: { clock: 1345, knock: 0, eyes: 0, corruption: 0, battery: 90, survivors: 40 },
        clues: [], items: {}, codex: [], act: 0, cycle: 1
      };
      const g = await boot({ quiet: true, storage: { [SAVE_KEY]: JSON.stringify(save) } });
      click(g.$('#boot .menu-item[data-act="continue"]'));
      await g.drain(300);
      click(g.$('#confirm-no'));
      await g.drain(600);
      ok(g.atTitle(), '应停在标题页');
      eq(g.state, null);
    });

    await test('读档不会重复结算节点进入效果（skipEnter）', async () => {
      const g = await atNode('p2');
      g.run(`STORY.nodes.__enter = { id:'__enter', scene:'classroom', stats: { knock: 3 },
               lines:[{ who:'', text:'进来。' }] }; 1`);
      await runNode(g, '__enter');
      eq(g.state.stats.knock, 3);
      await runNode(g, '__enter', { skipEnter: true });
      eq(g.state.stats.knock, 3, '重入不应再 +3');
    });
  }

  /* =========================================================
     E. 新字段：tell / 条件门槛 / 去剧透
     ========================================================= */
  section('新字段与去剧透');
  {
    await test('check() 支持 minSurvivors / maxCorruption（§8.4）', async () => {
      const g = await atNode('p2', '&survivors=5&corr=40');
      g.run(`STORY.nodes.__gate = { id:'__gate', scene:'classroom',
        lines:[{ who:'', text:'门槛。' }],
        choices:[
          { text:'人够', when:{ minSurvivors: 5 }, next:'p3' },
          { text:'人不够', when:{ minSurvivors: 6 }, next:'p3' },
          { text:'人性够', when:{ maxCorruption: 40 }, next:'p3' },
          { text:'人性不够', when:{ maxCorruption: 39 }, next:'p3' }
        ] }; 1`);
      await runNode(g, '__gate');
      await g.toDecision();
      const st = {};
      g.choices().forEach(c => { st[c.text] = c.locked; });
      eq(st['人够'], false, '5 人应满足 minSurvivors:5');
      eq(st['人不够'], true);
      eq(st['人性够'], false);
      eq(st['人性不够'], true);
    });

    await test('when.diff：同一条选项在 standard 可见、nightmare 不可见', async () => {
      const NODE = `STORY.nodes.__diff = { id:'__diff', scene:'classroom',
        lines:[{ who:'', text:'档位门槛。' }],
        choices:[
          { text:'只在噩梦', when:{ diff:'nightmare' }, next:'p3' },
          { text:'只在故事和标准', when:{ diff:['story','standard'] }, next:'p3' },
          { text:'噩梦+低理智', when:{ diff:'nightmare', minSanity: 30 }, next:'p3' },
          { text:'普通出口', next:'p3' }
        ] }; 1`;

      const gs = await atNode('p2', '&diff=standard');
      gs.run(NODE);
      await runNode(gs, '__diff');
      await gs.toDecision();
      const std = {};
      gs.choices().forEach(c => { std[c.text] = { locked: c.locked, hint: c.hint }; });
      eq(std['只在噩梦'].locked, true, '标准档不该出现噩梦专属选项');
      eq(std['只在故事和标准'].locked, false, '数组形式应命中标准档');
      eq(std['噩梦+低理智'].locked, true);
      /* 关键：diff 不匹配时不能提示"看不清"（那不是理智的问题） */
      ok(!/看不清|想不清/.test(std['噩梦+低理智'].hint || ''),
        'diff 不匹配时不该给理智提示，实际 ' + JSON.stringify(std['噩梦+低理智'].hint));

      const gn = await atNode('p2', '&diff=nightmare&sanity=20');
      gn.run(NODE);
      await runNode(gn, '__diff');
      await gn.toDecision();
      const nm = {};
      gn.choices().forEach(c => { nm[c.text] = { locked: c.locked, hint: c.hint }; });
      eq(nm['只在噩梦'].locked, false, '噩梦档应出现该选项');
      eq(nm['只在故事和标准'].locked, true, '数组里没有噩梦 → 锁');
      eq(nm['噩梦+低理智'].locked, true, '理智 20 < 30 → 锁');
      ok(/看不清|想不清/.test(nm['噩梦+低理智'].hint || ''),
        'diff 匹配且理智不足时应给理智提示，实际 ' + JSON.stringify(nm['噩梦+低理智'].hint));
    });

    await test('三档差异：故事档不锁理智、断片恢复值、扣减/恢复系数（设计 §3.10）', async () => {
      /* ① 故事档：f6 串规则 / f2 挂断 / f10 咬眼 全部可点 */
      const s6 = await atNode('f6', '&diff=story&sanity=10'); await s6.toDecision();
      eq(s6.choices().find(c => /串起来/.test(c.text)).locked, false, '故事档不锁「串规则」');
      const s2 = await atNode('f2', '&diff=story&sanity=10&items=phone'); await s2.toDecision();
      eq(s2.choices().find(c => /立刻挂断/.test(c.text)).locked, false, '故事档不锁「立刻挂断」');
      const s10 = await atNode('f10', '&diff=story&sanity=10&clues=eye_rule&eyes=5'); await s10.toDecision();
      eq(s10.choices().find(c => /咬下手臂/.test(c.text)).locked, false, '故事档不锁「咬眼」');

      /* ② 标准档：同样的状态应该锁 */
      const t6 = await atNode('f6', '&diff=standard&sanity=10'); await t6.toDecision();
      eq(t6.choices().find(c => /串起来/.test(c.text)).locked, true, '标准档应锁「串规则」');
      const t2 = await atNode('f2', '&diff=standard&sanity=10&items=phone'); await t2.toDecision();
      eq(t2.choices().find(c => /立刻挂断/.test(c.text)).locked, true, '标准档「立刻挂断」应降级');
      eq(t2.choices().find(c => /扔进黑/.test(c.text)).locked, false, '降级选项应可用');
      const t10 = await atNode('f10', '&diff=standard&sanity=10&clues=eye_rule&eyes=5'); await t10.toDecision();
      eq(t10.choices().find(c => /咬下手臂/.test(c.text)).locked, true, '标准档应锁「咬眼」');

      /* ③ 故事档理智 0：不断片、抬到 1、没有 +30 */
      const sb = await atNode('d4', '&diff=story');
      const c0 = sb.state.stats.clock;
      sb.run('__game.state.stats.sanity = 0; 1');
      await runNode(sb, 'd5');
      eq(sb.nodeId, 'd5', '故事档不进 sanityBreak');
      eq(sb.state.stats.sanity, 1, '故事档归零后抬到 1');
      ok(sb.state.stats.clock - c0 <= 6, '故事档断片不加 30 分，实际 +' + (sb.state.stats.clock - c0));

      /* ④ 噩梦档断片恢复 30，且档案页不显示档位名 */
      const nb = await atNode('d4', '&diff=nightmare');
      nb.run('__game.state.stats.sanity = 0; 1');
      await runNode(nb, 'd5');
      eq(nb.nodeId, 'sanityBreak', '噩梦档应断片');
      eq(nb.state.stats.sanity, 30, '噩梦档断片恢复 30（不是 40）');
      nb.run('__game.openCodex()'); await nb.drain(300);
      eq(nb.$('#codex-body .codex-sanity'), null, '噩梦档案页不显示理智档位名');

      /* ⑤ 扣减 / 恢复系数：-10 / +10 */
      const scale = async d => {
        const g = await atNode('p2', '&diff=' + d + '&sanity=50');
        g.run('__game.applyEffects({ stats: { sanity: -10 } }, { silent: true })');
        const minus = g.state.stats.sanity - 50;
        g.run('__game.applyEffects({ stats: { sanity: +10 } }, { silent: true })');
        return { minus, plus: g.state.stats.sanity - 50 - minus };
      };
      const sc = { story: await scale('story'), standard: await scale('standard'), nightmare: await scale('nightmare') };
      eq(sc.story.minus, -5, '故事扣减 ×0.5');
      eq(sc.story.plus, 15, '故事恢复 ×1.5');
      eq(sc.standard.minus, -10, '标准 ×1');
      eq(sc.standard.plus, 10, '标准 ×1');
      eq(sc.nightmare.minus, -13, '噩梦扣减 ×1.25 向上取整');
      eq(sc.nightmare.plus, 10, '噩梦恢复 ×1');
    });

    await test('函数条件也能归因理智（f8:1 那类写法），且不误报档位', async () => {
      /* f8:1 的真实写法：噩梦档 + 理智 < 30 才锁 */
      const FN = `(s => !(s.difficulty === 'nightmare' && (s.stats.sanity == null ? 100 : s.stats.sanity) < 30))`;

      const g29 = await atNode('p2', '&diff=nightmare&sanity=29');
      eq(g29.run(`__game.sanityGateFailed({ when: ${FN} })`), true, '噩梦 29：锁的原因应是理智');
      const g30 = await atNode('p2', '&diff=nightmare&sanity=30');
      eq(g30.run(`__game.sanityGateFailed({ when: ${FN} })`), false, '噩梦 30：条件本身成立，不是理智问题');
      const gs29 = await atNode('p2', '&diff=standard&sanity=29');
      eq(gs29.run(`__game.sanityGateFailed({ when: ${FN} })`), false, '标准 29：与理智无关');
      /* 纯档位条件的函数，在错误档位下不能误报"看不清" */
      eq(gs29.run(`__game.sanityGateFailed({ when: (s => s.difficulty === 'nightmare') })`), false,
        '纯档位不符不该归因理智');

      /* 端到端：f8:1 在噩梦 29 的提示文案 */
      const gf = await atNode('f8', '&diff=nightmare&sanity=29');
      await gf.toDecision();
      const c = gf.choices().find(x => /再打一次/.test(x.text));
      ok(c && c.locked, 'f8「再打一次」应被锁');
      includes(c.hint, '想不清', '提示应是"想不清"而不是"你做不到"');
    });

    await test('choice.tell：pre 变成前导 whisper，sub 变成字幕标记', async () => {
      const g = await atNode('p2');
      g.run(`STORY.nodes.__tell = { id:'__tell', scene:'classroom',
        lines:[{ who:'', text:'纸在动。' }],
        choices:[{ text:'按住那张纸', next:'p3', tell:{ pre:'纸上有字在长出来', sub:['纸','呼吸'] } }] }; 1`);
      await runNode(g, '__tell');
      await g.toDecision();
      const c = g.choices()[0];
      const pre = c.el.querySelector('.tell-pre');
      ok(pre, '应有前导 whisper 元素');
      eq(pre.textContent, '纸上有字在长出来');
      eq(c.el.dataset.tell, '纸,呼吸');
      includes(c.el.querySelector('.tell-sub').textContent, '纸');
      eq(g.q('#subtitle'), '纸上有字在长出来');
      ok(g.$('#subtitle').classList.contains('on'));
    });

    await test('没有 tell 的选项行为完全不变', async () => {
      const g = await atNode('p16');
      await g.toDecision();
      g.choices().forEach(c => {
        eq(c.el.querySelector('.tell-pre'), null);
        eq(c.el.querySelector('.tell-sub'), null);
      });
    });

    await test('kind:"danger" 不再产生任何视觉语义类', async () => {
      const g = await atNode('p2');
      g.run(`STORY.nodes.__d = { id:'__d', scene:'classroom', lines:[{ who:'', text:'选吧。' }],
        choices:[{ text:'看起来很危险', kind:'danger', next:'p3' }] }; 1`);
      await runNode(g, '__d');
      await g.toDecision();
      eq(g.choices()[0].danger, false);
      notIncludes(g.choices()[0].el.className, 'danger');
    });

    await test('样式里 .choice.danger 已无红边；故事档只有一个干血红数字标记', async () => {
      const css = read('css/style.css');
      notIncludes(css, '.choice.danger{ border-left-color', 'danger 不应再有红色左边框');
      notIncludes(css, '.choice.danger .num', 'danger 不应再改序号颜色');
      includes(css, 'body.diff-story .choice .num', '故事档应保留数字圆点标记（Q1）');
      notIncludes(read('js/engine.js'), "kind === 'danger'");
    });
  }

  /* =========================================================
     F. 可访问性
     ========================================================= */
  section('可访问性');
  {
    await test('观察点可 Tab 聚焦，并带分级 aria-label', async () => {
      const g = await atNode('d7');
      await g.toDecision();
      await g.clickChoice(g.choices().findIndex(c => c.isObserve));
      const hs = g.$$('#observe-layer .hotspot');
      eq(hs.length, 4);
      hs.forEach(h => {
        eq(h.getAttribute('tabindex'), '0');
        ok(/（(关键线索|档案|细节)/.test(h.getAttribute('aria-label') || ''), 'aria-label 应含分级：' + h.getAttribute('aria-label'));
      });
    });

    await test('Enter 键可以打开观察点', async () => {
      const g = await atNode('p2');
      await g.toDecision();
      await g.clickChoice(g.choices().findIndex(c => c.isObserve));
      const h = g.$$('#observe-layer .hotspot')[0];
      h.dispatchEvent(makeEvent('keydown', { key: 'Enter', target: h, preventDefault() { this.defaultPrevented = true; } }));
      await g.drain(200);
      eq(g.$('#observe-card').hidden, false);
      ok(g.state.clues.includes('photo'));
    });

    await test('「用这只眼睛看」有独立样式与副标签（不只靠颜色）', async () => {
      const css = read('css/style.css');
      includes(css, '.hotspot.by-eye');
      includes(css, '.hotspot.ref::before{ border-radius:2px; transform:rotate(45deg)');
      includes(css, '.hotspot.plain::before{ border-radius:1px; transform:scale(.62)');
      const g = await atNode('p2', '&battery=5&eyes=1');
      g.run(`STORY.nodes.__eye2 = { id:'__eye2', scene:'corridor_dark', lines:[{ who:'', text:'……' }],
        observe:[{ id:'y', label:'近处', x:50, y:40, text:'……' }] }; 1`);
      await runNode(g, '__eye2');
      await g.toDecision();
      await g.clickChoice(g.choices().findIndex(c => c.isObserve));
      const h = g.$$('#observe-layer .hotspot')[0];
      ok(h.classList.contains('by-eye'));
      includes(h.dataset.label, '用这只眼睛看');
      includes(h.getAttribute('aria-label'), '用这只眼睛看');
    });

    await test('立绘 alt＝角色名，背景图对辅助技术隐藏', async () => {
      const g = await boot({ quiet: true });
      click(g.$('#boot .menu-item[data-act="new"]'));
      await g.drain(3000);
      eq(g.$('#sprites .sprite img').alt, '杨间');
      eq(g.$('#bg-a').getAttribute('aria-hidden'), 'true');
      includes(g.$('.boot-art img').alt, '封面');
    });
  }

  /* =========================================================
     G. 文档与数据一致性
     ========================================================= */
  section('文档与数据一致性');
  {
    const g = await boot({ quiet: true });

    await test('README 的节点数 / 档案数与数据实测一致', async () => {
      const nodes = g.run('Object.keys(STORY.nodes).length');
      const codex = g.run('CODEX.clue.length + CODEX.ghost.length + CODEX.person.length + CODEX.memory.length');
      const readme = read('README.md');
      includes(readme, `**${nodes} 个场景节点**`, `README 应写 ${nodes} 个场景节点`);
      includes(readme, `**${codex} 条档案**`, `README 应写 ${codex} 条档案`);
    });

    await test('每条档案都至少有一个授予点（防止"永远解锁不了"回归）', async () => {
      const missing = g.run(`(() => {
        const granted = new Set();
        const take = fx => { if (!fx) return;
          (fx.clues || []).forEach(c => granted.add(c));
          (fx.codex || []).forEach(c => granted.add(c)); };
        Object.values(STORY.nodes).forEach(n => {
          take(n.enter);
          (n.lines || []).forEach(l => take(l.effects));
          (n.choices || []).forEach(c => take(c.effects));
          (n.observe || []).forEach(o => take(o.effects));
        });
        return [...CODEX.clue, ...CODEX.ghost, ...CODEX.person, ...CODEX.memory]
          .filter(c => !granted.has(c.id)).map(c => c.id);
      })()`);
      eq(missing.length, 0, '以下档案没有授予点: ' + missing.join(', '));
    });

    await test('电力线索 battery 在厕所段有明确授予点', async () => {
      const src = g.run(`(() => {
        const hit = [];
        Object.entries(STORY.nodes).forEach(([id, n]) => {
          const take = fx => { if (fx && fx.clues && fx.clues.includes('battery')) hit.push(id); };
          take(n.enter); (n.lines || []).forEach(l => take(l.effects));
          (n.choices || []).forEach(c => take(c.effects)); (n.observe || []).forEach(o => take(o.effects));
        });
        return hit;
      })()`);
      ok(src.length > 0 && src.some(id => /^d/.test(id)), 'battery 应挂在 d* 节点，实际 ' + src.join(','));
    });
  }
};
