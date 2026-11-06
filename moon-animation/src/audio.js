// ---------- Cinematic sound design, fully synthesized in an OfflineAudioContext ----------
'use strict';
const SR = 48000;

async function buildMix(voUrl, voSegs) {
  const len = Math.ceil(TOTAL * SR);
  const ac = new OfflineAudioContext(2, len, SR);
  const T = vt => vt + OFF; // voiceover time -> timeline time

  // ---- buses ----
  const master = ac.createGain(); master.gain.value = 1;
  const limiter = ac.createDynamicsCompressor(); Object.assign(limiter, {}); limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = .002; limiter.release.value = .12;
  master.connect(limiter).connect(ac.destination);
  const bgOut = ac.createGain(); bgOut.gain.value = window.MIX_ONLY_VO ? 0 : 1; bgOut.connect(master);
  const glue = ac.createDynamicsCompressor(); glue.threshold.value = -18; glue.ratio.value = 2.5; glue.attack.value = .02; glue.release.value = .25; glue.knee.value = 8; glue.connect(bgOut);
  const reverb = ac.createConvolver(); reverb.buffer = makeIR(ac, 3.2, 2.6); const revRet = ac.createGain(); revRet.gain.value = .55; reverb.connect(revRet).connect(glue);
  const sfx = ac.createGain(); sfx.gain.value = .9; sfx.connect(glue);
  const sfxRev = ac.createGain(); sfxRev.gain.value = 1; sfxRev.connect(reverb);
  // music + ambience share a ducking bus (sidechain-style, keyed from the VO segments)
  const duck = ac.createGain(); duck.connect(glue); const duckRev = ac.createGain(); duckRev.gain.value = .5; duck.connect(duckRev).connect(reverb);
  const music = ac.createGain(); music.gain.value = .5; music.connect(duck);
  const amb = ac.createGain(); amb.gain.value = .55; amb.connect(duck);
  duck.gain.setValueAtTime(1, 0);
  for (const [a, b] of voSegs) { const s = T(a), e = T(b); duck.gain.setTargetAtTime(.42, s - .08, .06); duck.gain.setTargetAtTime(1, e + .15, .35); sfx.gain.setTargetAtTime(.6, s - .05, .05); sfx.gain.setTargetAtTime(.9, e + .1, .25); }

  // ---- helpers ----
  const noiseBuf = (() => { const b = ac.createBuffer(2, SR * 4, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let p = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; p = .97 * p + .03 * w; d[i] = w * .6 + p * 2.2; } } return b; })();
  const brown = (() => { const b = ac.createBuffer(2, SR * 4, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } } return b; })();
  function noise(t0, dur, o = {}) { const s = ac.createBufferSource(); s.buffer = o.brown ? brown : noiseBuf; s.loop = true; s.loopStart = Math.random(); const g = ac.createGain(); g.gain.value = 0; let node = s; for (const f of o.filters || []) { const bq = ac.createBiquadFilter(); bq.type = f.type; bq.frequency.value = f.f; if (f.q) bq.Q.value = f.q; if (f.to) bq.frequency.exponentialRampToValueAtTime(f.to, t0 + (f.at ?? dur)); node.connect(bq); node = bq; } node.connect(g); s.start(t0, Math.random() * 2); s.stop(t0 + dur + .05); return { g, src: s }; }
  function env(param, t0, a, h, r, peak, floor = 0) { param.setValueAtTime(floor, t0); param.linearRampToValueAtTime(peak, t0 + a); param.setValueAtTime(peak, t0 + a + h); param.exponentialRampToValueAtTime(Math.max(1e-4, floor || 1e-4), t0 + a + h + r); }
  function pan(node, p, dest) { const pn = ac.createStereoPanner(); pn.pan.value = p; node.connect(pn); pn.connect(dest); return pn; }
  function out(node, { p = 0, rev = .3, dest = sfx } = {}) { pan(node, p, dest); if (rev > 0) { const rg = ac.createGain(); rg.gain.value = rev; node.connect(rg).connect(sfxRev); } }
  function tone(t0, dur, f0, o = {}) { const os = ac.createOscillator(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(f0, t0); if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t0 + (o.glide ?? dur)); if (o.detune) os.detune.value = o.detune; const g = ac.createGain(); env(g.gain, t0, o.a ?? .005, o.h ?? 0, o.r ?? dur, o.v ?? .3); let n = os; if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q ?? .7; n.connect(f); n = f; } n.connect(g); os.start(t0); os.stop(t0 + (o.a ?? .005) + (o.h ?? 0) + (o.r ?? dur) + .1); out(g, o); return os; }

  // ---- SFX vocabulary ----
  const S = {
    whoosh(t, d = .6, v = .35, p = 0, up = true) { const n = noise(t, d + .2, { filters: [{ type: 'bandpass', f: up ? 300 : 3000, to: up ? 3500 : 250, q: 1.2, at: d }] }); n.g.gain.setValueAtTime(0, t); n.g.gain.linearRampToValueAtTime(v, t + d * .6); n.g.gain.exponentialRampToValueAtTime(1e-4, t + d + .15); const pn = ac.createStereoPanner(); pn.pan.setValueAtTime(-p, t); pn.pan.linearRampToValueAtTime(p, t + d); n.g.connect(pn).connect(sfx); const rg = ac.createGain(); rg.gain.value = .4; n.g.connect(rg).connect(sfxRev); },
    sub(t, v = .9, f0 = 70, f1 = 28, d = 2.2) { tone(t, d, f0, { f1, glide: d * .8, v, r: d, rev: .05 }); tone(t, .5, f0 * 2, { f1: f1 * 2, v: v * .25, r: .5, rev: 0 }); },
    impact(t, v = .8, p = 0) { S.sub(t, v * .9, 90, 32, 2.4); const n = noise(t, 1.8, { filters: [{ type: 'lowpass', f: 5000, to: 300, at: 1.2 }] }); env(n.g.gain, t, .003, .02, 1.6, v * .5); out(n.g, { p, rev: .9 }); },
    riser(t0, d, v = .3) { const n = noise(t0, d + .1, { filters: [{ type: 'bandpass', f: 200, to: 6000, q: 2, at: d }] }); n.g.gain.setValueAtTime(1e-4, t0); n.g.gain.exponentialRampToValueAtTime(v, t0 + d); n.g.gain.linearRampToValueAtTime(0, t0 + d + .05); out(n.g, { rev: .6 }); tone(t0, d, 110, { f1: 880, glide: d, v: v * .25, a: d * .9, h: 0, r: .05, type: 'sawtooth', lp: 1800, rev: .5 }); },
    reverseSwell(t1, d = 1.4, v = .35) { const t0 = t1 - d; const n = noise(t0, d + .05, { filters: [{ type: 'highpass', f: 1500 }, { type: 'lowpass', f: 9000 }] }); n.g.gain.setValueAtTime(1e-4, t0); n.g.gain.exponentialRampToValueAtTime(v, t1); n.g.gain.linearRampToValueAtTime(0, t1 + .03); out(n.g, { rev: .8 }); },
    pop(t, f = 900, v = .22, p = 0) { tone(t, .12, f, { f1: f * .55, glide: .1, v, r: .14, rev: .25, p }); tone(t, .05, f * 3, { v: v * .3, r: .05, rev: 0, p }); },
    click(t, v = .25, p = 0) { const n = noise(t, .04, { filters: [{ type: 'highpass', f: 2500 }] }); env(n.g.gain, t, .001, .002, .03, v); out(n.g, { p, rev: .1 }); tone(t, .03, 1800, { v: v * .4, r: .03, rev: 0, p }); },
    tick(t, v = .15, p = 0) { tone(t, .02, 3200, { v, r: .025, rev: .05, p, type: 'square', lp: 6000 }); },
    ding(t, f = 1320, v = .25, p = 0) { [1, 2.76, 5.4].forEach((m, i) => tone(t, 2.2 / (i + 1), f * m, { v: v / (i * 1.8 + 1), r: 2.2 / (i + 1), rev: .7, p })); },
    shimmer(t, d = 2, v = .12, base = 880) { [1, 1.5, 2, 2.5, 3, 4].forEach((m, i) => { tone(t + i * .06, d, base * m, { v: v / (i + 1.5), a: d * .3, h: d * .2, r: d * .5, rev: 1, detune: (i % 2 ? 7 : -7), p: (i % 2 ? .4 : -.4) }); }); },
    ping(t, v = .16, p = 0) { tone(t, .18, 1568, { v, r: .18, rev: .3, p }); tone(t + .09, .3, 2093, { v, r: .3, rev: .3, p }); },
    shutter(t, v = .18, p = 0) { S.click(t, v, p); S.click(t + .06, v * .7, p); },
    rustle(t, d = .3, v = .14, p = 0) { const n = noise(t, d, { filters: [{ type: 'highpass', f: 2000 }, { type: 'peaking', f: 5000, q: 1 }] }); env(n.g.gain, t, .02, d * .3, d * .6, v); out(n.g, { p, rev: .3 }); },
    thunder(t, v = .7) { const n = noise(t, 5, { brown: true, filters: [{ type: 'lowpass', f: 900, to: 120, at: 4 }] }); env(n.g.gain, t, .01, .15, 4.5, v); out(n.g, { rev: 1 }); const c = noise(t, .25, { filters: [{ type: 'highpass', f: 1500 }] }); env(c.g.gain, t, .001, .02, .2, v * .6); out(c.g, { rev: .6, p: .4 }); },
    gull(t, p = .3) { for (let k = 0; k < 3; k++) { const t0 = t + k * .22; const os = ac.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(1400, t0); os.frequency.exponentialRampToValueAtTime(900, t0 + .18); const fm = ac.createOscillator(); fm.frequency.value = 38; const fg = ac.createGain(); fg.gain.value = 120; fm.connect(fg).connect(os.frequency); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 2; const g = ac.createGain(); env(g.gain, t0, .02, .08, .1, .12); os.connect(bp).connect(g); out(g, { p, rev: .8 }); os.start(t0); fm.start(t0); os.stop(t0 + .3); fm.stop(t0 + .3); } },
    flap(t, n = 4, v = .12, p = 0) { for (let k = 0; k < n; k++) { const nn = noise(t + k * .16, .12, { filters: [{ type: 'bandpass', f: 600, q: .8 }] }); env(nn.g.gain, t + k * .16, .01, .02, .09, v); out(nn.g, { p, rev: .3 }); } },
    owl(t, p = -.5) { [0, .45].forEach((d, i) => tone(t + d, .45, 420 - i * 30, { f1: 380 - i * 30, v: .09, a: .08, h: .12, r: .3, rev: .9, p, lp: 900 })); },
    crackle(t0, d, rate = 30, v = .12, hp = 3000) { const r = rng(Math.floor(t0 * 100)); for (let i = 0; i < d * rate; i++) { const tt = t0 + r() * d; const n = noise(tt, .02, { filters: [{ type: 'highpass', f: hp }] }); env(n.g.gain, tt, .0005, .001, .015 + r() * .02, v * (.3 + r())); out(n.g, { p: r() * 2 - 1, rev: .2 }); } },
    bubbles(t0, d, rate = 6, v = .07) { const r = rng(Math.floor(t0 * 10)); for (let i = 0; i < d * rate; i++) { const tt = t0 + r() * d, f = 300 + r() * 700; tone(tt, .06, f, { f1: f * 2.2, glide: .05, v: v * (.4 + r()), r: .07, rev: .5, p: r() * 2 - 1 }); } },
    clank(t, v = .3) { [1, 2.32, 3.91, 5.2].forEach((m, i) => tone(t, .6 / (i + 1), 520 * m, { v: v / (i + 1.4), r: .6 / (i + 1), rev: .5, type: 'triangle' })); S.click(t, v); },
    step(t, v = .1, p = 0) { const n = noise(t, .08, { filters: [{ type: 'lowpass', f: 900 }] }); env(n.g.gain, t, .003, .01, .07, v); out(n.g, { p, rev: .15 }); },
    powerDown(t, d = 1.2, v = .3) { tone(t, d, 420, { f1: 38, glide: d, v, r: d, type: 'sawtooth', lp: 1200, rev: .5 }); tone(t, d, 840, { f1: 60, glide: d, v: v * .3, r: d, rev: .4 }); },
    sizzle(t0, d, v = .14) { const n = noise(t0, d, { filters: [{ type: 'highpass', f: 4000 }] }); n.g.gain.setValueAtTime(0, t0); n.g.gain.linearRampToValueAtTime(v, t0 + .3); n.g.gain.setValueAtTime(v, t0 + d - .5); n.g.gain.linearRampToValueAtTime(0, t0 + d); out(n.g, { rev: .2 }); S.crackle(t0, d, 25, v * .8, 2000); },
    glitch(t, v = .2) { for (let k = 0; k < 6; k++) tone(t + k * .045, .04, 300 + (k * 977) % 1400, { v, r: .04, type: 'square', lp: 4000, rev: .2, p: k % 2 ? .5 : -.5 }); tone(t + .3, .6, 600, { f1: 80, v: v * .8, r: .6, type: 'sawtooth', lp: 1500, rev: .5 }); },
    tinnitus(t, d = 2.5, v = .03) { tone(t, d, 6200, { v, a: .05, h: .3, r: d, rev: .3 }); },
    heartbeat(t, v = .45) { tone(t, .18, 60, { f1: 40, v, r: .18, rev: 0 }); tone(t + .22, .2, 55, { f1: 38, v: v * .7, r: .2, rev: 0 }); },
  };

  // ---- Ambience beds (crossfaded) ----
  function bed(t0, t1, kind, v = 1, fi = .6, fo = .8) {
    const d = t1 - t0 + fo; const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + fi); g.gain.setValueAtTime(v, Math.max(t0 + fi, t1)); g.gain.linearRampToValueAtTime(0, t1 + fo); g.connect(amb);
    const add = (n, gain, p = 0) => { const gg = ac.createGain(); gg.gain.value = gain; n.connect(gg); pan(gg, p, g); };
    if (kind === 'city') { const a = noise(t0, d, { brown: true, filters: [{ type: 'lowpass', f: 420 }] }); a.g.gain.value = .5; add(a.g, 1); const w = noise(t0, d, { filters: [{ type: 'bandpass', f: 700, q: .6 }] }); w.g.gain.value = .05; add(w.g, 1, .3);
      const r = rng(Math.floor(t0)); for (let tt = t0 + .3; tt < t1; tt += .9 + r() * 1.6) { for (let k = 0; k < 3; k++) { const o = ac.createOscillator(); o.frequency.value = 4300 + r() * 500; const gg = ac.createGain(); const ts = tt + k * .07; gg.gain.setValueAtTime(0, ts); gg.gain.linearRampToValueAtTime(.012, ts + .01); gg.gain.linearRampToValueAtTime(0, ts + .05); o.connect(gg); pan(gg, r() * 2 - 1, g); o.start(ts); o.stop(ts + .06); } }
      // distant car pass
      for (let tt = t0 + 1.5; tt < t1 - 2; tt += 4 + r() * 4) { const c = noise(tt, 3, { filters: [{ type: 'bandpass', f: 300, to: 500, q: .8, at: 1.5 }] }); env(c.g.gain, tt, 1.4, .1, 1.5, .1); add(c.g, 1, r() * 2 - 1); } }
    if (kind === 'space') { [55, 82.4, 110.3].forEach((f, i) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = i * 4; const gg = ac.createGain(); gg.gain.value = .06 / (i + 1); o.connect(gg); pan(gg, (i - 1) * .5, g); o.start(t0); o.stop(t0 + d); }); const a = noise(t0, d, { filters: [{ type: 'bandpass', f: 1800, q: .4 }] }); a.g.gain.value = .02; add(a.g, 1); }
    if (kind === 'ocean') { for (const p of [-.6, .6]) { const a = noise(t0, d, { filters: [{ type: 'lowpass', f: 1400 }] }); const lfo = ac.createOscillator(); lfo.frequency.value = .11 + (p > 0 ? .03 : 0); const lg = ac.createGain(); lg.gain.value = .22; a.g.gain.value = .26; lfo.connect(lg).connect(a.g.gain); lfo.start(t0); lfo.stop(t0 + d); add(a.g, 1, p); } const lo = noise(t0, d, { brown: true, filters: [{ type: 'lowpass', f: 200 }] }); lo.g.gain.value = .35; add(lo.g, 1); }
    if (kind === 'under') { const a = noise(t0, d, { brown: true, filters: [{ type: 'lowpass', f: 350 }] }); a.g.gain.value = .7; add(a.g, 1); S.bubbles(t0, t1 - t0, 4, .05); }
    if (kind === 'room') { const a = noise(t0, d, { brown: true, filters: [{ type: 'lowpass', f: 250 }] }); a.g.gain.value = .35; add(a.g, 1); const o = ac.createOscillator(); o.frequency.value = 120; const gg = ac.createGain(); gg.gain.value = .015; o.connect(gg); pan(gg, 0, g); o.start(t0); o.stop(t0 + d); }
    if (kind === 'wind') { for (const p of [-.5, .5]) { const a = noise(t0, d, { filters: [{ type: 'bandpass', f: 500, q: 3 }] }); const bq = ac.createBiquadFilter(); const lfo = ac.createOscillator(); lfo.frequency.value = .2 + p * .05; const lg = ac.createGain(); lg.gain.value = .08; a.g.gain.value = .12; lfo.connect(lg).connect(a.g.gain); lfo.start(t0); lfo.stop(t0 + d); add(a.g, 1, p); } }
    if (kind === 'heat') { const a = noise(t0, d, { filters: [{ type: 'bandpass', f: 350, q: .7 }] }); a.g.gain.value = .25; add(a.g, 1); const o = ac.createOscillator(); o.frequency.value = 58; const gg = ac.createGain(); gg.gain.value = .05; o.connect(gg); pan(gg, 0, g); o.start(t0); o.stop(t0 + d); }
    if (kind === 'blizzard') { for (const p of [-.7, .7]) { const a = noise(t0, d, { filters: [{ type: 'bandpass', f: 900, q: 2.5 }] }); const lfo = ac.createOscillator(); lfo.frequency.value = .35 + p * .1; const lg = ac.createGain(); lg.gain.value = .16; a.g.gain.value = .22; lfo.connect(lg).connect(a.g.gain); lfo.start(t0); lfo.stop(t0 + d); add(a.g, 1, p); } const h = noise(t0, d, { filters: [{ type: 'highpass', f: 3500 }] }); h.g.gain.value = .05; add(h.g, 1); }
    if (kind === 'night') { const a = noise(t0, d, { brown: true, filters: [{ type: 'lowpass', f: 300 }] }); a.g.gain.value = .3; add(a.g, 1); const r = rng(7); for (let tt = t0 + .2; tt < t1; tt += .35 + r() * .5) { const o = ac.createOscillator(); o.frequency.value = 4800 + r() * 700; const gg = ac.createGain(); gg.gain.setValueAtTime(0, tt); gg.gain.linearRampToValueAtTime(.01, tt + .01); gg.gain.linearRampToValueAtTime(0, tt + .04); o.connect(gg); pan(gg, r() * 2 - 1, g); o.start(tt); o.stop(tt + .05); } }
  }

  // ---- Music: slow pad progression (D minor -> hopeful D major at the end) ----
  function pad(t0, d, freqs, v = .07, o = {}) {
    const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + (o.a ?? 1.2)); g.gain.setValueAtTime(v, t0 + d - (o.r ?? 1.2)); g.gain.linearRampToValueAtTime(0, t0 + d); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp ?? 900; lp.Q.value = .5; if (o.lpTo) lp.frequency.linearRampToValueAtTime(o.lpTo, t0 + d); g.connect(lp).connect(music);
    freqs.forEach((f, i) => { for (const dt of [-6, 6]) { const os = ac.createOscillator(); os.type = 'sawtooth'; os.frequency.value = f; os.detune.value = dt + i; const gg = ac.createGain(); gg.gain.value = 1 / freqs.length / 2; os.connect(gg); pan(gg, dt > 0 ? .35 : -.35, g); os.start(t0); os.stop(t0 + d + .1); } });
  }
  const n = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const Dm = [n(50), n(57), n(62), n(65)], Bb = [n(46), n(53), n(62), n(65)], F = [n(53), n(57), n(60), n(65)], C = [n(48), n(55), n(64), n(67)], Gm = [n(43), n(55), n(62), n(67)], A = [n(45), n(57), n(61), n(64)], D = [n(50), n(57), n(62), n(66)], G = [n(43), n(55), n(62), n(71)];
  const prog1 = [[T(-OFF), 7.4, Dm, 800], [T(7.5), 7.6, Bb, 900], [T(17.9), 6.6, Gm, 600], [T(24.3), 7.5, A, 700], [T(31.8), 10, Dm, 800], [T(41.6), 11.5, Bb, 700], [T(53), 11.4, Gm, 550], [T(64.3), 11.5, Dm, 900], [T(75.8), 17.4, A, 1100, 2200]];
  prog1.forEach(([t, d, ch, lp, lpTo]) => pad(t, d + 1, ch, .06, { lp, lpTo }));
  // silence for "without a sound": pad from 9.75 handled by duck automation below
  pad(T(94.45), 7.4, Dm, .045, { lp: 600, lpTo: 1100 }); pad(T(101.8), 4.2, Bb, .05, { lp: 700 }); pad(T(105.9), 3.6, F, .055, { lp: 1000 });
  pad(T(109.35), TOTAL - T(109.35), D, .075, { lp: 900, lpTo: 2400, a: 1.5, r: 2.2 });
  // low pulse during the tilt/wobble section
  for (let vt = 76.6; vt < 93; vt += .75) { const k = (vt - 76.6) / 16; tone(T(vt), .4, 55, { f1: 45, v: .12 + .25 * k, r: .4, rev: 0, dest: music }); }
  // music cut for the vanish ("without a sound") and the long pause
  music.gain.setValueAtTime(.5, T(15.0)); music.gain.linearRampToValueAtTime(0, T(16.4)); music.gain.setValueAtTime(0, T(17.6)); music.gain.linearRampToValueAtTime(.5, T(18.6));
  amb.gain.setValueAtTime(.55, T(15.4)); amb.gain.linearRampToValueAtTime(.05, T(16.5)); amb.gain.linearRampToValueAtTime(.55, T(18.4));
  music.gain.setValueAtTime(.5, T(92.6)); music.gain.linearRampToValueAtTime(.08, T(93.6)); music.gain.linearRampToValueAtTime(.5, T(95.4));

  // ---- Ambience map ----
  bed(0, T(2.6), 'city', .9, .9); bed(T(2.6), T(6.2), 'night', .7, .3); bed(T(6.2), T(7.5), 'space', .9, .05); bed(T(7.5), T(17.85), 'city', 1, .3);
  bed(T(17.85), T(24.3), 'space', 1); bed(T(24.3), T(27.3), 'city', .8, .2); bed(T(27.3), T(30.3), 'room', 1, .1); bed(T(30.3), T(33.75), 'ocean', 1, .4);
  bed(T(33.75), T(41.6), 'space', .7); bed(T(41.6), T(53), 'ocean', .8, .2); bed(T(44.15), T(53), 'wind', .6); bed(T(53), T(58.2), 'night', .9, .3);
  bed(T(58.2), T(64.3), 'under', 1, .2); bed(T(64.3), T(83.95), 'space', 1); bed(T(83.95), T(87.2), 'heat', 1, .1); bed(T(87.2), T(90.2), 'blizzard', 1, .1);
  bed(T(90.2), T(93.3), 'wind', .9); bed(T(93.3), T(109.35), 'night', .8, .6); bed(T(101.8), T(105.9), 'wind', .6); bed(T(109.35), TOTAL, 'city', .9, 1, 1.6);

  // ---- Spot effects, hand-placed to picture ----
  const shots = SHOTS.map(s => s.s);
  shots.slice(1).forEach((s, i) => { if ([6.2, 16.62, 93.3, 94.45].includes(s)) return; S.whoosh(T(s) - .28, .45, .16 + (i % 3) * .04, i % 2 ? .6 : -.6, i % 2 === 0); });
  S.shimmer(T(-.4), 3.5, .1, 660); S.reverseSwell(T(2.6), 1.6, .25);
  // "imagine it's gone" hologram flicker
  for (let vt = 3.55; vt < 4.45; vt += .09) S.tick(T(vt), .05, .2);
  tone(T(3.55), .9, 2400, { f1: 1200, v: .03, r: .9, type: 'square', lp: 3000, rev: .4 });
  // cloud pass
  S.whoosh(T(4.5), 1.4, .22, .8); 
  // "Gone." — riser into sub drop + tinnitus
  S.reverseSwell(T(6.25), 1.0, .24); S.impact(T(6.3), .9); S.tinnitus(T(6.4), 1.8, .02);
  // Title hit
  S.impact(T(7.62), .75); S.shimmer(T(7.7), 2.2, .09, 880); S.whoosh(T(7.5), .5, .25, 0);
  // crowd + phones (clear night)
  S.shutter(T(11.0), .12, -.4); S.shutter(T(12.4), .1, .5); S.shutter(T(13.3), .1, -.2);
  // "without a sound, it vanishes": inhale suck, then a delayed sub thump and ringing silence
  S.reverseSwell(T(16.62), 1.0, .18); S.sub(T(16.85), .7, 60, 25, 2.5); S.tinnitus(T(16.9), 2.2, .025);
  // last light travelling + stopwatch
  S.riser(T(18.4), 5.2, .14); for (let vt = 18.4; vt < 23.6; vt += .26) S.tick(T(vt), .07, .1); S.ding(T(23.6), 1568, .18);
  // sky goes dark
  S.powerDown(T(24.9), 1.1, .25); S.heartbeat(T(25.3), .4);
  // phones come out
  for (let i = 0; i < 9; i++) S.ping(T(25.8 + i * .07 + (i % 3) * .05), .07, (i - 4) / 5); S.shutter(T(26.6), .1, .3); S.shutter(T(26.9), .08, -.5);
  // astronomers panic
  for (let k = 0; k < 6; k++) S.rustle(T(27.6 + k * .3), .3, .1, (k % 2 ? .5 : -.5)); for (let k = 0; k < 6; k++) tone(T(27.5 + k * .45), .2, 880, { v: .05, r: .2, type: 'square', lp: 2500, rev: .4, p: .6 });
  // ominous ocean
  S.sub(T(30.3), .5, 50, 30, 3); tone(T(30.3), 1.6, 73.4, { v: .1, a: .8, h: .3, r: 1, type: 'sawtooth', lp: 400, rev: .6 });
  // oceans title
  S.pop(T(31.9), 520, .2); S.pop(T(32.0), 780, .16);
  // tides diagram
  S.pop(T(33.9), 900, .1, .6); S.pop(T(35.1), 700, .1); S.whoosh(T(34.2), 1.6, .12, 0);
  S.reverseSwell(T(36.6), .8, .2); S.pop(T(37.6), 600, .14, -.7); S.pop(T(38.8), 800, .12, .6);
  tone(T(39.3), 1.3, 660, { f1: 220, v: .08, r: 1.3, type: 'triangle', rev: .5, p: .6 }); S.click(T(40.0), .18);
  // That sounds small. It isn't.
  S.pop(T(41.75), 640, .12); S.impact(T(43.25), .6); 
  // tide pools dry out
  S.sizzle(T(44.2), 1.4, .09);
  S.pop(T(45.0), 1100, .18, -.4); S.pop(T(45.8), 880, .18, 0); S.pop(T(46.4), 1320, .18, .4);
  for (let k = 0; k < 6; k++) S.step(T(45.1 + k * .12), .05, -.4);
  tone(T(48.6), 1.4, 523, { f1: 196, v: .07, r: 1.4, type: 'triangle', rev: .7 });
  // the animals that eat them
  S.gull(T(50.7), .5); S.flap(T(50.6), 6, .1, .5); [51.2, 51.55, 51.9].forEach((t, i) => S.pop(T(t), 500 - i * 80, .16, (i - 1) * .5));
  // the darkness
  S.click(T(53.0), .22, .3); S.sub(T(53.1), .2, 45, 30, 3); tone(T(53.1), 3.5, 36.7, { v: .05, a: 1, h: 1, r: 1.5, rev: .3 });
  // pitch black
  S.owl(T(56.4), -.6); for (let i = 0; i < 7; i++) S.tick(T(56.2 + i * .2), .03, (i - 3) / 3); S.reverseSwell(T(56.4), .8, .12);
  // corals
  S.shimmer(T(58.6), 2.6, .08, 1046); S.bubbles(T(58.8), 2.5, 12, .06); S.glitch(T(61.55), .12); S.sub(T(61.6), .4, 60, 30, 2);
  // slowest one: big clock
  for (let vt = 64.5; vt < 67; vt += .55) S.tick(T(vt), .12, 0); S.crackle(T(64.4), 2.5, 50, .03, 6000);
  // tilt + seasons + steady
  S.whoosh(T(67.25), 1.0, .2, -.3); S.clank(T(68.3), .12); S.pop(T(67.4), 700, .12, -.7);
  for (let i = 0; i < 4; i++) S.pop(T(71.0 + i * .3), 660 + i * 110, .1, (i - 1.5) / 2); S.shimmer(T(71.6), 1.8, .05, 784);
  tone(T(73.8), 1.8, 220, { v: .06, a: .4, h: .8, r: .6, rev: .5 }); tone(T(73.8), 1.8, 221.5, { v: .06, a: .4, h: .8, r: .6, rev: .5 });
  // wobble
  S.reverseSwell(T(76.0), .6, .2); S.pop(T(76.5), 300, .2); 
  { const g = ac.createGain(); g.gain.setValueAtTime(0, T(76.6)); g.gain.linearRampToValueAtTime(.35, T(83.4)); g.gain.linearRampToValueAtTime(0, T(84.2)); const nn = noise(T(76.6), 8, { brown: true, filters: [{ type: 'lowpass', f: 180 }] }); nn.g.gain.value = 1; const lfo = ac.createOscillator(); lfo.frequency.setValueAtTime(.5, T(76.6)); lfo.frequency.linearRampToValueAtTime(3.5, T(83.4)); const lg = ac.createGain(); lg.gain.value = .6; lfo.connect(lg).connect(nn.g.gain); lfo.start(T(76.6)); lfo.stop(T(84.3)); nn.g.connect(g); out(g, { rev: .4 }); }
  S.click(T(78.7), .16); { let vt = 79.6, step = .3; while (vt < 82.6) { S.tick(T(vt), .1, 0); step = Math.max(.05, step * .86); vt += step; } } S.impact(T(82.3), .55);
  // heat
  S.impact(T(83.95), .5); S.sizzle(T(84.1), 3, .07); tone(T(84.1), 1.3, 300, { f1: 1200, v: .05, r: 1.3, type: 'triangle', rev: .4, p: .7 });
  // cold
  S.whoosh(T(87.2), .9, .3, -.5); S.crackle(T(87.6), 2.2, 18, .2, 1200); tone(T(87.3), 1.3, 1200, { f1: 300, v: .05, r: 1.3, type: 'triangle', rev: .4, p: .7 });
  // swing
  [90.3, 91.5, 92.7].forEach((t, i) => S.whoosh(T(t), .9, .18, i % 2 ? .8 : -.8, i % 2 === 0));
  // long pause: one heartbeat in the silence
  S.heartbeat(T(93.5), .35);
  // survive
  S.pop(T(94.6), 440, .12); S.clank(T(97.55), .14); S.impact(T(97.55), .24);
  [99.0, 99.85, 100.6].forEach((t, i) => { S.impact(T(t), .32); S.whoosh(T(t) - .2, .3, .2, (i - 1) * .7); });
  for (let k = 0; k < 6; k++) S.clank(T(100.0 + k * .18), .05); for (let k = 0; k < 8; k++) S.step(T(100.65 + k * .14), .06, .6);
  // darker / stranger
  S.thunder(T(103.25), .5); S.thunder(T(104.15), .35); S.pop(T(101.9), 330, .12);
  // eclipse
  S.shimmer(T(105.95), 3.2, .09, 523); tone(T(107.0), 1.8, 1046, { f1: 523, v: .04, r: 1.8, rev: .9 }); S.pop(T(107.4), 520, .1);
  // finale: moon returns
  S.reverseSwell(T(109.6), 1.2, .2); S.shimmer(T(109.5), 3.5, .1, 587); S.ding(T(111.0), 1175, .1); S.pop(T(112.4), 784, .08); S.pop(T(113.4), 988, .08);
  S.sub(T(VO_LEN + .4), .4, 55, 30, 3); S.shimmer(T(VO_LEN + .3), 3, .06, 1175);

  // ---- Voiceover chain ----
  const voBuf = await ac.decodeAudioData(await (await fetch(voUrl)).arrayBuffer());
  const vo = ac.createBufferSource(); vo.buffer = voBuf;
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 75;
  const pres = ac.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.gain.value = 2; pres.Q.value = .8;
  const warm = ac.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 180; warm.gain.value = 1.5;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .12; comp.knee.value = 6;
  const voG = ac.createGain(); voG.gain.value = window.MIX_NO_VO ? 0 : 1.6; const voRev = ac.createGain(); voRev.gain.value = .05;
  vo.connect(hp).connect(warm).connect(pres).connect(comp).connect(voG); voG.connect(master); voG.connect(voRev).connect(reverb);
  vo.start(OFF);

  const rendered = await ac.startRendering();
  // normalise to -1 dBFS true-ish peak
  let pk = 0; for (let c = 0; c < 2; c++) { const d = rendered.getChannelData(c); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
  const gain = window.MIX_NO_NORM ? 1 : Math.pow(10, -1 / 20) / pk; let rms = 0; for (let c = 0; c < 2; c++) { const d = rendered.getChannelData(c); for (let i = 0; i < d.length; i++) { d[i] *= gain; rms += d[i] * d[i]; } }
  rms = 10 * Math.log10(rms / (rendered.length * 2));
  return { buffer: rendered, peakBefore: 20 * Math.log10(pk), rmsDb: rms };
}
function makeIR(ac, dur, decay) { const len = Math.floor(SR * dur), b = ac.createBuffer(2, len, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp = lp * .6 + (Math.random() * 2 - 1) * .4; d[i] = lp * Math.pow(1 - t, decay) * (i < SR * .012 ? i / (SR * .012) : 1); } } return b; }
