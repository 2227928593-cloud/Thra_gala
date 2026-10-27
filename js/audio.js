/* =========================================================
   恐怖复苏 · 敲门  —  程序化音效
   不依赖任何音频文件：所有声音由 WebAudio 实时合成。
   ========================================================= */
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let ambienceBus = null;
  let ambienceNodes = null;
  let droneWanted = 0;      // 敲门分级想要的 drone 档位（环境音未启动时先记着）
  let started = false;
  let enabled = true;
  let volume = 0.7;
  let ambienceVol = 0.6;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    ambienceBus = ctx.createGain();
    ambienceBus.gain.value = 1;
    ambienceBus.connect(master);
    return ctx;
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  /* ---------- 基础构件 ---------- */
  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function env(gain, t0, attack, decay, peak) {
    gain.gain.cancelScheduledValues(t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  function thump(t, freq, dur, amp) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(24, freq * 0.42), t + dur);
    env(g, t, 0.004, dur, amp);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    return g;
  }

  function hitNoise(t, freq, q, dur, amp, type) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.4);
    const bp = ctx.createBiquadFilter();
    bp.type = type || 'bandpass';
    bp.frequency.setValueAtTime(freq, t);
    bp.Q.value = q;
    const g = ctx.createGain();
    env(g, t, 0.003, dur, amp);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
    return { g, bp };
  }

  function tone(t, freq, dur, amp, type, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    env(g, t, 0.006, dur, amp);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.06);
    return { o, g };
  }

  /* ---------- 音效定义 ---------- */
  const SFX = {
    ui(t) { tone(t, 1800, 0.03, 0.05, 'sine'); },
    click(t) { tone(t, 320, 0.05, 0.05, 'triangle'); },
    deny(t) {
      const { o } = tone(t, 120, 0.16, 0.09, 'square');
      o.frequency.exponentialRampToValueAtTime(70, t + 0.15);
    },
    clue(t) {
      tone(t, 880, 0.5, 0.05, 'sine');
      tone(t + 0.02, 1320, 0.7, 0.035, 'sine');
      tone(t + 0.05, 1760, 0.9, 0.02, 'sine');
    },
    knock(t) {
      // 一长，两短
      const base = 0.62;
      [0, base, base * 1.72].forEach((off, i) => {
        const tt = t + off;
        thump(tt, 74, 0.28, 0.34);
        hitNoise(tt, 220, 1.2, 0.12, 0.16, 'lowpass');
      });
    },
    knockSingle(t) {
      thump(t, 80, 0.22, 0.3);
      hitNoise(t, 260, 1.4, 0.1, 0.12, 'lowpass');
    },
    /* 他离得很近了：同样的节奏，更沉、更慢，还带着门板被压出的呻吟 */
    knockClose(t) {
      const base = 0.78;
      [0, base, base * 1.7].forEach(off => {
        const tt = t + off;
        thump(tt, 58, 0.38, 0.44);
        hitNoise(tt, 150, 1.0, 0.2, 0.24, 'lowpass');
      });
      const { o } = tone(t + 0.12, 118, 0.95, 0.05, 'sawtooth');
      o.frequency.exponentialRampToValueAtTime(74, t + 1.0);
    },
    heartbeat(t) {
      thump(t, 62, 0.22, 0.22);
      thump(t + 0.3, 54, 0.26, 0.15);
    },
    scare(t) {
      [110, 138.6, 174.6, 233].forEach((f, i) => {
        const { o, g } = tone(t, f, 1.4, 0.05, 'sawtooth');
        o.frequency.exponentialRampToValueAtTime(f * 0.86, t + 1.3);
        g.gain.setValueAtTime(0.0001, t + 0.4);
      });
      hitNoise(t, 3000, 0.6, 1.2, 0.06, 'highpass');
      thump(t, 48, 0.9, 0.26);
    },
    whisper(t) {
      for (let i = 0; i < 4; i++) {
        const tt = t + i * 0.19 + Math.random() * 0.05;
        const { bp, g } = hitNoise(tt, 900 + Math.random() * 1400, 8, 0.22, 0.035);
        bp.frequency.exponentialRampToValueAtTime(500 + Math.random() * 400, tt + 0.2);
      }
    },
    phone(t) {
      const ring = (tt) => {
        for (const f of [450, 640]) {
          const { o, g } = tone(tt, f, 0.42, 0.045, 'sine');
          g.gain.setValueAtTime(0.0001, tt + 0.36);
        }
      };
      ring(t); ring(t + 0.55);
    },
    rain(t) {
      const { g } = hitNoise(t, 1200, 0.4, 2.2, 0.05);
    },
    step(t) {
      const { g } = hitNoise(t, 220, 1.6, 0.16, 0.09, 'lowpass');
      thump(t, 55, 0.12, 0.1);
    },
    door(t) {
      const { o, g } = tone(t, 92, 1.1, 0.06, 'sawtooth');
      o.frequency.exponentialRampToValueAtTime(46, t + 1);
      hitNoise(t + 0.06, 500, 2, 0.5, 0.07);
    },
    ending(t) {
      [146.8, 174.6, 220, 293.7].forEach((f, i) => {
        const { g } = tone(t + i * 0.14, f, 4.2, 0.032, 'sine');
        g.gain.setValueAtTime(0.0001, t + 3.2);
      });
    },
    rise(t) {
      const { o, g } = tone(t, 70, 2.2, 0.08, 'sawtooth');
      o.frequency.exponentialRampToValueAtTime(320, t + 2.1);
      hitNoise(t, 400, 0.8, 2.0, 0.05, 'bandpass');
    }
  };

  /* ---------- 环境音 ---------- */
  function startAmbience() {
    if (!ctx || ambienceNodes) return;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ambienceBus);
    g.gain.linearRampToValueAtTime(0.16 * ambienceVol, now() + 4);

    // 低频 drone
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 43.65;
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 44.2;
    const dg = ctx.createGain();
    dg.gain.value = 0.5;
    drone.connect(dg); drone2.connect(dg); dg.connect(g);

    // 风声
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(6);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.4;
    const wg = ctx.createGain();
    wg.gain.value = 0.5;
    src.connect(lp); lp.connect(wg); wg.connect(g);

    // 缓慢呼吸的滤波
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency);

    drone.start(); drone2.start(); src.start(); lfo.start();
    ambienceNodes = { g, drone, drone2, src, lfo, lp };
  }

  function applyDroneTier(tier) {
    if (!ctx || !ambienceNodes) return;
    const a = ambienceNodes;
    const t = now();
    const base = [43.65, 48.6, 54.2][Math.min(Math.max(tier, 0), 2)];
    [a.drone, a.drone2].forEach((o, i) => {
      o.frequency.cancelScheduledValues(t);
      o.frequency.setValueAtTime(o.frequency.value, t);
      o.frequency.linearRampToValueAtTime(base + i * 0.6, t + 5);
    });
    a.lp.frequency.cancelScheduledValues(t);
    a.lp.frequency.setValueAtTime(a.lp.frequency.value, t);
    a.lp.frequency.linearRampToValueAtTime(tier >= 2 ? 300 : tier >= 1 ? 360 : 420, t + 5);
    a.lfo.frequency.linearRampToValueAtTime(tier >= 2 ? 0.078 : tier >= 1 ? 0.06 : 0.045, t + 4);
    a.g.gain.cancelScheduledValues(t);
    a.g.gain.setValueAtTime(a.g.gain.value, t);
    a.g.gain.linearRampToValueAtTime((tier >= 2 ? 0.22 : tier >= 1 ? 0.19 : 0.16) * ambienceVol, t + 5);
  }

  function stopAmbience() {
    if (!ambienceNodes) return;
    const { g, drone, drone2, src, lfo } = ambienceNodes;
    const t = now();
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    setTimeout(() => {
      try { drone.stop(); drone2.stop(); src.stop(); lfo.stop(); } catch (e) {}
    }, 1400);
    ambienceNodes = null;
  }

  /* ---------- 对外接口 ---------- */
  const Sound = {
    begin() {
      ensure();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      started = true;
      if (enabled) startAmbience();
    },
    play(name, opts = {}) {
      if (!enabled) return;
      ensure();
      if (!ctx || ctx.state !== 'running') return;
      const fn = SFX[name];
      if (!fn) return;
      try { fn(now() + 0.01 + (opts.delay || 0)); } catch (e) { /* 忽略 */ }
    },
    setVolume(v) {
      volume = v;
      if (master) master.gain.setTargetAtTime(0.95 * v, now(), 0.1);
    },
    setAmbience(v) {
      ambienceVol = v;
      if (ambienceNodes) ambienceNodes.g.gain.setTargetAtTime(0.16 * v, now(), 0.3);
    },
    ambience(on) {
      if (on && enabled) { startAmbience(); applyDroneTier(droneWanted); }
      else stopAmbience();
    },
    /* 敲门分级 0/1/2：低频 drone 逐档升高、呼吸更深——"他越近，空气越紧" */
    droneTier(tier) {
      droneWanted = tier || 0;
      applyDroneTier(droneWanted);
    },
    toggle() {
      enabled = !enabled;
      if (enabled) {
        ensure();
        if (ctx && ctx.state === 'suspended') ctx.resume();
        startAmbience();
      } else {
        stopAmbience();
      }
      return enabled;
    },
    isOn() { return enabled; },
    /* 音频是否真的可用（无 AudioContext 的环境里为 false，用于跳过心跳等长驻定时器） */
    available() { return !!ctx; }
  };

  window.Sound = Sound;
})();
