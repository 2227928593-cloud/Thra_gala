/* =========================================================
   恐怖复苏 · 敲门  —  引擎
   纯前端、无依赖、可离线；存档写入 localStorage。
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 常量 ---------- */
  const SAVE_KEY        = 'thragal.save.v1';        // 自动槽：沿用旧键名，旧存档必须能直接读
  const SAVE_MANUAL_KEY = 'thragal.save.manual.v1'; // 手动槽：只有标准/故事档会写
  const UNLOCK_KEY      = 'thragal.unlock.v1';
  const SETTING_KEY     = 'thragal.settings.v1';
  const SAVE_VERSION    = 2;
  /* 观察一处的代价 —— 「标准档」的基准值，实际按难度倍率 + 取整规则缩放（见 scaleCost）。
     设计依据：design/gdd/difficulty-redesign.md §4.1 / §6.1 */
  const OBSERVE_COST = { clock: 6, knock: 1, battery: 5 };
  /* 一个节点（一屏台词）的基础耗时，同样是标准档基准 */
  const NODE_COST_CLOCK = 4;
  /* 电量分级：低于 30% 看得少了，低于 10% 只剩最关键的那几处 */
  const BATTERY_LOW = 30, BATTERY_CRIT = 10;
  /* 电量低时还能看见的比例（至少留 1 处，避免"完全不能观察"这种死路） */
  const BATTERY_VISIBLE = { ok: 1, low: 0.7, crit: 0.4 };
  /* 时间线：从 startClock 起算的经过分钟数。绝不能用 clock % 1440 做预算判断，
     否则 05:31 会被算成"还剩 23 小时"（设计文档 §10.3 点名的坑）。 */
  const CLOCK_DEADLINE = '05:30';
  const CLOCK_NIGHT_LATE = '03:00';
  let knockTimer = null, knockTierLast = 0;
  let charged = 0;                 // 最近一次 chargeNodeClock 扣掉的分钟数（断片改写时退还）

  /* =========================================================
     难度档位
     ---------------------------------------------------------
     硬原则（设计文档 §6.1 末注）：
       **难度 = 倍率 + 取整规则**，不要逐档硬编码每个节点的数值。
     表里出现的 4/6/8 分、3/5/7% 都是 scaleCost(基准 × mul, roundMode) 算出来的。
     档位只改引擎参数；哪句话被锁、哪个结局触发，永远由 flag / 线索决定。
     ========================================================= */
  /* 死亡结局清单（§12.5，两档共用）。e_eighth / e_alone 不算死：
     "你活着，只是丢了一个人"——回滚会让这份代价消失。 */
  const DEATH_ENDINGS = ['e_door', 'e_stairs', 'e_written', 'e_absorb'];

  const DIFFICULTY = {
    story: {
      id: 'story', name: '故事', short: '故事', tier: 0,
      desc: '代价更轻、提示更全。想先把这一夜看完，选这个。',
      mul: 0.75, round: 'down',
      /* 节点耗时：显式表，不用倍率乘（§12.1 终值）。pace 可覆盖：
           walk（序幕–三幕）4 / run（四幕）2 / still（终幕）0 */
      nodeClock: { walk: 4, run: 2, still: 0 },
      /* 每看一处累计的敲门值：0.5 = 每 2 处 +1（累计取整，见设计 §10.3） */
      knockPerObs: 0.5,
      knock:    { warn: 10, danger: 13, k13: null },   // 故事档不触发 k13
      corruption: { power: 25, sacrifice: 60, brk: 95 },
      eyeLight: { 1: 2, 2: 3 },                        // 用鬼眼照明：复苏 +2 / +3
      lightRange: 20,                                  // 电量 ≥20% 才敢用手机照 light:2
      hints:    { cost: true, keyCount: true },
      observe:  { dimWhenLow: false, alwaysVisible: true },
      save:     { auto: true, manual: true, restart: true },
      death:    { mode: 'none', endings: [], penalty: {}, maxRollback: 0 },
      markers:  { choiceDanger: true }                 // Q1：故事档保留一个干血红圆点
    },
    standard: {
      id: 'standard', name: '标准', short: '标准', tier: 1,
      desc: '设计意图。电量会真的见底，看不全就只能猜。',
      mul: 1, round: 'nearest',
      nodeClock: { walk: 6, run: 3, still: 0 },
      knockPerObs: 1,
      knock:    { warn: 9, danger: 12, k13: 13 },
      corruption: { power: 30, sacrifice: 60, brk: 85 },
      eyeLight: { 1: 3, 2: 5 },
      lightRange: 30,
      hints:    { cost: true, keyCount: true },
      observe:  { dimWhenLow: true, alwaysVisible: false },
      save:     { auto: true, manual: false, restart: true },
      death:    { mode: 'rollback', endings: DEATH_ENDINGS, penalty: {}, maxRollback: 5 },
      markers:  { choiceDanger: false }
    },
    nightmare: {
      id: 'nightmare', name: '噩梦', short: '噩梦', tier: 2,
      desc: '选择即承诺：不能手动存、不能回退，死一次要付敲门和同伴。',
      mul: 1.25, round: 'up',
      nodeClock: { walk: 7, run: 4, still: 0 },
      knockPerObs: 2,
      knock:    { warn: 8, danger: 10, k13: 11 },
      corruption: { power: 30, sacrifice: 55, brk: 75 },
      eyeLight: { 1: 5, 2: 8 },
      lightRange: 45,
      hints:    { cost: false, keyCount: false },
      observe:  { dimWhenLow: true, alwaysVisible: false },
      save:     { auto: true, manual: false, restart: false },
      death:    { mode: 'rollback', endings: DEATH_ENDINGS, penalty: { knock: 3, survivors: -1 }, maxRollback: 3 },
      markers:  { choiceDanger: false }
    }
  };
  /* 'normal' 是早期命名，读旧存档/旧设定时当作 standard */
  const DIFF_ALIAS = { normal: 'standard' };
  const DIFF_ORDER = ['story', 'standard', 'nightmare'];

  /* 倍率 + 取整：**只用于观察代价**（4/6/8 分、3/5/7%）。
     节点耗时用显式表 nodeClock（§12.1 终值 4/6/7），不乘倍率——
     否则标准档"前三幕随便看、四幕没得看"的设计意图会被抹平。 */
  function scaleCost(base, d) {
    const raw = base * (d || runDiff()).mul;
    const mode = (d || runDiff()).round;
    const v = mode === 'down' ? Math.floor(raw) : mode === 'up' ? Math.ceil(raw) : Math.round(raw);
    return Math.max(1, v);
  }

  /* 档位 id 归一：'normal' 是早期命名，旧设定/旧存档里可能出现 */
  function normDiff(id) {
    if (!id) return null;
    const key = DIFF_ALIAS[id] || id;
    return DIFFICULTY[key] ? key : null;
  }

  /* 资源见底 → 统一钩子。默认只写日志 + 给一句叙事提示，
     不扣血、不判死：要不要"归零即死"是剧情设计的事，不是引擎的事。 */
  const RESOURCE_EMPTY = {
    battery:    { test: v => v <= 0,   text: '手机黑屏了。你手里只剩一块比夜色更硬的塑料。' },
    corruption: { test: v => v >= runDiff().corruption.brk, text: '你听见自己的呼吸变成了两个人的。它在你身体里睁开了眼睛。' }
  };
  const HOOKS = { resourceEmpty: [] };
  const ART = {
    scene: id => `art/scenes/${id}.jpg`,
    char:  id => `art/characters/${id}.webp`,
    ending: id => `art/endings/${id}.jpg`,
    ui:    id => `art/ui/${id}`
  };

  /* ---------- 状态 ---------- */
  /* 系统级"减少动效"是默认值，用户在设定里手动改过就以用户为准（stored 覆盖 default）。 */
  const SYS_REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const settings = Object.assign({
    volume: 70, ambience: 60, speed: 32, fx: true, reduced: SYS_REDUCED, hotspots: false,
    difficulty: 'standard'
  }, loadJSON(SETTING_KEY, {}));
  settings.difficulty = normDiff(settings.difficulty) || 'standard';

  let state = null;          // 当前进度
  let node = null;           // 当前节点对象
  let lineIndex = 0;
  let typing = false;
  let typeTimer = null;
  let advanceResolve = null;
  let busy = false;
  let playGen = 0;       // 台词播放代际（见 playFrom）
  let observeMode = false;
  let pendingLineSkip = 0;

  let unlock = Object.assign({ endings: [], codex: [], seen: [] }, loadJSON(UNLOCK_KEY, {}));
  const NAME2ID = {};
  Object.keys(CHARACTERS).forEach(id => { NAME2ID[CHARACTERS[id].name] = id; });

  /* 哪些线索是"被选项需要的"——从剧情里反推，用来给观察点分级：
     key（关键线索，青色）/ ref（档案、记忆碎片，金色）/ plain（氛围细节，灰白） */
  const REQUIRED_CLUES = (() => {
    const set = new Set();
    const grab = c => {
      if (!c || typeof c !== 'object') return;
      if (c.clue) set.add(c.clue);
      if (c.allClues) c.allClues.forEach(x => set.add(x));
    };
    Object.keys(STORY.nodes).forEach(k => {
      const n = STORY.nodes[k];
      (n.choices || []).forEach(ch => grab(ch.when));
      (n.lines || []).forEach(l => grab(l.when));
    });
    return set;
  })();

  function hotspotTier(o) {
    const fx = o.effects || {};
    if (fx.clues && fx.clues.some(c => REQUIRED_CLUES.has(c))) return 'key';
    if ((fx.codex && fx.codex.length) || (fx.clues && fx.clues.length)) return 'ref';
    return 'plain';
  }

  /* ---------- 小工具 ---------- */
  function loadJSON(k, d) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function fmtClock(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  }
  function toMinutes(str) {
    const [h, m] = str.split(':').map(Number); return h * 60 + m;
  }

  /* =========================================================
     初始化
     ========================================================= */
  function init() {
    applySettings();
    bindGlobal();
    refreshBoot();
    preloadBase();
    window.addEventListener('beforeunload', () => { if (state) persist(); });
  }

  function applySettings() {
    document.body.classList.toggle('reduced', !!settings.reduced);
    /* 用户手动关掉减动效时，允许覆盖系统的 prefers-reduced-motion */
    document.body.classList.toggle('motion-ok', !settings.reduced);
    document.body.classList.toggle('no-fx', !settings.fx);
    $('#set-volume').value = settings.volume;
    $('#set-ambience').value = settings.ambience;
    $('#set-speed').value = settings.speed;
    $('#set-fx').checked = !!settings.fx;
    $('#set-reduced').checked = !!settings.reduced;
    $('#set-hotspots').checked = !!settings.hotspots;
    const sel = $('#set-difficulty');
    if (sel) sel.value = settings.difficulty;
    if (window.Sound) {
      Sound.setVolume(settings.volume / 100);
      Sound.setAmbience(settings.ambience / 100);
    }
    updateDiffChip();
  }

  /* 当前这一局的档位：开局时写进 state.difficulty，之后与存档一起走。
     标题页/设定里的 settings.difficulty 是默认值 + 持久化载体。 */
  function runDiff() {
    const id = (state && normDiff(state.difficulty)) || normDiff(settings.difficulty) || 'standard';
    return DIFFICULTY[id];
  }

  function updateDiffChip() {
    const d = runDiff();
    const el = $('#v-diff');
    if (el) el.textContent = d.short;
    const chip = $('#stat-diff');
    if (chip) {
      chip.title = `${d.name}档 · ${d.desc}`;
      chip.className = 'stat diff-stat diff-' + d.id;
    }
    /* 故事档的"干血红圆点"是唯一保留的选项标记（Q1），靠 body 上的档位类切换 */
    DIFF_ORDER.forEach(id => document.body.classList.toggle('diff-' + id, d.id === id));
    const note = $('#menu-note');
    if (note) note.textContent = saveRuleText(d);
    syncMenuActions();
  }

  /* 暂停菜单按档位增减入口（设计 §6.3 / Q3）：
       故事：保存进度 / 读取进度 / 回到本节点开头（走 nk，精确到节点）
       标准：回到本场景开头（走 ck，场景锚点——名与实必须一致）
       噩梦：都不给（选择即承诺）
     另外复苏 ≥70 时给一次「压住它」的缓冲（Q5）。 */
  function syncMenuActions() {
    const d = runDiff();
    const set = (act, on) => $$('#modal-menu [data-act="' + act + '"]').forEach(b => { b.hidden = !on; });
    set('save', !!d.save.manual);
    set('load', !!d.save.manual);
    set('restart', !!d.save.restart);
    /* 文案必须与实现一致：故事档走 nk（节点锚点），标准档走 ck（场景锚点） */
    $$('#modal-menu [data-act="restart"]').forEach(b => { b.textContent = restartLabel(d); });
    set('press', !!state && (state.stats.corruption || 0) >= 70
      && (state.stats.survivors || 0) > 0 && !state.flags.__pressed_corruption);
  }

  /* 「回到本…开头」的准确措辞：故事档精确到节点，标准档只到场景 */
  function restartLabel(d) {
    return (d || runDiff()).id === 'story' ? '回到本节点开头' : '回到本场景开头';
  }

  /* Q5 的缓冲：消耗 1 名同伴，把复苏压回 70（一局一次） */
  function pressCorruption() {
    if (!state) return false;
    if (state.flags.__pressed_corruption) { toast('这一夜你只能按一次。', 'warn'); return false; }
    if ((state.stats.survivors || 0) <= 0) { toast('没有人能替你按住它。', 'warn'); return false; }
    state.flags.__pressed_corruption = true;
    state.stats.survivors = Math.max(0, (state.stats.survivors || 0) - 1);
    state.stats.corruption = 70;
    closeAllModals();
    toast('你按住了它——用掉了一个人。复苏回到 70%。', 'warn');
    updateHUD(true);
    persist(false);
    return true;
  }

  function saveRuleText(d) {
    if (!d.save.manual && !d.save.restart) {
      return `${d.name}档：每进入一个节点自动覆盖存档。不能手动保存、不能回退；死一次要付敲门与同伴。`;
    }
    if (!d.save.manual) {
      return `${d.name}档：每进入一个节点自动存档；不能手动保存，但可以「回到本场景开头」（回退整段场景的进度）。`;
    }
    return `${d.name}档：每进入一个节点自动存档；也可以手动保存、读取进度，或回到本节点开头。`;
  }

  function preloadBase() {
    ['room_night', 'classroom'].forEach(id => { const i = new Image(); i.src = ART.scene(id); });
  }

  function refreshBoot() {
    const save = migrateSave(loadJSON(SAVE_KEY, null));
    const btn = $('#btn-continue');
    if (save && STORY.nodes[save.node]) {
      btn.disabled = false;
      const n = STORY.nodes[save.node];
      const d = DIFFICULTY[save.difficulty] || DIFFICULTY.standard;
      $('#continue-meta').textContent = `${d.short} · ${n.chapter || ''} · ${fmtClock(save.stats.clock)}`;
    } else {
      btn.disabled = true;
      $('#continue-meta').textContent = '没有存档';
    }
    updateDiffChip();
    $('#gallery-meta').textContent = `${unlock.endings.length} / ${ENDINGS.length}`;
    /* 走过一次之后，标题上才多出「重走这一夜」——新玩家看到的仍是 5 项 */
    const n = unlock.endings.length;
    let ngBtn = $('#btn-ng');
    if (n > 0 && !ngBtn) {
      ngBtn = document.createElement('button');
      ngBtn.className = 'menu-item ng';
      ngBtn.id = 'btn-ng';
      ngBtn.dataset.act = 'ng';
      ngBtn.innerHTML = '重走这一夜<span id="ng-meta"></span>';
      ngBtn.title = '带着上一次的记忆再走一遍：档案与线索图继承，会多出只走过一次才看得见的旁白与选项。';
      const first = $('#boot .menu-item');
      first.parentNode.insertBefore(ngBtn, first.nextSibling);
      ngBtn.addEventListener('click', () => startNew(true));
    }
    if (ngBtn && n > 0) {
      $('#ng-meta').textContent = `第 ${n + 1} 次`;
      const foot = $('#boot-foot');
      if (foot) foot.textContent = `建议佩戴耳机 · 全程可存档 · 含 ${ENDINGS.length} 个结局 · 已逃出 ${n} 次，可重走这一夜`;
    }
  }

  /* =========================================================
     事件绑定
     ========================================================= */
  function bindGlobal() {
    // 启动菜单
    $$('#boot .menu-item').forEach(b => {
      b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'new') startNew();
        else if (act === 'ng') startNew(true);
        else if (act === 'continue') continueGame();
        else if (act === 'codex') openCodex();
        else if (act === 'gallery') openGallery();
        else if (act === 'settings') openModal('#modal-settings');
      });
    });

    // HUD
    $('#btn-codex').addEventListener('click', () => openCodex());
    $('#btn-menu').addEventListener('click', () => openModal('#modal-menu'));
    $('#btn-sound').addEventListener('click', toggleSound);

    // 点击推进
    $('#stage').addEventListener('click', e => {
      if (e.target.closest('button, .choice, .hotspot, .observe-card, .modal')) return;
      if ($$('.modal:not([hidden])').length) return;
      if (observeMode) return;
      advance();
    });

    // 键盘
    document.addEventListener('keydown', e => {
      if (!$('#confirm').hidden) {
        if (e.key === 'Escape') closeConfirm(false);
        return;
      }
      if ($$('.modal:not([hidden])').some(m => m.id !== 'modal-menu')) {
        if (e.key === 'Escape') $$('.modal:not([hidden])').forEach(m => closeModal(m));
        return;
      }
      const openModalEl = $$('.modal:not([hidden])')[0];
      if (openModalEl) {
        if (e.key === 'Escape') closeModal(openModalEl);
        return;
      }
      if ($('#game').getAttribute('aria-hidden') === 'true') return;

      if (e.key === ' ' || e.key === 'Enter') {
        if (observeMode) return;
        e.preventDefault();
        advance();
      } else if (/^[1-9]$/.test(e.key)) {
        if (observeMode) return;
        /* 按"显示编号"找，而不是"第 N 个未锁按钮"（锁定项会让两者错位） */
        const btn = $$('.choice:not(.locked)').find(b => b.dataset.num === String(e.key));
        if (btn) btn.click();
      } else if (e.key === 'o' || e.key === 'O') {
        const ob = $('#choices .choice.observe-entry');
        if (ob) ob.click();
      } else if (e.key === 'c' || e.key === 'C') {
        openCodex();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === 'Escape') {
        openModal('#modal-menu');
      }
    });

    // 弹层关闭
    $$('.modal').forEach(m => {
      m.addEventListener('click', e => {
        if (e.target === m) closeModal(m);
        else if (e.target.closest('[data-close]')) closeModal(m);
      });
    });

    // 暂停菜单
    $$('#modal-menu [data-act]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'resume') closeModal($('#modal-menu'));
      else if (act === 'codex') { closeModal($('#modal-menu')); openCodex(); }
      else if (act === 'gallery') { closeModal($('#modal-menu')); openGallery(); }
      else if (act === 'settings') { closeModal($('#modal-menu')); openModal('#modal-settings'); }
      else if (act === 'save') { persist(true); }
      else if (act === 'load') { closeModal($('#modal-menu')); continueGame('manual'); }
      else if (act === 'restart') { restartNode(); }
      else if (act === 'press') { pressCorruption(); }
      else if (act === 'title') confirmBox('确定回到标题？未保存的进度会丢失。', yes => { if (yes) backToTitle(); });
    }));

    // 结局页
    $$('#modal-end [data-act]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      closeModal($('#modal-end'));
      if (act === 'again') {
        /* 死在坏结局里 → 按档位回退；回退不了才真正重开 */
        if (state && state.deathPending && rollbackAfterDeath()) return;
        startNew();
      } else if (act === 'gallery') openGallery();
      else if (act === 'title') backToTitle();
    }));

    // 设定
    $('#set-volume').addEventListener('input', e => { settings.volume = +e.target.value; applySettings(); saveJSON(SETTING_KEY, settings); });
    $('#set-ambience').addEventListener('input', e => { settings.ambience = +e.target.value; applySettings(); saveJSON(SETTING_KEY, settings); });
    $('#set-speed').addEventListener('input', e => { settings.speed = +e.target.value; saveJSON(SETTING_KEY, settings); });
    $('#set-fx').addEventListener('change', e => { settings.fx = e.target.checked; applySettings(); saveJSON(SETTING_KEY, settings); });
    $('#set-reduced').addEventListener('change', e => { settings.reduced = e.target.checked; applySettings(); saveJSON(SETTING_KEY, settings); });
    $('#set-hotspots').addEventListener('change', e => { settings.hotspots = e.target.checked; applySettings(); saveJSON(SETTING_KEY, settings); });
    const diffSel = $('#set-difficulty');
    if (diffSel) diffSel.addEventListener('change', e => setDifficulty(e.target.value));
    $('#btn-reset').addEventListener('click', () => {
      confirmBox('清除全部存档、结局与档案解锁？此操作不可撤销。', yes => {
        if (!yes) return;
        [SAVE_KEY, UNLOCK_KEY].forEach(k => localStorage.removeItem(k));
        unlock.endings = []; unlock.codex = []; unlock.seen = [];
        toast('已清除', 'warn');
        refreshBoot();
        if (state) backToTitle();
      });
    });

    // 档案分页
    $$('#codex-tabs button').forEach(b => b.addEventListener('click', () => {
      $$('#codex-tabs button').forEach(x => x.classList.toggle('active', x === b));
      renderCodex(b.dataset.tab);
    }));

    // 观察
    $('#observe-exit').addEventListener('click', exitObserve);
    $('#observe-card-close').addEventListener('click', () => {
      $('#observe-card').hidden = true;
      if (observeMode) refreshObserveEntry();
    });

    // 走廊光标的微光跟随
    const layer = $('#observe-layer');
    if (layer) layer.addEventListener('pointermove', e => {
      const r = layer.getBoundingClientRect();
      layer.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      layer.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* =========================================================
     开始 / 存档
     ========================================================= */
  function freshState() {
    return {
      node: STORY.meta.start,
      line: 0,
      flags: {},
      stats: {
        clock: toMinutes(STORY.meta.startClock || '21:47'),
        knock: 0, eyes: 0, corruption: 0, battery: 100, survivors: 40, minutes: 0,
        /* 理智：与 corruption 正交（"你变成了什么" vs "你还能不能做正常判断"）。
           旧存档没有这个键 → migrateSave 以 freshState 为底，自动补 100。 */
        sanity: 100
      },
      clues: [],
      items: {},
      codex: [],
      act: 0,
      cycle: 1,
      /* 本局的档位。跟着存档走；设定里的 settings.difficulty 是默认值。 */
      difficulty: settings.difficulty,
      /* 本节点开头（「回到本节点开头」的锚点），不含 nk 自身的快照 */
      nk: null,
      /* 本场景开头（标准/噩梦死亡回滚的锚点），不含 ck 自身的快照 */
      ck: null,
      /* 本幕幕首节点 id（标准/噩梦死亡回退的锚点；资源维持当时数值） */
      actStart: null,
      /* 累计观察次数：敲门按 rate 累计取整（故事档每 2 处 +1） */
      obsCount: 0,
      /* 死亡标记：非空表示"这一局刚死，别覆盖存档，等玩家选怎么回去" */
      deathPending: null,
      rollbackCount: 0,
      v: SAVE_VERSION
    };
  }

  /* 存档快照：只写"玩下去需要的"字段。withCheckpoint=false 用于生成锚点本身，避免自我嵌套。 */
  function snapshot(withCheckpoint) {
    const s = {
      v: SAVE_VERSION,
      node: state.node,
      line: lineIndex,
      flags: { ...state.flags },
      stats: { ...state.stats },
      clues: state.clues.slice(),
      items: { ...state.items },
      codex: state.codex.slice(),
      act: state.act,
      cycle: state.cycle,
      difficulty: state.difficulty || settings.difficulty,
      actStart: state.actStart,
      obsCount: state.obsCount || 0,
      rollbackCount: state.rollbackCount || 0,
      ending: state.ending,
      savedAt: Date.now()
    };
    if (withCheckpoint) {
      if (state.nk) s.nk = { ...state.nk };
      if (state.ck) s.ck = { ...state.ck };
    }
    return s;
  }

  /* 存档迁移 / 清洗：v1（无 v / difficulty 字段）也能读。三条规则——
     1) 缺字段就用默认值补，绝不因为"少一个键"丢档；
     2) 类型不对就当没写（例如 stats 不是对象）；
     3) 节点不存在 / JSON 损坏 → 返回 null，调用方按"没有存档"处理。 */
  function migrateSave(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (typeof raw.node !== 'string' || !STORY.nodes[raw.node]) return null;
    const s = freshState();
    s.node = raw.node;
    s.line = Number.isFinite(+raw.line) ? Math.max(0, Math.round(+raw.line)) : 0;
    if (raw.flags && typeof raw.flags === 'object' && !Array.isArray(raw.flags)) s.flags = { ...raw.flags };
    const st = (raw.stats && typeof raw.stats === 'object' && !Array.isArray(raw.stats)) ? raw.stats : {};
    for (const k of Object.keys(s.stats)) {
      const v = +st[k];
      if (Number.isFinite(v)) s.stats[k] = v;
    }
    if (Array.isArray(raw.clues)) s.clues = raw.clues.filter(c => typeof c === 'string');
    if (raw.items && typeof raw.items === 'object' && !Array.isArray(raw.items)) s.items = { ...raw.items };
    if (Array.isArray(raw.codex)) s.codex = raw.codex.filter(c => typeof c === 'string');
    if (Number.isFinite(+raw.act)) s.act = +raw.act;
    if (Number.isFinite(+raw.cycle) && +raw.cycle > 0) s.cycle = +raw.cycle;
    if (Number.isFinite(+raw.obsCount) && +raw.obsCount >= 0) s.obsCount = +raw.obsCount;
    if (Number.isFinite(+raw.rollbackCount) && +raw.rollbackCount >= 0) s.rollbackCount = +raw.rollbackCount;
    if (typeof raw.ending === 'string') s.ending = raw.ending;
    if (typeof raw.actStart === 'string' && STORY.nodes[raw.actStart]) s.actStart = raw.actStart;
    /* 旧存档没有 difficulty（或早期叫 diff / normal）：按「标准」继续——
       存档是一段已经按某套数值走过来的进度，用当前设置去接会让节奏失真。 */
    s.difficulty = normDiff(raw.difficulty) || normDiff(raw.diff) || 'standard';
    /* 锚点本身也走一遍清洗（它是不含锚点的存档结构），避免脏数据带进回退里。
       兼容早期版本的 ck（场景检查点）——语义上等同于本节点开头。 */
    const ckRaw = raw.ck;
    if (ckRaw && typeof ckRaw === 'object' && STORY.nodes[ckRaw.node]) {
      const ck = migrateSave({ ...ckRaw, nk: null, ck: null, difficulty: raw.difficulty || raw.diff });
      if (ck) { ck.nk = null; ck.ck = null; s.ck = ck; }
    }
    const nkRaw = raw.nk;
    if (nkRaw && typeof nkRaw === 'object' && STORY.nodes[nkRaw.node]) {
      const nk = migrateSave({ ...nkRaw, nk: null, ck: null, difficulty: raw.difficulty || raw.diff });
      if (nk) { nk.nk = null; s.nk = nk; }
    }
    return s;
  }

  function startNew(ng) {
    state = freshState();
    state.difficulty = settings.difficulty;
    /* 周目：带着"走过一次"的记忆重开。档案本来就会继承（unlock），
       这里额外记下周目数，并打开 ng 旗标——只影响旁白与几个专属选项。 */
    if (ng) {
      state.cycle = (unlock.endings.length || 0) + 1;
      state.flags.ng = true;
    }
    unlock.seen = unlock.seen || [];
    lastHUD = {};
    stopKnockAmbience();
    closeAllModals();
    $('#boot').style.display = 'none';
    $('#boot').setAttribute('aria-hidden', 'true');
    $('#game').setAttribute('aria-hidden', 'false');
    if (window.Sound) Sound.begin();
    resetStage();
    runNode(state.node, { fresh: true });
  }

  function continueGame(slot) {
    const primary = slot === 'manual' ? SAVE_MANUAL_KEY : SAVE_KEY;
    let save = migrateSave(loadJSON(primary, null));
    if (!save && slot === 'manual') {
      save = migrateSave(loadJSON(SAVE_KEY, null));
      if (save) toast('没有手动存档，已改为读取自动存档');
    }
    if (!save || !STORY.nodes[save.node]) { toast('没有可读取的进度', 'warn'); return; }
    /* 难度与存档不一致时必须提示，不能静默覆盖存档里的档位（设计 §10.1） */
    if (save.difficulty !== settings.difficulty) {
      const sd = DIFFICULTY[save.difficulty], cd = DIFFICULTY[settings.difficulty];
      confirmBox(`这份存档是「${sd.name}」档，当前设定是「${cd.name}」档。\n继续会按存档的「${sd.name}」继续，设定保持「${cd.name}」不变。`, yes => {
        if (yes) beginLoad(save);
      });
      return;
    }
    beginLoad(save);
  }

  function beginLoad(save) {
    state = save;
    closeAllModals();
    $('#boot').style.display = 'none';
    $('#boot').setAttribute('aria-hidden', 'true');
    $('#game').setAttribute('aria-hidden', 'false');
    if (window.Sound) Sound.begin();
    resetStage();
    /* skipEnter：进入效果（尤其 n.stats）已经记在存档里了，重放会重复计入 */
    /* 存档里带 ck 时保持原锚点，别在读档瞬间把它挪到当前节点 */
    runNode(state.node, { resume: save.line || 0, skipEnter: true, noCharge: true, keepCk: !!save.ck });
  }

  function persist(notify) {
    if (!state) return;
    if (notify) {
      const d = runDiff();
      if (!d.save.manual) { toast(`「${d.name}」档不能手动保存——${d.desc}`, 'warn'); return; }
      const snap = snapshot(true);
      saveJSON(SAVE_MANUAL_KEY, snap);
      saveJSON(SAVE_KEY, snap);
      toast('进度已保存');
      return;
    }
    /* 死亡之后不再覆盖自动存档：自动槽停在"要回去的那个地方"，
       关掉页面再回来也不会掉进坏结局里。 */
    if (state.deathPending) {
      const t = deathTarget();
      if (t) saveJSON(SAVE_KEY, { ...t, v: SAVE_VERSION, savedAt: Date.now() });
    } else {
      saveJSON(SAVE_KEY, snapshot(true));
    }
    unlock.seen = Array.from(new Set([...(unlock.seen || []), state.node]));
    saveJSON(UNLOCK_KEY, unlock);
  }

  /* 死亡后要回到哪里：故事档回本节点开头（连资源一起回），标准/噩梦回本幕幕首（资源维持）。 */
  function deathTarget() {
    const d = runDiff();
    if (!state) return null;
    /* 故事档「回到这一步」用本节点锚点（资源也一起回）；
       标准/噩梦回本场景开头，但**资源维持死亡当时的数值**（§12.5 的"维持当时值、不扣"）：
       所以取"当前状态"、只把位置换成 ck 的节点。 */
    if (d.death.mode === 'node' && state.nk) return { ...state.nk, difficulty: state.difficulty };
    if (state.ck) {
      return { ...snapshot(false), node: state.ck.node, line: 0, nk: null, ck: state.ck, difficulty: state.difficulty };
    }
    return null;
  }

  /* 切换难易度：改成下一局的默认值并持久化；如果这一局还在进行，则立刻生效
     ——想调低难度是正当需求，不该逼玩家重开。 */
  function setDifficulty(id) {
    const key = normDiff(id);
    if (!key) return;
    settings.difficulty = key;
    saveJSON(SETTING_KEY, settings);
    const d = DIFFICULTY[key];
    if (state) {
      state.difficulty = key;
      if (d.save.restart && !state.nk) state.nk = snapshot(false);
      updateHUD(true);
    }
    applySettings();
    toast(`难易度 · ${d.name}${state ? '（本局立即生效）' : ''}`);
  }

  /* 「回到本…开头」：故事/标准档可用。故事档回到本节点、标准档回到本场景（各自的锚点）。
     资源一起回到锚点时的数值。 */
  function restartNode() {
    const d = runDiff();
    if (!state) return false;
    if (!d.save.restart) { toast('这个档位不能回退', 'warn'); return false; }
    /* 故事档是"回到本节点"（nk），标准/噩梦是"回到本场景"（ck）——文案与行为必须一致 */
    const anchor = d.id === 'story' ? (state.nk || state.ck) : (state.ck || state.nk);
    if (!anchor) { toast('这里没有可以回去的开头', 'warn'); return false; }
    const restored = migrateSave({ ...anchor, difficulty: state.difficulty });
    if (!restored) return false;
    state = restored;
    closeAllModals();
    toast(d.id === 'story' ? '回到这个节点的开头' : '回到这个场景的开头');
    runNode(state.node, { skipEnter: true, force: true, noCharge: true });
    return true;
  }

  /* 死在一个坏结局之后：按档位回退（故事=本节点，标准/噩梦=本幕幕首 + 惩罚）。 */
  function rollbackAfterDeath() {
    const d = runDiff();
    if (!state || !state.deathPending) return false;
    const max = d.death.maxRollback || 0;
    if ((state.rollbackCount || 0) >= max) {
      toast('这个档位的回退次数用完了', 'warn');
      return false;
    }
    const target = deathTarget();
    if (!target) return false;
    const count = (state.rollbackCount || 0) + 1;
    const restored = migrateSave({ ...target, difficulty: state.difficulty });
    if (!restored) return false;
    state = restored;
    state.rollbackCount = count;
    state.deathPending = null;
    delete state.flags.__k13_return;
    /* 先加惩罚，再夹上限（顺序不能反）：
       - knock 夹到 danger−1：噩梦 k13=11、回滚 +3 之后若不夹，下个节点立刻二次触发；
       - corruption 夹到 brk−15：不夹的话从 e_absorb 回来仍是 85+，幕末检查立刻再判一次。 */
    const knockBefore = state.stats.knock || 0;
    for (const k in (d.death.penalty || {})) state.stats[k] = (state.stats[k] || 0) + (d.death.penalty[k] || 0);
    if (d.knock.danger != null) {
      /* 先夹到 danger−1 防止下个节点立刻再进 k13；再保证"净效果不为负"（惩罚不能被夹成奖励）。 */
      let kn = Math.min(state.stats.knock || 0, d.knock.danger - 1);
      kn = Math.max(kn, knockBefore);
      state.stats.knock = kn;
    }
    state.stats.corruption = Math.min(state.stats.corruption || 0, d.corruption.brk - 15);
    normalizeStats();
    closeAllModals();
    const back = d.death.mode === 'node' ? '这一步' : '本场景开头';
    const extra = d.death.penalty && Object.keys(d.death.penalty).length
      ? `（敲门 +${d.death.penalty.knock || 0}${d.death.penalty.survivors ? ' · 同伴 ' + d.death.penalty.survivors : ''}）` : '';
    toast(`你死了一次 · 回到${back}${extra}`, 'warn');
    /* keepCk：回滚重入不得改写检查点，否则"回滚到场景开头"会退化成"回滚到死亡现场" */
    runNode(state.node, { skipEnter: true, force: true, noCharge: true, keepCk: true });
    return true;
  }

  /* 保留旧名（旧测试/旧调试脚本里用过） */
  function rollbackToCheckpoint() { return rollbackAfterDeath(); }

  function backToTitle() {
    stopKnockAmbience();
    closeAllModals();
    $('#game').setAttribute('aria-hidden', 'true');
    $('#boot').style.display = '';
    $('#boot').setAttribute('aria-hidden', 'false');
    if (window.Sound) Sound.ambience(false);
    refreshBoot();
    state = null;
  }

  /* =========================================================
     节点运行
     ========================================================= */
  async function runNode(id, opts = {}) {
    if (busy && !opts.force) return;

    /* 回跳（k13 出来 / 断片醒来）不重复结算：判定必须在**扣时之前**，
       否则"回到被打断的节点"会白扣一次节点耗时。 */
    if (state && state.flags.__k13_return && state.flags.__k13_back === id) {
      delete state.flags.__k13_return;
      opts = Object.assign({}, opts, { noCharge: true, skipEnter: true });
    }
    if (state && state.flags.__sanity_return && state.flags.__sanity_back === id) {
      delete state.flags.__sanity_return;
      opts = Object.assign({}, opts, { noCharge: true, skipEnter: true });
    }

    /* --- H2：节点基础耗时（含难度倍率），并按"经过分钟数"推进时间线 --- */
    charged = 0;
    if (state && !opts.noCharge && !opts.resume && !opts.skipEnter) chargeNodeClock(id);

    /* --- H1 / H2 / H6：强制转场（可能改写目标节点，或直接判死） --- */
    const forced = forcedTarget(id);
    if (forced && forced.death) { showEnding(forced.death); return; }
    if (forced && forced.node && forced.node !== id) {
      /* 断片改写：这次进入根本没发生（玩家是在上一格踩空的），把它扣的节点耗时退回去，
         否则断片的实际代价会变成"30 + 6"，而不是设计的 30。 */
      if (forced.node === 'sanityBreak' && charged) {
        state.stats.clock = Math.max(0, (state.stats.clock || 0) - charged);
        charged = 0;
      }
      id = forced.node;
      opts = Object.assign({}, opts, { noCharge: true });
    }
    busy = true;
    const n = STORY.nodes[id];
    if (!n) { console.error('未知节点', id); busy = false; return; }

    /* 打断上一段播放：代际 +1、停打字机、放掉还在等"点一下"的旧 promise */
    playGen++;
    if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
    typing = false;
    if (advanceResolve) { const r = advanceResolve; advanceResolve = null; r(); }

    node = n;
    state.node = id;
    lineIndex = 0;
    observeMode = false;
    clearChoices();
    hideObserve();
    $('#observe-card').hidden = true;

    if (!opts.silent) await curtain(true);

    if (!opts.resume && !opts.skipEnter) applyEnter(n);
    maybeCheckpoint(n, opts);
    renderStage(n);

    if (n.actCard && !opts.resume && !opts.silent && !state.flags['__act_' + n.actCard.id]) {
      state.flags['__act_' + n.actCard.id] = true;
      await showActCard(n.actCard);
    }
    if (!opts.silent) await curtain(false);

    busy = false;
    persist(false);

    if (opts.resume) {
      if (opts.resume >= n.lines.length) { afterLines(); return; }
      lineIndex = opts.resume;
    }
    playFrom(n.lines, opts.resume ? opts.resume : 0);
  }

  /* 时间线的经过分钟数。用 clock 与开局时刻的差，而不是 clock % 1440——
     后者在 05:31 会算出"还剩 23 小时"，把死线判断整个搞反（设计 §10.3）。 */
  function elapsedMin() {
    const start = toMinutes((STORY.meta && STORY.meta.startClock) || '22:10');
    /* 取模后的差值：既保证"经过分钟数"单调（不会午夜复原），
       又能让 `?clock=HH:MM` 这种"绝对时刻"调试参数算出一个合理的经过值。 */
    return (((state.stats.clock || start) - start) % 1440 + 1440) % 1440;
  }

  /* 从开局时刻算，到某个时刻需要经过多少分钟（跨午夜自动 +1440） */
  function minutesUntil(hhmm) {
    const start = toMinutes((STORY.meta && STORY.meta.startClock) || '22:10');
    return ((toMinutes(hhmm) - start) + 1440) % 1440;
  }

  /* H2：每进入一个节点扣基础耗时；跨 03:00 置 night_late。
     节点可用 costClock 覆盖基础耗时（缺省按难度倍率算 3/4/5 分钟）。 */
  function chargeNodeClock(id) {
    const n = STORY.nodes[id];
    const d = runDiff();
    /* costClock（显式覆盖）> pace（run/still）> walk 缺省。这里是显式表，不乘倍率（§12.1） */
    const pace = n && n.pace === 'run' ? 'run' : n && n.pace === 'still' ? 'still' : 'walk';
    const cost = n && Number.isFinite(+n.costClock)
      ? Math.max(0, Math.round(+n.costClock))
      : (d.nodeClock[pace] != null ? d.nodeClock[pace] : NODE_COST_CLOCK);
    const before = elapsedMin();
    state.stats.clock = (state.stats.clock || 0) + cost;
    charged = cost;                              // 供"这次进入被断片改写"时退还
    const after = elapsedMin();
    const late = minutesUntil(CLOCK_NIGHT_LATE);
    if (!state.flags.night_late && before < late && after >= late) {
      state.flags.night_late = true;
      toast('三点过了。走廊里的声音开始变得有规律。', 'warn');
    }
  }

  /* H1 / H2 / H6 的强制转场：敲门到点去 k13，时间耗尽去 f10，复苏爆表在幕末去 end_absorb。
     三条都做成"节点存在才转"，剧情数据没接上时行为与现在完全一致（不崩）。 */
  /* 终幕（第四幕后半 + 终幕 + 结局）不进死线：玩家已经走到结局段，不该被时间拽回去。
     C1：第四幕里绝不从 act5 直接跳 f10（那会跳过 f1–f9），只在"更早的幕"里才允许拽。 */
  function isEndgameNode(id) {
    /* 只用 id 判定，**不看 chapter**：数据里 d7/d8 的 chapter 还写着"第四幕 · 眼睛"（历史幕号错乱），
       按章名判断会把第三幕的节点误当成终幕段、逃过死线。 */
    if (id === 'act5' || id === 'act6' || id === 'f10') return true;
    return /^f\d/.test(id) || /^g\d/.test(id) || /^end_/.test(id);
  }

  function forcedTarget(targetId) {
    if (!state) return null;
    const d = runDiff();
    const id = targetId || state.node;

    /* 任何进入 f10 的路径都置位：之后不再因超时被拽回来（D1 的重播根因就在这里） */
    if (id === 'f10') state.flags.__passed_f10 = true;

    /* ① C2：复苏失控判定必须**先于**超时——否则被时间拽走时会绕过 f9 的幕末判定 */
    if (!state.flags.__absorb && (state.stats.corruption || 0) >= d.corruption.brk
        && CORRUPTION_BREAK_NODES.indexOf(id) >= 0 && STORY.nodes.end_absorb) {
      state.flags.__absorb = true;
      toast('它不想再等了。', 'warn');
      return { node: 'end_absorb' };
    }

    /* ①.5 理智归零 → 断片：回**刚才那一步**（触发断片的节点），代价是时间（+30 分），
       不判死、不扣同伴、不加敲门。每"幕"最多一次（用 actStart 作为幕的标识）。
       回"那一格台阶"而不是"场景开头"：台词就是这么写的，而且回场景开头会让玩家被迫
       重看一整段（真实代价从 30 分变成 48 分级），不是设计说的"只罚 30 分"。 */
    const brokeKey = '__broke_' + (state.actStart || 'x');
    if (sanityValue() <= 0 && !state.flags[brokeKey]) {
      state.flags[brokeKey] = true;
      /* 故事档不断片：只抬到 1 + 一句旁白，不转场、不加 30 分（设计 §3.10）。 */
      if (d.id === 'story') {
        state.stats.sanity = 1;
        normalizeStats();
        toast('你晃了一下神。还好——你把这一夜看下来了。', 'warn');
        return null;
      }
      /* 标准 40 / 噩梦 30（噩梦更容易被"看"这件事吃掉） */
      state.stats.sanity = d.id === 'nightmare' ? 30 : 40;
      state.stats.clock = (state.stats.clock || 0) + 30;
      /* "刚才那一格"= 玩家踩空时所在的节点（state.node 还没被改成目标节点） */
      state.flags.__sanity_back = state.node || id;
      state.flags.__sanity_return = true;
      normalizeStats();
      if (STORY.nodes.sanityBreak) {
        toast('你断片了。回神的时候，你不记得自己是怎么回到这里的。', 'warn');
        return { node: 'sanityBreak' };
      }
      /* 数据还没落地：不转场，只把理智抬回 40，绝不报错 */
      toast('你断片了一下，回神时手脚都是冷的。', 'warn');
    }

    /* ② 时间耗尽：f10 播过 / 已在终幕段 / 正在第四幕 → 一律不再转场，只报时 */
    const overTime = elapsedMin() >= minutesUntil(CLOCK_DEADLINE);
    if (overTime && !state.flags.__timeup && !state.flags.__passed_f10 && !isEndgameNode(id)) {
      if (STORY.nodes.f10) {
        state.flags.__timeup = true;
        toast('五点三十。时间到了。', 'warn');
        return { node: 'f10' };
      }
    }
    if (overTime && !state.flags.__timeup && isEndgameNode(id)) {
      state.flags.__timeup = true;              // 只在 HUD 上"报时"，不转场
      toast('五点三十了。天快亮了。', 'warn');
    }
    /* 敲门到点 → k13。噩梦档"选择即承诺"，直接判死。 */
    const k13 = d.knock.k13;
    if (k13 != null && !state.flags.__k13 && (state.stats.knock || 0) >= k13) {
      if (d.id === 'nightmare') {
        state.flags.__k13 = true;
        delete state.flags.__k13_return;
        return { death: 'e_door' };
      }
      if (STORY.nodes.k13) {
        state.flags.__k13 = true;
        /* 回跳目标：k13_pass 的 route 读它，没读到会 fallback 到 actStart（= 整幕重播）。
           每次触发都覆盖写，避免上一次的旧值残留。噩梦档走 death 分支，不写。 */
        state.flags.__k13_back = targetId || state.node;
        state.flags.__k13_return = true;
        toast('敲门声停在第十三下。', 'warn');
        return { node: 'k13' };
      }
      /* k13 还没写：不转场、也不记旗标，等文案落地后自然生效 */
    }
    return null;
  }

  /* 复苏爆表只在幕末节点结算（设计 §10.2 H6 的清单） */
  /* 复苏审判点：幕末/天亮这类"该结算了"的位置。
     g1 是"你走到了天亮"——后段堆复苏（f10 咬眼 +25、终幕观察）的玩法在这里被收走；
     f10 刻意不在名单里（入口时不少人 80 上下，会把"还没咬就成鬼"提前触发，剧情上不成立）。 */
  const CORRUPTION_BREAK_NODES = ['act3', 'd8', 'act5', 'f9', 'g1'];

  /* 两处锚点：
     nk  = 本节点开头（故事/标准档「回到本节点开头」、故事档死亡回退）
     actStart = 本幕幕首（标准/噩梦死亡回退，资源维持当时数值）
     必须在 applyEnter 之后取快照：这样回退时用 skipEnter 重入，效果不会被计两次。 */
  function maybeCheckpoint(n, opts) {
    const d = runDiff();
    if (opts && opts.keepCk) return;
    const actOpening = !!n.actCard || !state.actStart || !STORY.nodes[state.actStart];
    if (actOpening) state.actStart = n.id;
    /* 比较"基础场景"（去掉 _rot 后缀）：rotAfter 只是同一地点的腐蚀图，
       换图不代表换场景——否则每跨一个时间点就会把 ck 重写到更靠后的节点（M3）。 */
    const baseScene = x => String(x || '').replace(/_rot$/, '');
    const sceneNow = sceneOf(n, lastScene);
    if (d.death.mode === 'rollback' && (!state.ck || baseScene(sceneNow) !== baseScene(lastScene))) {
      state.ck = snapshot(false);
      state.ck.line = 0;
      state.ck.nk = null;
    }
    /* nk = **本节点**开头（故事档「回到这一步」、故事/标准档的「回到本节点开头」） */
    if (d.save.restart) {
      state.nk = snapshot(false);
      state.nk.line = 0;
      state.nk.nk = null;
      state.nk.actStart = state.actStart;
    }
  }

  function applyEnter(n) {
    const prev = guardedStats();
    if (n.enter) applyEffects(n.enter, { silent: true });
    if (n.stats) {
      for (const k in n.stats) state.stats[k] = (state.stats[k] || 0) + n.stats[k];
    }
    normalizeStats();
    checkResourceEmpty(prev);
    updateHUD(true);
  }

  /* 电量与复苏是有上下界的资源：0 就是"没了"，100 就是"满"。
     越界的数值只会在存档里长成负数，没有任何好处。 */
  function normalizeStats() {
    const s = state.stats;
    if (s.battery != null) s.battery = clamp(s.battery, 0, 100);
    if (s.corruption != null) s.corruption = clamp(s.corruption, 0, 100);
    if (s.sanity != null) s.sanity = clamp(s.sanity, 0, 100);
  }

  async function playFrom(lines, start) {
    /* 代际标记：runNode 每次进入新节点都会 +1。
       旧的台词循环（例如"回到本节点开头"打断播放、或调试脚本直接换节点）
       发现代际变了就立刻退出，不会再去抢 #story-text 或 advanceResolve。 */
    const gen = playGen;
    for (let i = start; i < lines.length; i++) {
      if (gen !== playGen) return;
      lineIndex = i;
      const line = lines[i];
      if (line.when && !check(line.when)) continue;
      if (line.cast) renderCast(line.cast, true);
      if (line.scene) renderStage({ ...node, scene: line.scene, mood: line.mood || (node && node.mood) });
      if (line.mood !== undefined) setMood(line.mood);
      if (line.effects) applyEffects(line.effects);
      if (line.sfx && window.Sound) Sound.play(line.sfx);
      if (line.fx) doFx(line.fx);
      await say(line);
      if (gen !== playGen) return;
      await waitForAdvance();
      if (gen !== playGen) return;
    }
    if (gen !== playGen) return;
    afterLines();
  }

  function afterLines() {
    if (!node) return;
    const n = node;
    persist(false);
    /* 有观察点就先停下来让玩家看：只有观察点、没有选项的节点不该直接往下走（会成死路）。
       renderChoices 在"列表为空"时会自己前进，所以这里放宽条件是安全的。 */
    if ((n.observe && n.observe.length) || (n.choices && n.choices.length)) { renderChoices(n); return; }
    if (n.ending) { showEnding(n.ending); return; }
    if (n.route) { const id = n.route(state); if (id) { runNode(id); return; } }
    if (n.next) { runNode(n.next); return; }
    // 没有后续：停留
  }

  /* ---------- 显示一行 ---------- */
  function say(line) {
    return new Promise(resolve => {
      const who = line.who || '';
      const cid = NAME2ID[who] || who;
      const ch = who && CHARACTERS[cid] ? CHARACTERS[cid] : null;
      const plate = $('#nameplate');
      $('#name-text').textContent = ch ? ch.name : (who === '旁白' || !who ? '旁白' : who);
      plate.className = 'nameplate' + (!ch ? ' narrator' : (ch.kind === 'ghost' ? ' ghost' : ''));
      if (line.tag) $('#d-tag').textContent = line.tag;
      else $('#d-tag').textContent = (ch && ch.kind === 'ghost') ? '— 不干净的东西 —' : '';
      highlightSpeaker(ch ? cid : '');
      $('#advance-hint').classList.add('hold');
      const text = line.text || '';
      typeText(text, line.style).then(resolve);
    });
  }

  function typeText(text, style) {
    return new Promise(resolve => {
      const el = $('#story-text');
      const caret = $('#caret');
      el.innerHTML = '';
      el.className = 'story-text' + (style ? ' ' + style : '');
      const frag = document.createDocumentFragment();
      const spans = [];
      parseMarkup(text).forEach(seg => {
        for (const ch of Array.from(seg.text)) {
          const s = document.createElement('span');
          s.textContent = ch;
          if (seg.cls) s.className = seg.cls;
          s.style.opacity = '0';
          frag.appendChild(s);
          spans.push({ el: s, ch });
        }
      });
      el.appendChild(frag);
      caret.classList.add('on');
      typing = true;
      let i = 0;
      const base = clamp(74 - settings.speed, 6, 80);
      const step = () => {
        if (!typing) return finish();
        if (i >= spans.length) return finish();
        const sp = spans[i];
        sp.el.style.opacity = '1';
        i++;
        let d = base;
        const c = sp.ch;
        if ('。！？'.includes(c)) d += 130;
        else if ('，、；：'.includes(c)) d += 46;
        else if (c === '…') d += 26;
        if (!settings.fx) d = Math.min(d, 8);
        typeTimer = setTimeout(step, d);
      };
      function finish() {
        clearTimeout(typeTimer); typeTimer = null;
        typing = false;
        spans.forEach(s => s.el.style.opacity = '1');
        caret.classList.remove('on');
        $('#advance-hint').classList.remove('hold');
        resolve();
      }
      window.__finishTyping = finish;
      if (!text) return finish();
      step();
    });
  }

  // 标记：*强调*  ~低语~  ^血色^
  function parseMarkup(text) {
    const out = [];
    let buf = '';
    let cls = '';
    const flush = () => { if (buf) { out.push({ text: buf, cls }); buf = ''; } };
    for (const ch of Array.from(text)) {
      if (ch === '*') { flush(); cls = cls === 'em' ? '' : 'em'; continue; }
      if (ch === '~') { flush(); cls = cls === 'whisper' ? '' : 'whisper'; continue; }
      if (ch === '^') { flush(); cls = cls === 'blood' ? '' : 'blood'; continue; }
      buf += ch;
    }
    flush();
    return out.length ? out : [{ text: '', cls: '' }];
  }

  function waitForAdvance() {
    return new Promise(resolve => {
      advanceResolve = resolve;
      $('#advance-hint').classList.remove('hold');
    });
  }

  function advance() {
    if (typing && window.__finishTyping) { window.__finishTyping(); return; }
    if (advanceResolve) { const r = advanceResolve; advanceResolve = null; r(); }
  }

  /* =========================================================
     舞台渲染
     ========================================================= */
  function resetStage() {
    const stage = $('#stage');
    stage.className = 'stage';
    $('#sprites').innerHTML = '';
    $('#story-text').innerHTML = '';
    $('#name-text').textContent = '';
    clearChoices();
    hideObserve();
    $('#observe-card').hidden = true;
    $('#bg-a').className = 'bg';
    $('#bg-b').className = 'bg';
    $('#bg-a').removeAttribute('src');
    $('#bg-b').removeAttribute('src');
    lastScene = 'room_night'; lastMood = ''; lastCast = [];
  }

  let frontIsA = true;
  let lastScene = 'room_night';
  let lastMood = '';
  let lastCast = [];

  /* 当前节点该用哪张场景图。
     rotAfter 是"时刻推进 → 场景自己烂掉"的可选字段：
       rotAfter: '02:40'                       → 到达该时刻后用 <scene>_rot
       rotAfter: { at: '02:40', scene: 'xxx' } → 到达该时刻后换成显式指定的图
     没写 rotAfter 的节点行为完全不变。 */
  function sceneOf(n, fallback) {
    let scene = n.scene || fallback;
    const ra = n.rotAfter;
    if (!ra) return scene;
    const at = typeof ra === 'string' ? ra : ra.at;
    if (!at) return scene;
    /* 用**单调经过分钟数**判断是否到点：`at` 是时刻（HH:MM），换算成"从开局起要经过多少分钟"。
       用 clock % 1440 比较会在午夜回绕，第二幕的场景会"腐烂复原"（M4）。
       阈值本身是固定时刻，与难度倍率无关，所以三档在同一时刻一起变。 */
    const start = toMinutes((STORY.meta && STORY.meta.startClock) || '22:10');
    const rotAt = ((toMinutes(at) - start) + 1440) % 1440;
    if (elapsedMin() < rotAt) return scene;
    if (typeof ra === 'object' && ra.scene) return ra.scene;
    return /_rot$/.test(scene) ? scene : scene + '_rot';
  }

  function renderStage(n) {
    const stage = $('#stage');
    document.body.dataset.diff = (state && state.difficulty) || 'standard';
    const mood = n.mood !== undefined ? n.mood : lastMood;
    stage.className = 'stage' + (mood ? ' ' + mood : '');
    lastMood = mood;
    const scene = sceneOf(n, lastScene);
    lastScene = scene;
    const a = $('#bg-a'), b = $('#bg-b');
    const front = frontIsA ? a : b;
    const back = frontIsA ? b : a;
    const src = ART.scene(scene);
    if (front.getAttribute('src') !== src) {
      back.src = src;
      back.className = 'bg on';
      back.classList.toggle('drift', !!settings.fx);
      front.classList.remove('on');
      // 交换
      back.style.zIndex = '1'; front.style.zIndex = '0';
      frontIsA = !frontIsA;
    }
    if (n.chapter) $('#hud-chapter').textContent = n.chapter;
    if (n.place) $('#hud-place').textContent = n.place;
    if (n.cast) lastCast = n.cast;
    renderCast(lastCast);
    updateHUD();
  }

  function setMood(mood) {
    const stage = $('#stage');
    stage.className = 'stage' + (mood ? ' ' + mood : '');
    applyAtmosphere();
  }

  let currentCastKey = '';
  function renderCast(cast, force) {
    const key = JSON.stringify(cast);
    if (!force && key === currentCastKey) return;
    currentCastKey = key;
    const wrap = $('#sprites');
    wrap.innerHTML = '';
    cast.forEach((c, i) => {
      const ch = CHARACTERS[c.id];
      if (!ch) return;
      if (ch.voice && !ch.art) return;   // 无立绘的“声音”角色不占画面
      const d = document.createElement('div');
      d.className = 'sprite ' + (c.pos === 'left' ? 'enter-left' : c.pos === 'center' ? 'enter-center' : 'enter-right');
      if (c.dim) d.classList.add('dim');
      if (settings.fx) d.classList.add('breathe');
      d.dataset.id = c.id;
      d.style.height = ((c.scale || 92) * 0.78) + '%';
      if (cast.length > 1) {
        d.style.right = 'auto';
        d.style.left = (16 + i * 34) + '%';
        d.style.transform = 'translateX(-50%)';
        d.classList.remove('enter-right', 'enter-left', 'enter-center');
        d.classList.add('enter-center');
      }
      const img = document.createElement('img');
      // 立绘差分：节点可以在 cast 里指定 art（例如王珊珊被咬前后、周正临死前）
      img.src = ART.char(c.art || ch.art || c.id);
      img.alt = ch.name;
      img.onerror = () => { d.style.display = 'none'; };
      d.appendChild(img);
      wrap.appendChild(d);
    });
  }

  function highlightSpeaker(who) {
    $$('.sprite').forEach(s => {
      s.classList.toggle('speaking', s.dataset.id === who);
      if ($$('.sprite').length > 1) s.classList.toggle('dim', s.dataset.id !== who && !!who);
    });
  }

  /* =========================================================
     选项
     ========================================================= */
  function clearChoices() { $('#choices').innerHTML = ''; }

  /* 看一处的实际代价：基准值 × 档位倍率。整数、至少 1。 */
  /* 观察一处的代价：时刻与电量按「基准 × 难度倍率 + 取整」算；
     敲门按每处 rate 累计取整（故事档 0.5 = 每 2 处 +1，设计 §10.3）。 */
  function observeCost() {
    const d = runDiff();
    return {
      clock: scaleCost(OBSERVE_COST.clock, d),
      battery: scaleCost(OBSERVE_COST.battery, d),
      rate: d.knockPerObs
    };
  }

  /* 第 n 次观察实际涨多少敲门：floor(n·r) − floor((n−1)·r) */
  function knockDeltaFor(n) {
    const r = runDiff().knockPerObs || 1;
    return Math.floor(n * r) - Math.floor((n - 1) * r);
  }

  function knockPhrase() {
    const r = runDiff().knockPerObs || 1;
    return r < 1 ? `每 ${Math.round(1 / r)} 处 +1` : `+${r}`;
  }

  /* 一处的照明方案（设计 §4.1）：
       light 0 / free        → 不耗照明
       电量 ≥ 照距阈值        → 用手机：电量 −cost.battery
       电量不够但 eyes ≥ 1    → 用鬼眼：复苏 +eyeLight[light]
       电量不够且 eyes === 0  → 太黑，不可点（H4：只有这一种情况会置灰） */
  function lightPlan(o) {
    const d = runDiff();
    const light = o.light == null ? 1 : +o.light;
    if (o.free || light === 0) return { kind: 'free' };
    const bat = state.stats.battery == null ? 100 : state.stats.battery;
    const eyes = state.stats.eyes || 0;
    const corr = state.stats.corruption || 0;
    if (light === 1 && corr >= d.corruption.power) return { kind: 'eye-free' };
    if (bat >= d.lightRange) return { kind: 'battery' };
    if (eyes >= 1) return { kind: 'eye', corruption: d.eyeLight[light] || d.eyeLight[2] };
    return { kind: 'too-dark' };
  }

  function costPhrase(o) {
    const d = runDiff();
    if (!d.hints.cost) return '每看一处，都要付代价';
    const c = observeCost();
    const plan = o ? lightPlan(o) : null;
    if (plan && plan.kind === 'free') return '这一处不用照明';
    if (plan && plan.kind === 'eye') return `时间 +${c.clock} 分 · 用这只眼睛看（复苏 +${plan.corruption}）`;
    if (plan && plan.kind === 'eye-free') return `时间 +${c.clock} 分 · 眼睛替你照着`;
    return `每看一处：时间 +${c.clock} 分 / 敲门 ${knockPhrase()} / 电量 −${c.battery}%`;
  }

  function tierName(tier) {
    return tier === 'key' ? '关键线索' : tier === 'ref' ? '档案' : '细节';
  }

  function renderChoices(n) {
    const box = $('#choices');
    box.innerHTML = '';
    const list = [];
    let observeNote = '';
    if (n.observe && n.observe.length) {
      const visible = observationVisible(n);
      const openable = visible.filter(o => lightPlan(o).kind !== 'too-dark');
      if (openable.length) {
        list.push({
          text: `观察四周　（还有 ${visible.length} 处 · ${costPhrase()}）`,
          cls: 'observe-entry',
          req: 'O',
          action: () => enterObserve(n)
        });
      } else if (visible.length) {
        /* 全部太黑：**不渲染可交互入口**（一个永远点不动的按钮对玩家是噪音、对自动走法是陷阱），
           改成一行不可交互的说明。玩家该做的是选别的，不是反复确认自己按不动。 */
        observeNote = `太黑了：这儿还有 ${visible.length} 处看不清，得先有眼睛。`;
      }
    }
    (n.choices || []).forEach(c => {
      if (c.once && state.flags['__ch_' + n.id + '_' + c.text]) return;
      /* 幻觉选项不是"锁着"，是"不存在"：理智没到那一步就整条不渲染，
         否则玩家会看到一条永远点不动的假选项，等于提前剧透。 */
      if (c.when && c.when.hallucination && !check(c.when)) return;
      list.push(c);
    });
    /* 说明行要在"没有选项就自动前进"之前渲染，否则纯观察节点上永远看不到它 */
    if (observeNote) {
      const note = document.createElement('div');
      note.className = 'observe-note';
      note.textContent = observeNote;
      note.setAttribute('aria-live', 'polite');
      box.appendChild(note);
    }
    if (!list.length) {
      if (n.next) { runNode(n.next); }
      else if (n.ending) showEnding(n.ending);
      return;
    }

    /* choice.tell：前导 whisper 与字幕标记（信号方言的 C5/C6 通道）。
       没有 tell 的数据行为完全不变。 */
    const tells = list.filter(c => c.tell).map(c => c.tell);
    const sub = $('#subtitle');
    if (sub) {
      const pre = tells.map(t => t && t.pre).filter(Boolean);
      sub.textContent = pre.join('　');
      sub.classList.toggle('on', pre.length > 0);
    }

    let unlockedNum = 0;
    list.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice' + (c.cls ? ' ' + c.cls : '');
      btn.style.animationDelay = (i * 60) + 'ms';
      const ok = !c.disabled && (!c.when || check(c.when));
      if (!ok) btn.classList.add('locked');
      btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
      /* 显示编号只给"能点的"递增，并写进 dataset.num：
         数字键按 dataset.num 查找，避免"看得到 3、按 3 却触发 4"的错位。 */
      const num = document.createElement('span'); num.className = 'num';
      if (ok) { unlockedNum++; num.textContent = unlockedNum; btn.dataset.num = String(unlockedNum); }
      else { num.textContent = '·'; btn.dataset.num = ''; }
      const label = document.createElement('span'); label.className = 'label'; label.textContent = c.text;
      const req = document.createElement('span'); req.className = 'req';
      req.textContent = ok ? (c.hint || c.req || '') : lockedHintFor(c);
      btn.append(num, label, req);
      if (c.tell) {
        if (c.tell.pre) {
          const pre = document.createElement('span'); pre.className = 'tell-pre'; pre.textContent = c.tell.pre;
          btn.appendChild(pre);
        }
        if (c.tell.sub && c.tell.sub.length) {
          btn.dataset.tell = c.tell.sub.join(',');
          const chips = document.createElement('span'); chips.className = 'tell-sub';
          chips.textContent = c.tell.sub.map(s => `〔${s}〕`).join('');
          btn.appendChild(chips);
        }
        btn.classList.add('has-tell');
      }
      if (!ok && c.lockedHint) btn.title = c.lockedHint;
      btn.addEventListener('click', async ev => {
        ev.stopPropagation();
        if (btn.classList.contains('locked')) { toast(c.lockedHint || '你现在还做不到', 'warn'); if (window.Sound) Sound.play('deny'); return; }
        if (busy) return;
        busy = true;
        clearChoices();
        if (window.Sound) Sound.play('click');
        if (c.action) { busy = false; c.action(); return; }
        if (c.once) state.flags['__ch_' + n.id + '_' + c.text] = true;
        if (c.effects) applyEffects(c.effects);
        await wait(120);
        busy = false;
        if (c.ending) { showEnding(c.ending); return; }
        if (c.next) runNode(c.next);
        else if (n.ending) showEnding(n.ending);
        else afterLines();
      });
      box.appendChild(btn);
    });

    /* P0 全锁兜底：一个节点上所有选项都被条件锁住时，绝不能留一排灰按钮把玩家卡死。
       有 next → 给一个中性的「继续」（不产生任何 stats 效果）；没有 next → 给一行说明 + 警告日志。 */
    const clickable = list.filter((c, i) => {
      const btn = box.children[i];
      return btn && !btn.classList.contains('locked');
    });
    if (!clickable.length && list.length) {
      console.warn('[choices] 所有选项都被锁住：', n.id, list.map(c => c.text));
      if (n.next) {
        const btn = document.createElement('button');
        btn.className = 'choice fallback-continue';
        btn.dataset.num = '1';
        const num = document.createElement('span'); num.className = 'num'; num.textContent = '1';
        const label = document.createElement('span'); label.className = 'label'; label.textContent = '继续';
        const req = document.createElement('span'); req.className = 'req'; req.textContent = '';
        btn.append(num, label, req);
        btn.addEventListener('click', ev => {
          ev.stopPropagation();
          if (busy) return;
          busy = true;
          clearChoices();
          busy = false;
          runNode(n.next);
        });
        box.appendChild(btn);
      } else {
        const note = document.createElement('div');
        note.className = 'observe-note dead-end';
        note.textContent = '这一步你走不下去了。';
        box.appendChild(note);
        toast('这一步你走不下去了。', 'warn');
      }
    }
    // 观察模式下选项只隐藏在背后，退出观察即可原样恢复
    box.hidden = observeMode;
  }

  /* 锁定提示按档位分级：故事档说清缺什么，标准说状态，噩梦想干脆（§6.2） */
  function lockedHintFor(c) {
    const d = runDiff();
    /* 理智不足：给一句"看不清"，不复用"你做不到"，也不报数值。
       玩家该怀疑的是自己的脑子，而不是去查数字。 */
    if (sanityGateFailed(c)) {
      if (c.sanityHint) return c.sanityHint;
      return d.id === 'nightmare' ? '你连这一步都想不清了' : '你现在看不清这一步';
    }
    if (d.id === 'story' && c.lockedHint) return c.lockedHint;
    if (d.id === 'story') return '条件不足';
    if (d.id === 'standard') return '你不知道该怎么做';
    return '你做不到';
  }

  /* 这条选项是不是"只被理智"卡住的（用于提示文案与全锁兜底判断） */
  function sanityGateFailed(c) {
    const w = c && c.when;
    if (!w) return false;
    /* 函数条件（例如 f8:1 的 `s => !(s.difficulty==='nightmare' && s.sanity<30)`）：
       用"把理智临时拉满再试一次"反推——条件必须是纯函数（设计约定：when 里不许有副作用）。
         · 现在就能过   → 不是理智问题
         · 拉满才过     → 唯一原因就是理智
         · 拉满也不过   → 是别的条件（例如档位不符），不是理智问题
       必须在 finally 里恢复原值，异常也不能污染状态。 */
    if (typeof w === 'function') {
      if (!state) return false;
      if (w(state)) return false;
      const cur = state.stats.sanity;
      let passAtFullSanity = false;
      try { state.stats.sanity = 100; passAtFullSanity = !!w(state); }
      finally { state.stats.sanity = cur; }
      return passAtFullSanity;
    }
    if (typeof w !== 'object') return false;
    if (w.minSanity == null && w.maxSanity == null) return false;
    const v = sanityValue();
    const sanityOk = (w.minSanity == null || v >= w.minSanity) && (w.maxSanity == null || v <= w.maxSanity);
    if (sanityOk) return false;
    /* 只有"别的原因都不缺、纯粹是理智不够"时才给"看不清"——
       否则 when:{diff:'nightmare', minSanity:30} 在标准档会误导成"你脑子不行"。 */
    const rest = Object.assign({}, w);
    delete rest.minSanity; delete rest.maxSanity;
    return !Object.keys(rest).length || check(rest);
  }

  /* =========================================================
     观察
     ========================================================= */
  function enterObserve(n) {
    if (observeMode) return;
    /* 兜底：没有任何可点的热点就别进空层（正常路径下入口根本不会渲染） */
    if (!observationVisible(n).some(o => lightPlan(o).kind !== 'too-dark')) {
      toast('太黑了，手机照不到那里。', 'warn');
      if (window.Sound) Sound.play('deny');
      return;
    }
    observeMode = true;
    // 选项不销毁、只隐藏：退出观察后能原样恢复，状态机也更好测
    $('#choices').hidden = true;
    $('#dialogue').style.opacity = '.25';
    $('#observe-bar').hidden = false;
    renderHotspots(n);
    /* 键盘可达：进入观察后焦点落在第一个光圈上，Tab 可在光圈间移动，Enter 打开 */
    const first = $('#observe-layer .hotspot');
    if (first && typeof first.focus === 'function') first.focus();
  }

  /* 还没看过的观察点（按旗标算，不依赖 DOM） */
  function observationRemaining(n) {
    if (!n || !n.observe) return [];
    return n.observe.filter(o => !state.flags['__ob_' + n.id + '_' + o.id]);
  }

  /* 电量 → 你还能看清几处。
     故事档常显；标准/噩梦在电量偏低时收缩可见数量，
     优先砍氛围细节，其次档案，关键线索最后砍（且至少留 1 处）。 */
  function observationVisible(n) {
    const remain = observationRemaining(n);
    const d = runDiff();
    if (d.observe.alwaysVisible || !d.observe.dimWhenLow) return remain;
    /* §12.3 三级收缩：砍的顺序 plain → ref → key，**至少留 1 处**；
       noDim（全篇唯一来源）不参与收缩。噩梦允许吞到只剩 1 处关键线索。 */
    const keep = remain.filter(o => o.noDim);
    const pool = remain.filter(o => !o.noDim);
    const ratio = BATTERY_VISIBLE[['ok', 'low', 'crit'][batteryTier()]];
    const cap = Math.max(1, Math.ceil(pool.length * ratio));
    if (cap >= pool.length) return remain;
    const rank = o => { const r = { key: 0, ref: 1, plain: 2 }[hotspotTier(o)]; return r == null ? 3 : r; };
    const picked = pool
      .map((o, i) => ({ o, i }))
      .sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i)
      .slice(0, cap)
      .map(x => x.o);
    const all = keep.concat(picked);
    /* 按原始顺序返回，保证渲染顺序稳定 */
    return remain.filter(o => all.indexOf(o) >= 0);
  }

  /* 按“看得见的、未看过的热点”重建观察层 */
  function renderHotspots(n) {
    const layer = $('#observe-layer');
    layer.innerHTML = '';
    layer.hidden = false;
    const remain = observationRemaining(n);
    const visible = observationVisible(n);
    const hint = runDiff().hints;
    visible.forEach(o => {
      const tier = hotspotTier(o);
      const plan = lightPlan(o);
      const h = document.createElement('button');
      h.type = 'button';
      h.className = 'hotspot ' + tier;
      h.style.left = o.x + '%';
      h.style.top = o.y + '%';
      /* H4：照距不足不锁死，改成"用这只眼睛看"；只有 eyes === 0 才置灰 */
      let sub = '';
      if (plan.kind === 'eye') { h.classList.add('by-eye'); sub = '（用这只眼睛看）'; }
      if (plan.kind === 'too-dark') { h.classList.add('too-dark'); sub = '（太黑了，照不到）'; }
      h.dataset.label = o.label + sub;
      h.dataset.tier = tier;
      h.dataset.light = (o.light == null ? 1 : o.light);
      if (o.risk) h.dataset.risk = o.risk;
      /* 分级不只靠颜色：CSS 用形状区分（圆 / 菱形 / 小方块），这里再补一条无障碍文本 */
      h.setAttribute('tabindex', '0');
      h.setAttribute('aria-label', `${o.label}（${tierName(tier)}${plan.kind === 'too-dark' ? '，太黑了' : plan.kind === 'eye' ? '，用这只眼睛看' : ''}）`);
      if (plan.kind === 'too-dark') h.setAttribute('aria-disabled', 'true');
      h.tabIndex = 0;
      const open = ev => { if (ev && ev.stopPropagation) ev.stopPropagation(); openHotspot(n, o, h); };
      h.addEventListener('click', open);
      h.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          open(ev);   // stopPropagation 之后不会再触发 document 的"空格推进"
        }
      });
      layer.appendChild(h);
    });
    const keyN = visible.filter(o => hotspotTier(o) === 'key').length;
    const eyeN = visible.filter(o => lightPlan(o).kind === 'eye').length;
    const darkN = visible.filter(o => lightPlan(o).kind === 'too-dark').length;
    const hidden = remain.length - visible.length;
    $('#observe-hint').textContent =
      (hint.keyCount ? `还剩 ${visible.length} 处（关键 ${keyN}）` : '点击画面中可疑的地方')
      + ` · ${costPhrase()}`
      + (eyeN > 0 ? ` · ${eyeN} 处只能用鬼眼照（不耗电，耗你）` : '')
      + (darkN > 0 ? ` · ${darkN} 处太黑，得先有眼睛` : '')
      + (hidden > 0 ? ` · 还有 ${hidden} 处沉在黑暗里（电量不够了）` : '')
      + (knockTier() >= 2 ? ' · 他已经站在门外了' : '');
    if (settings.hotspots) layer.classList.add('always');
  }

  /* 「看的代价」：时间 + 敲门（基础 + risk）+ 照明（手机电量 / 鬼眼复苏）。
     代价按档位缩放；照明方式由 lightPlan 决定（H4）。 */
  function openHotspot(n, o, el) {
    const plan = lightPlan(o);
    if (plan.kind === 'too-dark') {
      toast('太黑了，手机照不到那里。', 'warn');
      if (window.Sound) Sound.play('deny');
      return;
    }
    state.flags['__ob_' + n.id + '_' + o.id] = true;
    const tier = hotspotTier(o);
    $('#observe-card-title').textContent = o.label;
    $('#observe-card-tier').textContent = tierName(tier);
    $('#observe-card-tier').className = 'observe-tier ' + tier;
    $('#observe-card-text').textContent = o.text;
    $('#observe-card').hidden = false;
    if (window.Sound) Sound.play('clue');
    if (o.effects) applyEffects(o.effects);
    if (el && el.classList) el.classList.add('found');
    if (plan.kind !== 'free') {
      state.obsCount = (state.obsCount || 0) + 1;
      const cost = observeCost();
      /* risk 叠在 knockPerObs 之上，并按档位的敲门倍率放大（噩梦 ×2，§12.6） */
      const riskMul = Math.max(1, runDiff().knockPerObs || 1);
      const knockGain = knockDeltaFor(state.obsCount) + (o.risk ? +o.risk * riskMul : 0);
      const stats = { clock: cost.clock, knock: knockGain };
      if (plan.kind === 'battery') stats.battery = -cost.battery;
      if (plan.kind === 'eye') stats.corruption = plan.corruption;
      if (state.flags.ankle_hurt) stats.clock += 2;
      const parts = [`时间 +${stats.clock} 分`];
      if (knockGain) parts.push(`敲门 +${knockGain}`);
      if (stats.battery) parts.push(`电量 −${cost.battery}%`);
      if (stats.corruption) parts.push(`复苏 +${stats.corruption}`);
      applyEffects({ stats, toast: '代价 · ' + parts.join(' · '), toastKind: 'warn' });
      // 多看一眼，就多听见一声：那是他在门外，把你的注意力记在账上
      if (window.Sound) {
        const near = knockTier() >= 2;
        setTimeout(() => Sound.play(near ? 'knockClose' : 'knock'), 340);
      }
    }
  }

  function refreshObserveEntry() {
    // 关闭卡片后：若还有看得见的、未看的热点就继续；否则退出观察，回到选项。
    const n = node;
    const remain = observationVisible(n).length;
    if (remain > 0) {
      renderHotspots(n);
      renderChoices(n);
      return;
    }
    exitObserve();
  }

  function exitObserve() {
    observeMode = false;
    $('#observe-layer').hidden = true;
    $('#observe-bar').hidden = true;
    $('#observe-layer').innerHTML = '';
    $('#dialogue').style.opacity = '';
    $('#choices').hidden = false;
    if (node) renderChoices(node);
    /* 焦点回到「观察四周」，键盘用户可以接着往下走 */
    const back = $('#choices .observe-entry') || $('#choices .choice');
    if (back && typeof back.focus === 'function') back.focus();
  }

  function hideObserve() {
    $('#observe-layer').hidden = true;
    $('#observe-bar').hidden = true;
    $('#observe-card').hidden = true;
  }

  /* =========================================================
     效果 / 条件
     ========================================================= */
  function check(cond) {
    if (!cond) return true;
    if (typeof cond === 'function') return cond(state);
    /* 档位条件：让数据能表达"只在噩梦档加门槛"这类规则（如 f8:1） */
    if (cond.diff) {
      const cur = (state && state.difficulty) || 'standard';
      const okDiff = Array.isArray(cond.diff) ? cond.diff.includes(cur) : cond.diff === cur;
      if (!okDiff) return false;
    }
    if (cond.flag && !state.flags[cond.flag]) return false;
    if (cond.notFlag && state.flags[cond.notFlag]) return false;
    if (cond.clue && !state.clues.includes(cond.clue)) return false;
    if (cond.item && !(state.items[cond.item] > 0)) return false;
    if (cond.minEyes != null && state.stats.eyes < cond.minEyes) return false;
    if (cond.minKnock != null && state.stats.knock < cond.minKnock) return false;
    if (cond.maxBattery != null && state.stats.battery > cond.maxBattery) return false;
    if (cond.minBattery != null && (state.stats.battery == null ? 100 : state.stats.battery) < cond.minBattery) return false;
    if (cond.minCorruption != null && state.stats.corruption < cond.minCorruption) return false;
    /* 设计 §8.4：新增两个门槛（g7 的"还剩几个人"、f10 的"人性还剩多少"） */
    if (cond.minSurvivors != null && (state.stats.survivors || 0) < cond.minSurvivors) return false;
    if (cond.maxCorruption != null && (state.stats.corruption || 0) > cond.maxCorruption) return false;
    /* 幻觉选项：只在"脑子已经不可靠"时出现，且门槛随档位走（设计 §3.10）。
       故事档永不出现——它不靠幻觉制造难度；标准档错乱（≤34）；噩梦档恍惚（≤59）。
       它们是"出现/不出现"，不是"灰着"：渲染时会整条隐藏，见 renderChoices。 */
    if (cond.hallucination) {
      const diff = (state && state.difficulty) || 'standard';
      if (diff === 'story') return false;
      const at = diff === 'nightmare' ? 59 : 34;
      if (sanityValue() > at) return false;
    }
    /* 理智门槛：只锁"过得干不干净"，不锁"能不能过"（数据不变量见 tools/validate.js）。
       故事档是硬豁免——它卖的是"把这一夜看完"，理智只改文本与表现，不锁任何选项（设计 §3.10）。 */
    const storyFree = (state.difficulty || 'standard') === 'story';
    if (!storyFree) {
      if (cond.minSanity != null && (state.stats.sanity || 0) < cond.minSanity) return false;
      if (cond.maxSanity != null && (state.stats.sanity || 0) > cond.maxSanity) return false;
    }
    if (cond.allClues && !cond.allClues.every(c => state.clues.includes(c))) return false;
    return true;
  }

  /* 资源见底：统一钩子。默认只写一条日志 + 一句叙事提示，不判死、不改剧情。
     想在归零时做别的事（扣血、跳节点），往 HOOKS.resourceEmpty 里挂函数即可。 */
  function guardedStats() {
    const out = {};
    for (const k in RESOURCE_EMPTY) {
      out[k] = state.stats[k] == null ? (k === 'battery' ? 100 : 0) : state.stats[k];
    }
    return out;
  }

  function checkResourceEmpty(prev) {
    if (!state) return;
    for (const k in RESOURCE_EMPTY) {
      const cur = state.stats[k] == null ? (k === 'battery' ? 100 : 0) : state.stats[k];
      const flag = '__empty_' + k;
      if (!RESOURCE_EMPTY[k].test(cur) || state.flags[flag]) continue;
      if (prev && RESOURCE_EMPTY[k].test(prev[k])) continue;   // 上一刻已经是空的，不重复报
      state.flags[flag] = true;
      if (typeof console !== 'undefined' && console.warn) console.warn('[resource-empty]', k, cur, state.node);
      toast(RESOURCE_EMPTY[k].text, 'warn');
      HOOKS.resourceEmpty.forEach(fn => {
        try { fn(k, cur, state); } catch (e) { console.error('resourceEmpty hook 抛错', e); }
      });
    }
  }

  /* 理智的增减按档位缩放（设计 §3.10）：
       故事 扣 ×0.5（向下取整、最小 1）/ 恢复 ×1.5（向下取整）
       标准 ×1 / ×1
       噩梦 扣 ×1.25（向上取整）/ 恢复 ×1
     0 不缩放；只动 sanity，不碰别的资源。 */
  function scaleSanity(v) {
    const n = +v;
    if (!n) return 0;
    const id = (state && state.difficulty) || 'standard';
    if (id === 'story') {
      return n < 0 ? -Math.max(1, Math.floor(Math.abs(n) * 0.5)) : Math.floor(n * 1.5);
    }
    if (id === 'nightmare') {
      return n < 0 ? -Math.ceil(Math.abs(n) * 1.25) : n;
    }
    return n;
  }

  function applyEffects(fx, opts = {}) {
    if (!fx) return;
    const prev = guardedStats();
    if (fx.flags) Object.assign(state.flags, fx.flags);
    if (fx.set) {
      /* clock 是"时间锚点"，只能用 max 推进：赋值会让看得太贪的玩家被送回锚点（时间倒流）。
         但数据里的锚点写的是**"当天时刻"**（如 331 = 05:31），而 stats.clock 是"从开局起的绝对分钟数"
         （22:10 开局的 05:31 是 1771）。不换算的话锚点永远小于当前值，被 max 吃掉——
         终幕就会出现"HUD 停在 04:11、正文写着五点三十一分"。 */
      const set = Object.assign({}, fx.set);
      if (set.clock != null) {
        const start = toMinutes((STORY.meta && STORY.meta.startClock) || '22:10');
        let target = +set.clock;
        if (target < start) target += 1440;          // 跨午夜：翻到"这一夜"的同一段
        set.clock = Math.max(state.stats.clock || 0, target);
      }
      Object.assign(state.stats, set);
    }
    if (fx.stats) for (const k in fx.stats) {
      /* 只缩放理智：故事档扣得少、恢复得多；噩梦扣得更多。其它 stats 一律原样（设计 §3.10） */
      state.stats[k] = (state.stats[k] || 0) + (k === 'sanity' ? scaleSanity(fx.stats[k]) : fx.stats[k]);
    }
    if (fx.clues) fx.clues.forEach(c => addClue(c, opts.silent));
    if (fx.codex) fx.codex.forEach(c => addCodex(c, opts.silent));
    if (fx.items) for (const k in fx.items) state.items[k] = (state.items[k] || 0) + fx.items[k];
    if (fx.toast && !opts.silent) toast(fx.toast, fx.toastKind);
    if (fx.fx) doFx(fx.fx);
    if (fx.sfx && window.Sound) Sound.play(fx.sfx);
    state.stats.clock = state.stats.clock || 0;
    normalizeStats();
    checkResourceEmpty(prev);
    updateHUD(true);
  }

  function addClue(id, silent) {
    if (state.clues.includes(id)) return;
    state.clues.push(id);
    const c = CODEX.clue.find(x => x.id === id);
    if (!silent) toast(`线索 · ${c ? c.name : id}`, 'clue');
    if (c && !state.codex.includes(id)) state.codex.push(id);
    if (!unlock.codex.includes(id)) unlock.codex.push(id);
    saveJSON(UNLOCK_KEY, unlock);
  }

  function addCodex(id, silent) {
    if (state.codex.includes(id)) return;
    state.codex.push(id);
    if (!unlock.codex.includes(id)) { unlock.codex.push(id); saveJSON(UNLOCK_KEY, unlock); }
    const all = [...CODEX.ghost, ...CODEX.person, ...CODEX.clue, ...CODEX.memory];
    const c = all.find(x => x.id === id);
    if (!silent && c) toast(`档案 · ${c.name}`, 'clue');
  }

  function doFx(kind) {
    const stage = $('#stage');
    if (kind === 'shake' && settings.fx) {
      stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
    } else if (kind === 'flash') {
      const f = $('#fx-flash'); f.classList.remove('fire'); void f.offsetWidth; f.classList.add('fire');
    } else if (kind === 'ghost' || kind === 'blood' || kind === 'dawn' || kind === 'void' || kind === '') {
      const m = kind === '' ? '' : kind;
      stage.className = 'stage' + (m ? ' ' + m : '');
      applyAtmosphere();
    } else if (kind === 'dread') {
      $('#dread').classList.add('on');
      if (window.Sound) Sound.play('heartbeat');
    } else if (kind === 'calm') {
      $('#dread').classList.remove('on', 'soft');
    }
  }

  /* =========================================================
     HUD
     ========================================================= */
  let lastHUD = {};
  function updateHUD(force) {
    if (!state) return;
    const s = state.stats;
    const clock = fmtClock(s.clock);
    if (force || lastHUD.clock !== clock) {
      $('#v-clock').textContent = clock;
      if (lastHUD.clock && s.clock > lastHUD.clockMin) pulseStat('#stat-clock');
      lastHUD.clock = clock; lastHUD.clockMin = s.clock;
    }
    /* H3：没听过录音就不知道这个数字是什么，显示 ?（设计 D13） */
    const heard = !!(state.flags.heard_it || state.flags.listened);
    if (force || lastHUD.knock !== s.knock || lastHUD.heard !== heard) {
      $('#v-knock').textContent = heard ? s.knock : '?';
      if (lastHUD.knock !== undefined && s.knock > lastHUD.knock) pulseStat('#stat-knock');
      lastHUD.knock = s.knock; lastHUD.heard = heard;
    }
    if (force || lastHUD.eyes !== s.eyes) {
      $('#v-eyes').textContent = s.eyes;
      if (lastHUD.eyes !== undefined && s.eyes > lastHUD.eyes) pulseStat('#stat-eyes');
      lastHUD.eyes = s.eyes;
    }
    if (force || lastHUD.corrupt !== s.corruption) {
      $('#v-corrupt').style.width = clamp(s.corruption, 0, 100) + '%';
      lastHUD.corrupt = s.corruption;
    }
    /* Q5：复苏逼近失控线（阈值 −5）时 HUD 转血色，并只警告一次 */
    const warnAt = runDiff().corruption.brk - 5;
    const nearBreak = (s.corruption || 0) >= warnAt;
    if (lastHUD.nearBreak !== nearBreak) {
      lastHUD.nearBreak = nearBreak;
      $('#stat-corrupt').classList.toggle('critical', nearBreak);
    }
    if (nearBreak && !state.flags.__corruption_warn) {
      state.flags.__corruption_warn = true;
      toast('镜子里的那个人，比你晚半秒才抬头。', 'warn');
    }
    const bat = Math.max(0, Math.min(100, Math.round(s.battery == null ? 100 : s.battery)));
    if (force || lastHUD.battery !== bat) {
      $('#v-battery').textContent = bat + '%';
      $('#stat-battery').hidden = bat >= 100;
      if (lastHUD.battery !== undefined && bat < lastHUD.battery) pulseStat('#stat-battery');
      lastHUD.battery = bat;
    }
    // 死线：距离次日 05:30 还剩不到 30 分钟时高亮
    const mins = ((Math.round(s.clock) % 1440) + 1440) % 1440;
    const remainDays = (toMinutes('05:30') - mins + 1440) % 1440;
    const dead = remainDays <= 30;
    $('#stat-clock').classList.toggle('deadline', dead);

    // 敲门的分级：听得越多，HUD 越红、环境里开始有心跳
    const tier = knockTier();
    if (lastHUD.tier !== tier) {
      lastHUD.tier = tier;
      $('#stat-knock').classList.toggle('warn', tier === 1);
      $('#stat-knock').classList.toggle('danger', tier === 2);
      $('#stage').classList.toggle('pressed', tier === 2);
      if (tier >= 1) startKnockAmbience(tier); else stopKnockAmbience();
      if (window.Sound && Sound.droneTier) Sound.droneTier(tier);
    }
    /* 理智：只在跨档时响一次（不给数字，不给条） */
    const band = sanityBand();
    if (lastHUD.sanityBand !== band.daze) {
      const first = lastHUD.sanityBand === undefined;
      lastHUD.sanityBand = band.daze;
      document.body.dataset.daze = band.daze ? String(band.daze) : '';
      if (!first) {
        const line = (state.difficulty === 'story' ? STORY_DAZE_LINES : DAZE_LINES)[band.daze];
        if (line) toast(line, 'warn');
        if (band.daze >= 1 && window.Sound) Sound.play('heartbeat');
      }
    }
    const d = runDiff();
    if (lastHUD.diff !== d.id) { lastHUD.diff = d.id; updateDiffChip(); }
    applyAtmosphere();
  }

  /* 理智档位（隐性方案 B+）：只在跨档时给一次信号，HUD 上不出现数字。
       0 清醒 / 1 动摇 / 2 恍惚 / 3 错乱 / 4 断片（由 forcedTarget 处理） */
  const SANITY_BANDS = [
    { at: 80, name: '清醒', daze: 0 },
    { at: 60, name: '动摇', daze: 1 },
    { at: 35, name: '恍惚', daze: 2 },
    { at: 15, name: '错乱', daze: 3 },
    { at: 0,  name: '错乱', daze: 3 }   // 1–14 仍算错乱；0 才是断片，由引擎转场
  ];
  /* 跨档时的一句"表现"。故事档是专属文案：它不锁任何选项，靠叙述变调让你知道自己不对劲。 */
  const DAZE_LINES = {
    1: '你听见自己的呼吸，比刚才快了一点。',
    2: '台词在你眼前重影，你花了半秒才认出一个字。',
    3: '你开始分不清哪句话是自己想的。'
  };
  const STORY_DAZE_LINES = {
    1: '你眨了一下眼。走廊比刚才长了一点，也可能是你走慢了。',
    2: '你听见有人在数数。数到七的时候，声音停了——你还在心里数。',
    3: '你低头看自己的手。它比你先动了一步。'
  };
  function sanityValue() {
    return state ? (state.stats.sanity == null ? 100 : state.stats.sanity) : 100;
  }
  function sanityBand() {
    const v = sanityValue();
    for (const b of SANITY_BANDS) if (v >= b.at) return b;
    return SANITY_BANDS[SANITY_BANDS.length - 1];
  }

  /* 敲门分级：0 平常 / 1 警告 / 2 危险。阈值随难度走（§6.1：10/13、9/12、8/10）。 */
  function knockTier() {
    const k = state ? (state.stats.knock || 0) : 0;
    const t = runDiff().knock;
    if (t.danger != null && k >= t.danger) return 2;
    if (t.warn != null && k >= t.warn) return 1;
    return 0;
  }

  /* 电量分级：0 正常 / 1 偏低 / 2 将尽。既是 HUD 的事，也是"还能看清几处"的依据。 */
  function batteryTier() {
    const b = state ? clamp(state.stats.battery == null ? 100 : state.stats.battery, 0, 100) : 100;
    return b <= BATTERY_CRIT ? 2 : b <= BATTERY_LOW ? 1 : 0;
  }

  /* 恐惧层级：敲门听得越多、电越少，画面越"脏"。
     具体长什么样全交给 CSS（.dread-lv1 / .dread-lv2）——引擎只负责判定层级，
     这样调颜色不用改代码，也不会把数值写死在样式里。 */
  function dreadLevel() {
    return clamp(Math.max(knockTier(), batteryTier()), 0, 2);
  }

  function applyAtmosphere() {
    const stage = $('#stage');
    if (!stage) return;
    const lv = state ? dreadLevel() : 0;
    stage.classList.toggle('dread-lv1', lv === 1);
    stage.classList.toggle('dread-lv2', lv === 2);
    const bt = state ? batteryTier() : 0;
    stage.classList.toggle('bat-low', bt === 1);
    stage.classList.toggle('bat-empty', bt === 2);
    /* H3：电量低于 30% 的舞台标记（设计文档点名的类名就是 .low-battery） */
    stage.classList.toggle('low-battery', !!state && (state.stats.battery == null ? 100 : state.stats.battery) < BATTERY_LOW);
    const dread = $('#dread');
    if (dread) {
      const moody = stage.classList.contains('ghost') || stage.classList.contains('blood');
      dread.classList.toggle('on', lv >= 2 || moody);
      dread.classList.toggle('soft', lv === 1 && !moody);
    }
  }

  function startKnockAmbience(tier) {
    if (!window.Sound || !Sound.available || !Sound.available()) return;
    if (knockTimer && knockTierLast === tier) return;
    stopKnockAmbience();
    knockTierLast = tier;
    knockTimer = setInterval(() => {
      if (window.Sound) Sound.play('heartbeat');
    }, tier >= 2 ? 2400 : 3800);
  }

  function stopKnockAmbience() {
    if (knockTimer) { clearInterval(knockTimer); knockTimer = null; }
    knockTierLast = 0;
  }

  function pulseStat(sel) {
    const el = $(sel);
    if (!el) return;
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  }

  /* =========================================================
     Toast
     ========================================================= */
  function toast(text, kind) {
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = text;
    $('#toast-wrap').appendChild(t);
    setTimeout(() => t.remove(), 4200);
    if (window.Sound) Sound.play(kind === 'warn' ? 'deny' : 'ui');
  }

  /* =========================================================
     转场 / 幕卡
     ========================================================= */
  function curtain(on) {
    let c = $('.curtain');
    if (!c) { c = document.createElement('div'); c.className = 'curtain'; $('#stage').appendChild(c); }
    return new Promise(res => {
      c.classList.toggle('on', on);
      setTimeout(res, on ? 520 : 560);
    });
  }

  function showActCard(card) {
    return new Promise(res => {
      const el = document.createElement('div');
      el.className = 'act-card';
      el.innerHTML = `<p class="k">${card.kicker || ''}</p><h2>${card.title || ''}</h2><p class="s">${card.sub || ''}</p>`;
      $('#stage').appendChild(el);
      if (!unlock.seenAct) unlock.seenAct = [];
      if (!unlock.seenAct.includes(card.id)) { unlock.seenAct.push(card.id); saveJSON(UNLOCK_KEY, unlock); }
      const done = () => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 520); };
      setTimeout(done, 2400);
      el.addEventListener('click', done);
    });
  }

  /* =========================================================
     结局
     ========================================================= */
  function showEnding(id) {
    stopKnockAmbience();
    const e = ENDINGS.find(x => x.id === id) || ENDINGS[0];
    if (!unlock.endings.includes(id)) unlock.endings.push(id);
    saveJSON(UNLOCK_KEY, unlock);
    state.ending = id;
    const d = runDiff();
    /* 坏结局（按 §6.4：e_door / e_stairs）算"死"，给一次回退：
         故事 → 回到这一步（资源一起回）
         标准 → 回本幕开头（资源维持当时数值）
         噩梦 → 回本幕开头，并付 knock+3 / survivors−1
       其它结局（含复苏失控的 end_absorb）没有回退（"不可撤销"）。 */
    const isDeath = d.death.endings.indexOf(id) >= 0
      && (state.rollbackCount || 0) < (d.death.maxRollback || 0)
      && !!deathTarget();
    state.deathPending = isDeath ? { ending: id, mode: d.death.mode } : null;
    persist(false);
    const stats = state.stats;
    $('#end-kicker').textContent = e.kicker || '结局';
    $('#end-title').textContent = e.name;
    $('#end-art').src = ART.ending(e.id);
    $('#end-art').alt = e.name;
    $('#end-body').textContent = e.body;
    $('#end-stat').textContent = `${d.short}档　·　`
      + (state.cycle > 1 ? `第 ${state.cycle} 次走进这一夜　·　` : '')
      + `离开学校的人：${stats.survivors || 0} / 40　·　听觉敲门：${stats.knock} 次　·　鬼眼：${stats.eyes} 只　·　复苏：${stats.corruption}%　·　时刻：${fmtClock(stats.clock)}`;
    const again = $('#modal-end [data-act="again"]');
    if (again) {
      if (!isDeath) again.textContent = '再来一夜';
      else if (d.death.mode === 'node') again.textContent = '回到这一步';
      else again.textContent = '回本场景开头';
    }
    openModal('#modal-end');
    if (window.Sound) { Sound.ambience(false); Sound.play('ending'); }
    refreshBoot();
  }

  function openGallery() {
    const box = $('#gallery-body');
    box.innerHTML = '';
    ENDINGS.forEach((e, i) => {
      const got = unlock.endings.includes(e.id);
      const d = document.createElement('div');
      d.className = 'end-card' + (got ? '' : ' locked');
      d.innerHTML = got
        ? `<img class="end-card-art" src="${ART.ending(e.id)}" alt="${e.name}">`
          + `<div class="no">ENDING ${pad(i + 1)}</div><h4>${e.name}</h4><p>${e.hint}</p>`
        : `<div class="end-card-art"></div>`
          + `<div class="no">ENDING ${pad(i + 1)}</div><h4>？？？</h4><p>尚未抵达的终点。</p>`;
      box.appendChild(d);
    });
    openModal('#modal-gallery');
  }

  /* =========================================================
     档案
     ========================================================= */
  function openCodex(tab) {
    renderCodex(tab || ($('#codex-tabs .active') || {}).dataset?.tab || 'clue');
    openModal('#modal-codex');
  }

  function renderCodex(tab) {
    const box = $('#codex-body');
    const data = CODEX[tab] || [];
    box.innerHTML = '';
    /* 理智的唯一"可查"入口：只写档位名，不写数字（隐性方案 B+）。
       噩梦档不显示——连"我有多糊涂"都不告诉玩家（设计 §3.10）。 */
    if (state && (state.difficulty || 'standard') !== 'nightmare') {
      const line = document.createElement('div');
      line.className = 'codex-sanity';
      line.textContent = `理智 · ${sanityBand().name}`;
      box.appendChild(line);
    }
    const has = id => (state ? state.clues.includes(id) : false) || unlock.codex.includes(id);

    // 线索页：先在顶部画出主线推理链，再把线索连成图
    if (tab === 'clue' && window.CLUE_CHAIN) {
      const done = window.CLUE_CHAIN.filter(s => s.clues.every(has)).length;
      const chain = document.createElement('div');
      chain.className = 'chain';
      chain.innerHTML = `<div class="chain-head">主线推理链<span class="chain-progress">${done} / ${window.CLUE_CHAIN.length}</span></div>`
        + window.CLUE_CHAIN.map((s, i) => {
          const ok = s.clues.every(has);
          const names = s.clues.map(c => (CODEX.clue.find(x => x.id === c) || {}).name || c);
          return `<div class="chain-step${ok ? '' : ' locked'}">`
            + `<span class="no">${i + 1}</span>`
            + `<span class="st">${ok ? s.step : '？？？'}</span>`
            + `<span class="note">${ok ? s.note : '线索不足——还差：' + names.filter((n, k) => !has(s.clues[k])).join('、')}</span>`
            + `</div>`;
        }).join('');
      box.appendChild(chain);
    }

    let any = false;
    data.forEach(item => {
      const isClue = tab === 'clue';
      const got = isClue ? has(item.id) : unlock.codex.includes(item.id);
      if (!got && !item.always) return;
      any = true;
      const d = document.createElement('div');
      d.className = 'codex-item';
      let links = '';
      if (isClue && item.links && item.links.length) {
        links = '<div class="clue-links">相关：' + item.links.map(id => {
          const rel = CODEX.clue.find(x => x.id === id);
          const name = rel ? rel.name : id;
          const known = has(id);
          return `<button class="link-chip${known ? '' : ' locked'}" data-clue="${id}">${known ? name : '？？？'}</button>`;
        }).join('') + '</div>';
      }
      d.innerHTML = `<h4>${item.name}${item.en ? `<span class="en">${item.en}</span>` : ''}</h4><p>${item.text}</p>${links}`;
      box.appendChild(d);
    });
    if (!any && !box.querySelector('.chain')) box.innerHTML = '<p class="codex-empty">还没有记下任何东西。</p>';

    // 点相关线索 → 滚到它那儿并闪一下
    $$('#codex-body .link-chip:not(.locked)').forEach(b => b.addEventListener('click', () => {
      const target = $$('#codex-body .codex-item').find(el =>
        (el.querySelector('h4') || {}).textContent &&
        (el.querySelector('h4').textContent.indexOf(
          ((CODEX.clue.find(x => x.id === b.dataset.clue) || {}).name) || '\u0000') === 0));
      if (!target) { toast('这条线索还没解锁', 'warn'); return; }
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
    }));
  }

  /* =========================================================
     弹层控制
     ========================================================= */
  function openModal(sel) {
    const m = $(sel);
    if (!m) return;
    if (sel === '#modal-menu') updateDiffChip();   // 暂停菜单里显示当前档位与存档规则
    m.hidden = false;
    $$('.modal:not([hidden])').forEach(o => { if (o !== m) o.hidden = true; });
  }
  function closeModal(m) { if (m) m.hidden = true; }
  function closeAllModals() { $$('.modal').forEach(m => m.hidden = true); }

  function confirmBox(text, cb) {
    $('#confirm-text').textContent = text;
    $('#confirm').hidden = false;
    const yes = $('#confirm-yes'), no = $('#confirm-no');
    const clean = () => { yes.onclick = null; no.onclick = null; $('#confirm').hidden = true; };
    yes.onclick = () => { clean(); cb(true); };
    no.onclick = () => { clean(); cb(false); };
  }
  function closeConfirm(v) { $('#confirm').hidden = true; }

  function toggleSound() {
    if (!window.Sound) return;
    const on = Sound.toggle();
    $('#btn-sound').classList.toggle('off', !on);
    toast(on ? '声音 开' : '声音 关');
  }

  /* =========================================================
     启动
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    init();
    const q = new URLSearchParams(location.search);
    // 调试：直接点亮若干结局（用于看回廊插画）
    if (q.get('unlock')) {
      q.get('unlock').split(',').forEach(id => { if (!unlock.endings.includes(id)) unlock.endings.push(id); });
      saveJSON(UNLOCK_KEY, unlock);
      refreshBoot();   // 让标题菜单立刻反映出解锁状态（周目入口）
    }
    if (q.get('node')) {
      setTimeout(() => {
        state = freshState();
        const dq = normDiff(q.get('diff') || q.get('difficulty'));
        if (dq) state.difficulty = dq;
        if (q.get('eyes')) state.stats.eyes = +q.get('eyes');
        if (q.get('knock')) state.stats.knock = +q.get('knock');
        if (q.get('battery')) state.stats.battery = +q.get('battery');
        if (q.get('corr')) state.stats.corruption = +q.get('corr');
        if (q.get('sanity')) state.stats.sanity = +q.get('sanity');
        if (q.get('clock')) state.stats.clock = q.get('clock').split(':').reduce((a, b) => a * 60 + +b, 0);
        if (q.get('clues')) q.get('clues').split(',').forEach(c => state.clues.push(c));
        if (q.get('flags')) q.get('flags').split(',').forEach(f => state.flags[f] = true);
        if (q.get('items')) q.get('items').split(',').forEach(f => state.items[f] = 1);
        if (q.get('survivors')) state.stats.survivors = +q.get('survivors');
        $('#boot').style.display = 'none';
        $('#game').setAttribute('aria-hidden', 'false');
        if (window.Sound) Sound.begin();
        resetStage();
        runNode(q.get('node'), { silent: true, force: true });
        if (q.get('codex')) setTimeout(() => { try { openCodex(q.get('codex')); } catch (e) { console.error('openCodex failed', e); } }, 150);
        if (q.get('gallery')) setTimeout(() => { try { openGallery(); } catch (e) { console.error('openGallery failed', e); } }, 150);
        if (q.get('obs')) {
          settings.speed = 70; applySettings();
          const t = setInterval(() => {
            const b = $('#choices .observe-entry');
            if (b) { clearInterval(t); b.click(); }
            else advance();
          }, 180);
        }
        if (q.get('fast')) {
          settings.speed = 70; applySettings();
          setInterval(() => {
            if (!$('#modal-end').hidden) return;
            if (observeMode) {
              const card = $('#observe-card');
              if (card && !card.hidden) { $('#observe-card-close').click(); return; }
              /* 太黑的点点了也没用，直接退开，否则自动跑会原地空转 */
              const hs = $$('#observe-layer .hotspot:not(.too-dark)');
              if (hs.length) hs[0].click(); else $('#observe-exit').click();
              return;
            }
            /* 优先选剧情选项：观察是可选支线，自动跑不该卡在"看完了/看不了"上 */
            const cs = $$('.choice:not(.locked):not(.observe-entry)');
            if (cs.length) { cs[0].click(); return; }
            const obs = $('.choice.observe-entry:not(.locked)');
            if (obs) { obs.click(); return; }
            advance();
          }, 160);
        }
      }, 200);
    } else if (q.get('auto')) {
      const log = [];
      window.addEventListener('error', e => log.push(e.message));
      settings.speed = 70; settings.fx = false; applySettings();
      setTimeout(() => { startNew(); }, 300);
      let steps = 0, stuck = 0;
      const report = (tag) => {
        clearInterval(tick);
        const box = document.createElement('pre');
        box.id = 'auto-report';
        box.style.cssText = 'position:fixed;left:12px;top:12px;z-index:99999;color:#9f9;background:#000;font:12px monospace;padding:8px;max-width:60vw;white-space:pre-wrap';
        box.textContent = `AUTO${tag ? ' (' + tag + ')' : ''} node=${state && state.node} steps=${steps} `
          + `ending=${!$('#modal-end').hidden} observe=${observeMode} busy=${busy} typing=${typing} waiting=${!!advanceResolve} errors=${log.length}\n`
          + `text=${JSON.stringify(($('#story-text') || {}).textContent || '')}\n`
          + log.join('\n');
        document.body.appendChild(box);
      };
      const tick = setInterval(() => {
        if (!$('#modal-end').hidden) { report(); return; }
        if (observeMode) {
          const card = $('#observe-card');
          if (card && !card.hidden) { $('#observe-card-close').click(); return; }
          const hs = $$('#observe-layer .hotspot:not(.found):not(.too-dark)');
          if (hs.length) hs[0].click(); else $('#observe-exit').click();
          return;
        }
        /* 优先选剧情选项；没有剧情选项时才去观察（观察是可选支线） */
        const cs = $$('.choice:not(.locked):not(.observe-entry)');
        if (cs.length) cs[Math.floor(Math.random() * cs.length)].click();
        else {
          const obs = $('.choice.observe-entry:not(.locked)');
          if (obs) { obs.click(); }
          else {
            /* 用"点击舞台"推进，而不是直接调 advance()：
               这条路和玩家的真实操作完全一致，冒烟测到的问题才等于玩家会遇到的问题。 */
            const stage = $('#stage');
            if (stage && stage.click) stage.click(); else advance();
          }
        }
        /* 死锁判定：没有选项、不在打字、不在过场，且 advance() 之后仍然"在等玩家"。
           过场（幕卡/黑幕）是 busy=true，长台词是 typing=true，都不算卡住。 */
        if (!busy && !typing && cs.length === 0 && advanceResolve) {
          if (++stuck > 40) { report('stuck'); return; }
        } else stuck = 0;
        if (++steps > 4000) report('max-steps');
      }, 140);
    }
  });
  window.__game = {
    get state() { return state; },
    runNode, openGallery, openCodex,
    /* 状态机内部量：调试与测试用（?auto=1 卡住时最需要看这四个） */
    get busy() { return busy; },
    get typing() { return typing; },
    get waiting() { return !!advanceResolve; },
    get observing() { return observeMode; },
    get playGen() { return playGen; },
    advance,
    /* 难度 / 资源管线：给测试与调试用 */
    DIFFICULTY, HOOKS,
    setDifficulty, difficulty: () => runDiff(),
    batteryTier, dreadLevel, observeCost, observationVisible, observationRemaining,
    sanityBand, sanityValue, SANITY_BANDS, sanityGateFailed, scaleSanity, applyEffects,
    DAZE_LINES, STORY_DAZE_LINES,
    lightPlan, knockDeltaFor, elapsedMin, minutesUntil, hotspotTier,
    restartNode, rollbackAfterDeath, pressCorruption, deathTarget,
    migrateSave, snapshot
  };
})();
