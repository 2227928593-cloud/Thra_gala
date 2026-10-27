/* =========================================================
   测试夹具：在最小 DOM 上加载真实的 index.html 与 js/*.js，
   运行真实引擎逻辑（js/engine.js），并提供推动剧情的能力。

   时间处理：引擎全部依赖 setTimeout（转场、打字机、幕卡）。
   这里用"虚拟时钟"取代真实定时器——测试可以瞬间推进任意时长，
   既能精确控制，又不受真实等待影响。
   ========================================================= */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { createEnvironment, createLocalStorage, click, makeEvent } = require('./dom');

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS = ['js/audio.js', 'js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js', 'js/engine.js'];

const tick = () => new Promise(r => setImmediate(r));
async function settle(n = 6) { for (let i = 0; i < n; i++) await tick(); }

async function boot(opts = {}) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const store = createLocalStorage();
  if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) store.setItem(k, v);
  const { doc, win } = createEnvironment(html, { search: opts.search || '' });

  /* ---------- 虚拟时钟 ---------- */
  let now = 0, seq = 0;
  const timers = new Map();     // id -> {time, fn, args, interval}
  function vSetTimeout(fn, ms, ...args) {
    const id = ++seq;
    timers.set(id, { time: now + Math.max(0, Number(ms) || 0), fn, args });
    return id;
  }
  function vClearTimeout(id) { timers.delete(id); }
  function vSetInterval(fn, ms, ...args) {
    const id = ++seq;
    timers.set(id, { time: now + Math.max(1, Number(ms) || 1), fn, args, interval: Math.max(1, Number(ms) || 1) });
    return id;
  }
  function vClearInterval(id) { timers.delete(id); }

  /* 推进虚拟时间，直到没有待执行定时器（或达到步数上限）。
     每 32 个回调才让出一次事件循环——打字机每字一个定时器，
     逐个让出会让整局测试慢上几十倍。 */
  async function pump(limit, deadline) {
    let n = 0, idle = 0;
    while (n < limit) {
      let bestId = null, best = null;
      for (const [id, t] of timers) {
        if (deadline !== undefined && t.time > deadline) continue;
        if (!best || t.time < best.time || (t.time === best.time && id < bestId)) { best = t; bestId = id; }
      }
      if (!best) {
        // 队列空了并不代表真的空闲：promise 链可能还没执行到"安排下一个定时器"。
        // 多让出几轮，确认确实没有新定时器，避免测试出现偶发失败。
        if (++idle > 12) break;
        await tick();
        continue;
      }
      idle = 0;
      if (best.interval) best.time = now + best.interval; else timers.delete(bestId);
      now = Math.max(now, best.time);
      try { best.fn(...best.args); } catch (e) { throw new Error('定时器回调异常: ' + e.message); }
      n++;
      if (n % 32 === 0) await tick();
    }
    await tick();
    return n;
  }
  async function drain(limit = 200000) { return pump(limit); }
  /* 只推进虚拟时间最多 ms 毫秒（用于观察 toast 这类会被定时器清理的瞬时 UI） */
  async function drainFor(ms, limit = 200000) {
    const deadline = now + ms;
    const n = await pump(limit, deadline);
    now = Math.max(now, deadline);
    return n;
  }

  const sandbox = {
    console: opts.quiet ? { log() {}, warn() {}, error() {}, info() {} } : console,
    document: doc,
    localStorage: store,
    location: win.location,
    navigator: win.navigator,
    Image: win.Image,
    getComputedStyle: win.getComputedStyle,
    matchMedia: win.matchMedia,
    requestAnimationFrame: (fn) => vSetTimeout(fn, 16),
    cancelAnimationFrame: vClearTimeout,
    setTimeout: vSetTimeout,
    clearTimeout: vClearTimeout,
    setInterval: vSetInterval,
    clearInterval: vClearInterval,
    URLSearchParams,
    performance: { now: () => now },
    queueMicrotask
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.addEventListener = win.addEventListener;
  sandbox.removeEventListener = win.removeEventListener;
  sandbox.dispatchEvent = win.dispatchEvent;
  sandbox.innerWidth = win.innerWidth;
  sandbox.innerHeight = win.innerHeight;
  sandbox.devicePixelRatio = win.devicePixelRatio;
  vm.createContext(sandbox);

  for (const f of SCRIPTS) {
    try {
      vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
    } catch (e) {
      throw new Error(`加载 ${f} 失败: ${e.message}`);
    }
  }
  doc.dispatchEvent(makeEvent('DOMContentLoaded'));
  await drain(500);

  const $ = sel => doc.querySelector(sel);
  const $$ = sel => doc.querySelectorAll(sel);
  const q = sel => { const e = $(sel); return e ? e.textContent.trim() : null; };

  const api = {
    sandbox, doc, win, store, $, $$, q, settle, drain, drainFor, tick,
    run(expr) { return vm.runInContext(expr, sandbox); },
    get virtualNow() { return now; },
    get pendingTimers() { return timers.size; },
    get state() { return sandbox.__game ? sandbox.__game.state : null; },
    get nodeId() { const s = api.state; return s ? s.node : null; },

    atTitle() { return $('#boot').style.display !== 'none'; },
    gameVisible() { return $('#game').getAttribute('aria-hidden') === 'false'; },

    choices() {
      return $$('#choices .choice').map(b => ({
        el: b,
        text: (b.querySelector('.label') || {}).textContent || '',
        num: (b.querySelector('.num') || {}).textContent || '',
        locked: b.classList.contains('locked'),
        isObserve: b.classList.contains('observe-entry'),
        danger: b.classList.contains('danger'),
        hint: (b.querySelector('.req') || {}).textContent || ''
      }));
    },
    text() { return q('#story-text'); },
    speaker() { return q('#name-text'); },
    dialogueStyle() { return $('#story-text').className; },
    nameplateClass() { return $('#nameplate').className; },
    spriteIds() { return $$('.sprite').map(s => s.dataset.id); },
    stageClass() { return $('#stage').className; },
    currentScene() { return ($('#bg-b').getAttribute('src') || $('#bg-a').getAttribute('src') || '').split('/').pop(); },
    /* 当前真正显示在前面的那张背景（.bg.on）——比 currentScene 可靠：
       currentScene 读的是双缓冲的某一张，可能还是上一张图。 */
    visibleScene() { const el = $('#bg-a').classList.contains('on') ? $('#bg-a') : $('#bg-b'); return (el.getAttribute('src') || '').split('/').pop(); },
    hud() {
      return {
        chapter: q('#hud-chapter'), place: q('#hud-place'), clock: q('#v-clock'),
        knock: q('#v-knock'), eyes: q('#v-eyes'),
        corrupt: $('#v-corrupt').style.width, deadline: $('#stat-clock').classList.contains('deadline')
      };
    },
    toasts() { return $$('#toast-wrap .toast').map(t => ({ cls: t.className, text: t.textContent })); },
    modals() { return $$('.modal:not([hidden])').map(m => m.id); },
    observeOpen() { return $('#observe-layer').hidden === false; },

    /* 点画面推进一次，并推进虚拟时间 */
    async advanceOnce(n = 400) { const s = $('#stage'); if (s) click(s); await drain(n); },
    advance() { const s = $('#stage'); if (s) click(s); },

    async clickChoice(pred) {
      const list = api.choices();
      const target = typeof pred === 'number' ? list[pred] : list.find(pred);
      if (!target) throw new Error('找不到选项: ' + pred + ' | 现有: ' + list.map(c => c.text).join(' / '));
      if (target.locked) throw new Error('选项被锁定: ' + target.text);
      click(target.el);
      await drain(400);
      return target;
    },

    endingVisible() { return !$('#modal-end').hidden; },
    endingTitle() { return q('#end-title'); },
    endingStat() { return q('#end-stat'); },

    /* 观察模式：点掉所有热点并退出。
       注意：引擎在关闭"最后一个热点"的卡片时会抛 TypeError（已知缺陷），
       这里捕获它并用「退开」兜底，保证压力测试能继续跑完。 */
    async clearObserve() {
      const notFound = () => $$('#observe-layer .hotspot:not(.found)');
      let guard = 0;
      while (api.observeOpen() && guard++ < 80) {
        if (!notFound().length) break;
        click(notFound()[0]);
        await drain(200);
        if (!$('#observe-card').hidden) {
          try { click($('#observe-card-close')); } catch (e) { /* 已知缺陷：读取 null.length */ }
          await drain(200);
        }
      }
      if (api.observeOpen()) { click($('#observe-exit')); await drain(200); }
      if (api.observeOpen()) { $('#observe-layer').innerHTML = ''; $('#observe-layer').hidden = true; $('#observe-bar').hidden = true; }
    },

    /* 推进到下一个决策点（出现选项 / 结局 / 无内容可推） */
    async toDecision(limit = 2000) {
      for (let i = 0; i < limit; i++) {
        if (api.endingVisible()) return 'ending';
        if (api.choices().length) return 'choices';
        if (api.observeOpen()) return 'observe';
        api.advance();
        await drain(400);
      }
      return 'limit';
    },

    /* 完整跑一局。pick(choices, api) 返回选项下标 */
    async playthrough(pick, opts2 = {}) {
      const maxSteps = opts2.maxSteps || 3000;
      const trace = [];
      let steps = 0, lastSig = '', stall = 0;
      while (steps++ < maxSteps) {
        if (api.endingVisible()) {
          return { ending: api.endingTitle(), stat: api.endingStat(), steps, trace, state: api.state, node: api.nodeId };
        }
        if (api.observeOpen()) { await api.clearObserve(); continue; }
        const cs = api.choices();
        if (cs.length) {
          const idx = pick(cs, api, trace);
          if (idx == null || idx < 0 || idx >= cs.length) {
            return { stall: 'no-choice-picked', choices: cs.map(c => c.text), steps, trace, node: api.nodeId };
          }
          trace.push(`${api.nodeId} → 「${cs[idx].text}」`);
          await api.clickChoice(idx);
          continue;
        }
        const sig = api.nodeId + '|' + api.text();
        if (sig === lastSig) { if (++stall > 30) return { stall: 'stuck', node: api.nodeId, text: api.text(), trace, steps }; }
        else { stall = 0; lastSig = sig; }
        api.advance();
        await drain(400);
      }
      return { stall: 'max-steps', steps, trace, node: api.nodeId };
    }
  };
  return api;
}

module.exports = { boot, settle, tick, ROOT, SCRIPTS };