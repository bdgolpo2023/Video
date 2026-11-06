// ---------- Shot list. Times are voiceover seconds (VO starts at OFF in the final video) ----------
'use strict';
const OFF = 0.6, VO_LEN = 114.36, TOTAL = OFF + VO_LEN + 2.9;

// Each shot: [start, draw(ctx, lt, dur, vt)]. Shot ends where the next starts.
const SHOTS = [];
const shot = (s, f, post = {}) => SHOTS.push({ s, f, post });

// 0 — Opening: rooftop, full moon, slow push-in
shot(-OFF, (c, lt, d, vt) => {
  const p = E.inOutSine(prog(vt, -OFF, 2.6));
  rooftop(c, vt, { moon: 1, cam: { z: 1.0 + p * .08, x: -p * 40, y: 0 }, pose: { look: [.4, -.85], mouth: 'smile' } });
  // opening fade from black
}, { fadeIn: .9 });

// 1 — "Now imagine it's gone." Close on the moon, it flickers like a hologram
shot(2.6, (c, lt, d, vt) => {
  const z = 1 + lt * .03; c.save(); camera(c, z); nightSky(c, 1, vt, { seed: 5 });
  const fl = vt > 3.55 && vt < 4.45 ? .55 + .45 * Math.sin(vt * 44) * Math.sin(vt * 13) : 1;
  drawMoon(c, W / 2, H / 2, 300, { alpha: fl, rays: 1, t: vt });
  if (vt > 3.55) { c.save(); c.globalAlpha = .4 * (1 - fl); c.strokeStyle = P.white; c.setLineDash([18, 14]); c.lineWidth = 4; circle(c, W / 2, H / 2, 300); c.stroke(); c.restore(); }
  c.restore();
  drawCloud(c, -200 + lt * 120, 980, 2.2, '#140f1f', .9);
});

// 2 — "Not hidden behind a cloud." Cloud slides across, then away revealing moon again
shot(4.45, (c, lt, d, vt) => {
  c.save(); camera(c, 1.04); nightSky(c, 1, vt, { seed: 5 });
  drawMoon(c, W / 2, H / 2 - 40, 230, { alpha: 1, rays: .8, t: vt });
  const k = E.inOut(prog(vt, 4.5, 5.9)); drawCloud(c, lerp(-700, W + 500, k), H / 2 - 40, 3.2, '#2a2140', 1);
  c.restore();
  pill(c, 'NOT A CLOUD', W / 2, 900, 34, prog(vt, 4.9, 5.2) * (1 - prog(vt, 5.9, 6.1)));
});

// 3 — "Gone." Same framing, empty sky
shot(6.2, (c, lt, d, vt) => {
  c.save(); camera(c, 1.04 + lt * .02); nightSky(c, .55, vt, { seed: 5 });
  c.globalAlpha = .5 * (1 - prog(lt, .1, 1.1)); c.strokeStyle = P.white; c.setLineDash([16, 14]); c.lineWidth = 3; circle(c, W / 2, H / 2 - 40, 230); c.stroke(); c.restore();
  text(c, 'GONE.', W / 2, H / 2 - 40, 150, { spacing: 16, alpha: prog(lt, .12, .3) * (1 - prog(lt, 1.05, 1.3)) });
}, { flash: .35 });

// 4 — Title: "What would actually happen to us?"
shot(7.5, (c, lt, d, vt) => {
  rooftop(c, vt, { moon: 0, light: .55, cam: { z: 1.12 - lt * .02, x: 0, y: 0 }, pose: { look: [.2, -.9], mouth: 'o', brows: 'worried' } });
  const a = E.out(prog(lt, .15, .6)), b = E.out(prog(lt, .45, .9)), out = 1 - prog(lt, 2.0, 2.25);
  c.save(); c.globalAlpha = .25 * a * out; c.strokeStyle = P.white; c.setLineDash([18, 14]); c.lineWidth = 4; circle(c, 1320, 300, 110); c.stroke(); c.restore();
  text(c, 'WHAT IF', W / 2, 190 - (1 - a) * 30, 64, { spacing: 18, alpha: a * out, color: '#f6c88f' });
  text(c, 'THE MOON DISAPPEARED?', W / 2, 290 - (1 - b) * 30, 104, { spacing: 8, alpha: b * out });
});

// 5 — "It's a clear night. Millions of people are staring at a bright full Moon."
shot(9.75, (c, lt, d, vt) => {
  const p = E.inOutSine(prog(lt, 0, d));
  rooftop(c, vt, {
    moon: 1, moonX: 960, moonY: 260, moonR: 120, cam: { z: 1.06 - p * .05, x: 0, y: 0 }, noPerson: true,
    crowd: (cc) => {
      const r = rng(77); const cols = [P.red, P.yellow, P.teal, P.purple, P.green, P.blue, P.pink, P.orange];
      for (let i = 0; i < 15; i++) { const x = 140 + i * 118 + (r() - .5) * 30, s = .8 + r() * .2; person(cc, { x, y: H - 172, s, color: cols[i % 8], look: [(960 - x) / 1500, -.9], blink: blinkAt(vt, i), mouth: r() < .5 ? 'smile' : 'o', armR: i % 3 === 0 ? [-2.3, .2] : undefined, phone: i % 3 === 0, rimSide: x < 960 ? 1 : -1, hardhat: i === 6 }); }
    },
  });
  pill(c, 'A CLEAR NIGHT', W / 2, 520, 32, prog(vt, 10.0, 10.3) * (1 - prog(vt, 11.6, 11.9)));
});

// 6 — "And then, without a sound, it vanishes."
shot(14.4, (c, lt, d, vt) => {
  const v = prog(vt, 16.62, 16.95);
  c.save(); camera(c, 1.1 + lt * .04); nightSky(c, 1 - v * .5, vt, { seed: 2 });
  if (v < 1) { const k = E.in(v); drawMoon(c, W / 2, H / 2, 280 * (1 - k * .9), { alpha: 1 - k, rays: 1 - k, t: vt }); }
  if (v > 0 && v < 1) glow(c, W / 2, H / 2, 600 * (1 - v), 'rgba(255,245,225,0.9)', 1 - v);
  // expanding ring after vanish
  const rr = prog(vt, 16.8, 17.8); if (rr > 0 && rr < 1) { c.strokeStyle = `rgba(255,240,220,${.5 * (1 - rr)})`; c.lineWidth = 6 * (1 - rr) + 1; circle(c, W / 2, H / 2, 280 + rr * 700); c.stroke(); }
  c.restore();
}, { flashAt: 16.8 });

// 7 — "For about one point three seconds, nothing changes. That's how long the Moon's last light takes to reach us."
shot(17.85, (c, lt, d, vt) => {
  space(c, vt); const ex = 330, mx = 1590, y = 560;
  drawEarth(c, ex, y, 150, { rot: vt * .02, night: .2 });
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.setLineDash([14, 12]); c.lineWidth = 3; circle(c, mx, y, 60); c.stroke(); c.restore();
  // last light front travelling to Earth
  const k = prog(vt, 18.4, 23.6); const fx = lerp(mx - 60, ex + 150, k);
  if (k < 1) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(fx, 0, mx, 0); g.addColorStop(0, 'rgba(255,240,210,0.85)'); g.addColorStop(.25, 'rgba(255,240,210,0.25)'); g.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = g; c.fillRect(fx, y - 60, mx - fx, 120); glow(c, fx, y, 90, 'rgba(255,245,225,1)'); c.restore(); }
  if (k >= 1) glow(c, ex + 150, y, 160 * (1 - prog(vt, 23.6, 24.2)), 'rgba(255,240,210,0.9)');
  // distance line
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ex, y + 230); c.lineTo(mx, y + 230); c.stroke();
  for (const xx of [ex, mx]) { c.beginPath(); c.moveTo(xx, y + 215); c.lineTo(xx, y + 245); c.stroke(); }
  text(c, '384,400 km', (ex + mx) / 2, y + 270, 30, { alpha: prog(vt, 21.6, 22.0), color: '#cfd8ff' });
  const sec = 1.3 * k; stopwatch(c, W / 2, 230, 95, sec / 1.3, sec.toFixed(2) + ' s', prog(lt, 0, .3));
  pill(c, "THE MOON'S LAST LIGHT", (fx + mx) / 2 > W / 2 ? W / 2 + 360 : W / 2 - 360, y - 150, 28, prog(vt, 21.5, 21.8) * (1 - prog(vt, 23.8, 24.1)));
  text(c, 'Moon', mx, y + 100, 28, { alpha: .7, color: '#cfd8ff', weight: '600' }); text(c, 'Earth', ex, y + 190, 28, { alpha: .7, color: '#cfd8ff', weight: '600' });
});

// 8 — "Then the sky goes dark."
shot(24.3, (c, lt, d, vt) => {
  const dk = E.inOut(prog(vt, 24.9, 25.6));
  rooftop(c, vt, { moon: 0, light: lerp(.75, .08, dk), cam: { z: 1.35, x: -40, y: -120 }, pose: { look: [.3, -.9], mouth: dk > .5 ? 'o' : 'flat', brows: dk > .5 ? 'worried' : null, rim: dk > .5 ? '#4a3b55' : P.rim } });
});

// 9 — "Phones come out."
shot(25.7, (c, lt, d, vt) => {
  rooftop(c, vt, {
    moon: 0, light: .08, cam: { z: 1.0, x: 0, y: 0 }, noPerson: true,
    crowd: (cc) => { const cols = [P.red, P.yellow, P.teal, P.purple, P.green, P.blue, P.pink]; for (let i = 0; i < 9; i++) { const x = 160 + i * 200, up = E.outBack(prog(vt, 25.75 + i * .07, 26.15 + i * .07)); person(cc, { x, y: H - 110, s: 1.6, color: cols[i % 7], look: [0, -.4], mouth: 'o', brows: 'worried', armR: [lerp(-.2, -2.2, up), lerp(.1, .5, up)], phone: up > .1, rim: '#40385a', rimSide: 1 }); } },
  });
});

// 10 — "Astronomers panic."
shot(27.3, (c, lt, d, vt) => {
  // observatory interior
  vgrad(c, 0, H, [[0, '#120f1d'], [1, '#2a2033']]);
  c.save(); c.fillStyle = '#05050a'; c.beginPath(); c.moveTo(560, 0); c.lineTo(1360, 0); c.lineTo(1300, 420); c.lineTo(620, 420); c.fill(); drawStars(c, 33, vt, 1, 200, 420); c.restore();
  c.save(); c.globalCompositeOperation = 'destination-over'; c.restore();
  c.strokeStyle = '#3b2d4f'; c.lineWidth = 30; c.beginPath(); c.arc(W / 2, 1100, 1000, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  c.fillStyle = '#1b1524'; c.fillRect(0, 860, W, 220);
  // telescope
  c.save(); c.translate(1150, 820); c.rotate(-.75 + Math.sin(vt * 9) * .02 * prog(lt, .8, 1)); c.fillStyle = '#d9d2c8'; rrect(c, -60, -40, 560, 80, 20); c.fill(); c.fillStyle = '#9a9188'; c.fillRect(380, -48, 40, 96); c.restore();
  c.fillStyle = '#4a3f55'; c.fillRect(1120, 820, 60, 50); c.fillRect(1080, 860, 140, 14);
  // papers flying
  const r = rng(5); for (let i = 0; i < 12; i++) { const k = prog(vt, 27.6 + r() * .6, 29.8 + r()); if (k <= 0) continue; const x = 700 + r() * 500 + k * (r() - .3) * 900, y = 760 - Math.sin(k * Math.PI) * (200 + r() * 300) + k * 200; c.save(); c.translate(x, y); c.rotate(k * 8 * (r() - .5)); c.fillStyle = '#f2ece2'; c.fillRect(-30, -40, 60, 80); c.fillStyle = 'rgba(0,0,0,0.3)'; for (let l = 0; l < 5; l++) c.fillRect(-22, -30 + l * 14, 44, 4); c.restore(); }
  const shk = shake(vt, 4 * prog(lt, .5, 1));
  person(c, { x: 780 + shk[0], y: 862, s: 1.7, color: '#f1eee8', coat: true, glasses: true, look: [.5, -.3], mouth: 'o', brows: 'worried', sweat: true, armL: [2.6 + Math.sin(vt * 14) * .25, .4], armR: [-2.6 - Math.sin(vt * 14 + 1) * .25, -.4], tilt: Math.sin(vt * 7) * .06, rimSide: 1 });
  pill(c, 'ASTRONOMERS', 420, 220, 32, prog(vt, 27.4, 27.7) * (1 - prog(vt, 29.9, 30.2)));
});

// 11 — "But the real problems are only getting started."
shot(30.3, (c, lt, d, vt) => { const p = E.inOutSine(prog(lt, 0, d)); ocean(c, vt, { light: .22, moon: 0, cam: { z: 1 + p * .12, x: 0, y: 40 * p }, beach: false, horizon: 620 }); });

// 12 — "First, the oceans."
shot(31.8, (c, lt, d, vt) => {
  ocean(c, vt, { light: .6, moon: 1, cam: { z: 1.05, x: -lt * 30, y: 0 } });
  text(c, '1', 180, 170, 120, { color: '#f6c88f', alpha: prog(vt, 31.9, 32.2) }); text(c, 'THE OCEANS', 470, 170, 64, { spacing: 10, alpha: prog(vt, 32.0, 32.35) });
});

// 13-14 — Tides diagram: with Moon, then without
function tideDiagram(c, vt, moonA, sunOnly) {
  gridBg(c, vt); const ex = 820, y = 560; const bulge = lerp(.2, 1, moonA) * (sunOnly ? .45 : 1);
  const mx = 1600; if (moonA > 0) { drawMoon(c, mx, y, 70, { alpha: moonA, halo: true }); }
  if (moonA < 1) { c.save(); c.globalAlpha = .5 * (1 - moonA); c.strokeStyle = P.white; c.setLineDash([12, 10]); c.lineWidth = 3; circle(c, mx, y, 70); c.stroke(); c.restore(); }
  if (sunOnly) drawSun(c, 120, y, 70, sunOnly, vt);
  // water envelope
  c.save(); c.fillStyle = 'rgba(70,150,255,0.45)'; c.strokeStyle = 'rgba(140,200,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.ellipse(ex, y, 200 + 70 * bulge, 200 - 10 * bulge, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
  drawEarth(c, ex, y, 190, { rot: vt * .03, glowA: .3 });
  // pull arrows
  if (moonA > .05) { c.save(); c.globalAlpha = moonA; c.strokeStyle = '#f6c88f'; c.lineWidth = 6; for (let i = 0; i < 3; i++) { const ax = 1120 + i * 90 + ((vt * 120) % 90); c.beginPath(); c.moveTo(ax + 40, y); c.lineTo(ax, y); c.moveTo(ax + 18, y - 18); c.lineTo(ax, y); c.lineTo(ax + 18, y + 18); c.stroke(); } c.restore(); }
}
shot(33.75, (c, lt, d, vt) => {
  tideDiagram(c, vt, 1, 0);
  pill(c, "THE MOON'S GRAVITY", 1600, 400, 30, prog(vt, 33.9, 34.2));
  pill(c, 'MOST OF OUR TIDES', 820, 860, 34, prog(vt, 35.1, 35.4));
});
shot(36.4, (c, lt, d, vt) => {
  const mA = 1 - E.inOut(prog(vt, 36.5, 37.3)); tideDiagram(c, vt, mA, E.out(prog(vt, 37.0, 37.8)));
  pill(c, 'ONLY THE SUN', 120, 410, 28, prog(vt, 37.6, 37.9));
  // tide range bars
  const k = E.inOut(prog(vt, 39.3, 40.6)); const bx = 1380, by = 900;
  c.save(); c.globalAlpha = prog(vt, 38.8, 39.1);
  text(c, 'TIDE RANGE', bx + 150, by - 300, 30, { color: '#cfd8ff', spacing: 4 });
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(bx, by - 240, 100, 240); c.fillStyle = '#4fb3ff'; c.fillRect(bx + 200, by - 240 * lerp(1, .42, k), 100, 240 * lerp(1, .42, k));
  text(c, 'NOW', bx + 50, by + 30, 24, { color: '#cfd8ff' }); text(c, 'NO MOON', bx + 250, by + 30, 24, { color: '#cfd8ff' });
  c.restore();
  pill(c, 'TIDES SHRINK BY MORE THAN HALF', W / 2, 140, 34, prog(vt, 40.0, 40.3), { border: '#ffb347' });
});

// 15 — "That sounds small. It isn't."
shot(41.6, (c, lt, d, vt) => {
  const isnt = vt > 43.2; ocean(c, vt, { light: .45, moon: 0, cam: { z: isnt ? 1.5 : 1.1, x: isnt ? -60 : 0, y: isnt ? -60 : 0 }, tide: .3 });
  c.save(); camera(c, isnt ? 1.5 : 1.1, isnt ? -60 : 0, isnt ? -60 : 0);
  person(c, { x: 900, y: 900, s: 1.5, color: P.red, look: isnt ? [0, 0] : [.4, 0], mouth: isnt ? 'flat' : 'smile', brows: isnt ? 'angry' : null, armL: isnt ? [.2, -.1] : [1.9, -1.2], armR: isnt ? [-.2, .1] : [-1.9, 1.2], tilt: isnt ? 0 : .12, blink: blinkAt(vt), rimSide: 1 });
  c.restore();
  text(c, isnt ? 'IT ISN\'T.' : 'SOUNDS SMALL?', W / 2, isnt ? 130 : 200, isnt ? 110 : 76, { spacing: 10, alpha: isnt ? prog(vt, 43.25, 43.4) : prog(vt, 41.75, 42.0) });
});

// 16-17 — Tide pool drying, critters
function tidePool(c, vt, water, dead) {
  vgrad(c, 0, H, [[0, '#2c2442'], [.45, '#6c4c6a'], [.46, '#3a2e33'], [1, '#2a2125']]);
  glow(c, 1500, 300, 600, 'rgba(255,170,120,0.2)');
  // rocks
  const r = rng(9); for (let i = 0; i < 14; i++) { c.fillStyle = mixColor('#2b2226', '#4d3d40', r()); c.beginPath(); c.ellipse(r() * W, 520 + r() * 520, 100 + r() * 180, 50 + r() * 80, 0, 0, TAU); c.fill(); }
  // pool
  c.save(); c.beginPath(); c.ellipse(W / 2, 780, 720, 230, 0, 0, TAU); c.fillStyle = '#1f1719'; c.fill(); c.clip();
  if (water > 0) { const wy = lerp(1010, 560, water); vgrad(c, wy, 1020, [[0, 'rgba(90,160,210,0.85)'], [1, 'rgba(30,70,120,0.95)']], 0, W); c.strokeStyle = 'rgba(220,240,255,0.6)'; c.lineWidth = 3; c.beginPath(); for (let x = 200; x < 1720; x += 20) { const yy = wy + Math.sin(x * .02 + vt * 2) * 3; x === 200 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  // dried salt cracks
  c.strokeStyle = `rgba(230,220,200,${.4 * (1 - water)})`; c.lineWidth = 2; const r2 = rng(3); for (let i = 0; i < 30; i++) { let x = 300 + r2() * 1300, y = 640 + r2() * 300; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r2() - .5) * 80; y += (r2() - .5) * 40; c.lineTo(x, y); } c.stroke(); }
  c.restore();
}
shot(44.15, (c, lt, d, vt) => {
  const w = 1 - E.inOut(prog(vt, 44.2, 45.3)); c.save(); camera(c, 1.05 + lt * .03); tidePool(c, vt, lerp(.25, 1, w), 0); c.restore();
  pill(c, 'TIDE POOLS DRY OUT', W / 2, 170, 34, prog(vt, 44.25, 44.5));
});
shot(44.95, (c, lt, d, vt) => {
  const dead = E.inOut(prog(vt, 48.6, 49.6)); c.save(); camera(c, 1.12 + lt * .02); tidePool(c, vt, .25 * (1 - prog(vt, 46, 49)), dead);
  const pc = (t0) => E.outBack(prog(vt, t0, t0 + .35));
  const a1 = pc(45.0), a2 = pc(45.8), a3 = pc(46.4);
  if (a1 > 0) crab(c, 620, 800, a1 * 1.3, '#e2452f', vt, dead);
  if (a2 > 0) snail(c, 980, 830, a2 * 1.2, vt, dead);
  if (a3 > 0) seaStar(c, 1330, 810, a3 * 1.3, vt, dead);
  c.restore();
  pill(c, 'CRABS', 560, 560, 30, prog(vt, 45.0, 45.25)); pill(c, 'SNAILS', 960, 580, 30, prog(vt, 45.8, 46.05)); pill(c, 'SEA STARS', 1360, 560, 30, prog(vt, 46.4, 46.65));
  // tide clock icon broken rhythm
  const ta = prog(vt, 47.0, 47.3); if (ta > 0) { c.save(); c.globalAlpha = ta; c.strokeStyle = P.white; c.lineWidth = 4; circle(c, W / 2, 200, 60); c.stroke(); c.beginPath(); for (let x = -50; x <= 50; x += 4) c.lineTo(W / 2 + x, 200 + Math.sin(x * .12 + vt * 3) * 20 * (1 - dead)); c.stroke(); c.restore(); text(c, 'THE RHYTHM OF THE TIDES', W / 2, 300, 28, { alpha: ta * (1 - prog(vt, 49.6, 49.9)), color: '#cfd8ff', spacing: 3 }); }
  if (dead > 0) { c.save(); c.globalAlpha = dead * .35; c.fillStyle = '#20202a'; c.globalCompositeOperation = 'saturation'; c.fillRect(0, 0, W, H); c.restore(); }
});

// 18 — "And the animals that eat them are next."
shot(50.5, (c, lt, d, vt) => {
  c.save(); camera(c, 1.1); tidePool(c, vt, 0, 1);
  crab(c, 620, 800, 1.3, '#e2452f', vt, 1); snail(c, 980, 830, 1.2, vt, 1); seaStar(c, 1330, 810, 1.3, vt, 1);
  const k = E.inOut(prog(vt, 50.6, 52.0)); gull(c, lerp(W + 200, 1000, k), lerp(150, 520, k), 1.6, vt * 9 * (1 - k * .6));
  c.restore();
  // food chain arrows
  const icons = ['CRAB', 'BIRD', 'FOX'], a = (i) => prog(vt, 51.2 + i * .35, 51.5 + i * .35);
  for (let i = 0; i < 3; i++) { pill(c, icons[i], 640 + i * 320, 160, 28, a(i), { border: i ? '#ff6b5a' : '#9aa' }); if (i) { text(c, '→', 480 + i * 320, 160, 50, { alpha: a(i) }); } }
});

// 19 — "Then, there's the darkness."
shot(52.95, (c, lt, d, vt) => {
  const dk = E.inOut(prog(vt, 53.0, 54.6)); rooftop(c, vt, { moon: 0, light: lerp(.25, .02, dk), cam: { z: 1.2 + lt * .05, x: 0, y: -60 }, pose: { look: [-.3, -.2], mouth: 'flat', rim: '#2f2840', armR: [-1.4, -.2], flashlight: true } });
  // flashlight beam
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .22 * (.85 + .15 * Math.sin(vt * 20)); const g = c.createRadialGradient(1100, 520, 0, 1100, 520, 900); g.addColorStop(0, 'rgba(255,235,190,1)'); g.addColorStop(1, 'rgba(255,235,190,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(1060, 560); c.lineTo(1920, 200); c.lineTo(1920, 760); c.closePath(); c.fill(); c.restore();
  c.fillStyle = `rgba(0,0,0,${.55 * dk})`; c.fillRect(0, 0, W, H);
});

// 20 — "Without moonlight, nights turn pitch black."
shot(55.2, (c, lt, d, vt) => {
  const dk = E.inOut(prog(vt, 55.6, 57.0));
  vgrad(c, 0, H, [[0, mixColor('#030306', '#1d1a33', 1 - dk)], [1, mixColor('#010102', '#0e0c18', 1 - dk)]]);
  drawStars(c, 61, vt, .8, 300, 600);
  const r = rng(13); c.fillStyle = mixColor('#020203', '#0e0b14', 1 - dk);
  for (let i = 0; i < 30; i++) { const x = r() * W * 1.1 - 80, h = 300 + r() * 500, w = 120 + r() * 120; c.beginPath(); c.moveTo(x, H); c.lineTo(x + w / 2, H - h); c.lineTo(x + w, H); c.fill(); c.fillRect(x + w / 2 - 8, H - 60, 16, 60); }
  // eyes in the dark
  const e = rng(17); for (let i = 0; i < 7; i++) { const x = 200 + e() * 1500, y = 600 + e() * 380, a = prog(vt, 56.2 + i * .2, 56.5 + i * .2) * blinkAt(vt, i); c.fillStyle = `rgba(255,230,140,${.85 * a})`; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 14, y, 6, 4 * a + .1, 0, 0, TAU); c.fill(); } glow(c, x, y, 40, 'rgba(255,220,120,0.25)', a); }
  text(c, 'PITCH BLACK', W / 2, 200, 70, { spacing: 14, alpha: prog(vt, 56.4, 56.8) * .9, color: '#bfb7d6' });
});

// 21 — Coral reef spawning
shot(58.2, (c, lt, d, vt) => {
  const off = E.inOut(prog(vt, 61.5, 62.3)), light = 1 - off * .85;
  underwater(c, vt, light);
  if (off < 1) { c.save(); c.globalAlpha = 1 - off; drawMoon(c, 1500, -40, 90, { alpha: .45, halo: true, rays: 0 }); c.restore(); }
  // reef
  const cols = ['#e66b9a', '#ef7d32', '#c77dff', '#f2b632', '#2aa39a'];
  const r = rng(31); for (let i = 0; i < 16; i++) { const x = 60 + i * 120 + r() * 40; if (i % 3 === 0) brainCoral(c, x, 1040, 70 + r() * 30, cols[i % 5], light); else coral(c, x, 1060, .9 + r() * .6, cols[i % 5], i, light); }
  c.fillStyle = mixColor('#05070a', '#1d2a33', light); c.fillRect(0, 1030, W, 60);
  // spawning bundles: synchronized before, scattered after
  const s = rng(55); for (let i = 0; i < 220; i++) {
    const x0 = 60 + s() * 1800, sync = 58.8 + s() * .5, late = 62.6 + s() * 6, isSync = s() > off;
    const t0 = isSync && sync < 61.8 ? sync : late; const k = (vt - t0) / 5; if (k <= 0 || k > 1) continue;
    const x = x0 + Math.sin(vt * 1.5 + i) * 20, y = 1000 - k * 950; const rad = 6 + s() * 5; glow(c, x, y, rad * 4, 'rgba(255,170,210,0.5)', 1 - k); c.fillStyle = `rgba(255,200,220,${.95 * (1 - k)})`; circle(c, x, y, rad); c.fill();
  }
  pill(c, 'CORALS SPAWN BY MOONLIGHT', W / 2, 160, 32, prog(vt, 58.4, 58.7) * (1 - prog(vt, 61.2, 61.5)));
  pill(c, 'SIGNAL LOST', W / 2, 160, 32, prog(vt, 61.6, 61.9), { border: '#ff6b5a' });
});

// 22 — "But the biggest change is the slowest one."
shot(64.3, (c, lt, d, vt) => {
  space(c, vt, { seed: 7 }); const p = E.inOutSine(prog(lt, 0, d));
  c.save(); camera(c, 1 + p * .1); drawEarth(c, W / 2, H / 2, 260, { rot: vt * .01, tilt: .41, night: .4 }); c.restore();
  // hourglass
  const hx = 1550, hy = 540, sand = prog(vt, 64.3, 67.0);
  c.save(); c.strokeStyle = '#f6c88f'; c.lineWidth = 6; c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(hx - 80, hy - 140); c.lineTo(hx + 80, hy - 140); c.lineTo(hx + 8, hy); c.lineTo(hx + 80, hy + 140); c.lineTo(hx - 80, hy + 140); c.lineTo(hx - 8, hy); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffcf7a'; c.beginPath(); c.moveTo(hx - 60 * (1 - sand * .5), hy - 120 + sand * 100); c.lineTo(hx + 60 * (1 - sand * .5), hy - 120 + sand * 100); c.lineTo(hx, hy - 4); c.fill(); c.beginPath(); c.moveTo(hx - 70, hy + 135); c.lineTo(hx + 70, hy + 135); c.lineTo(hx, hy + 135 - 30 - sand * 50); c.fill(); c.fillRect(hx - 2, hy, 4, 130); c.restore();
  text(c, 'THE SLOWEST CHANGE', W / 2, 140, 54, { spacing: 10, alpha: prog(vt, 65.4, 65.8) });
});

// 23 — Tilt 23.5°
function axisDiagram(c, vt, tiltDeg, o = {}) {
  space(c, vt, { seed: 9 }); const x = o.x ?? W / 2, y = o.y ?? H / 2 + 20, r = o.r ?? 230, tilt = tiltDeg * Math.PI / 180;
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.setLineDash([8, 10]); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - r * 1.6); c.lineTo(x, y + r * 1.6); c.stroke(); c.restore();
  drawEarth(c, x, y, r, { rot: vt * .05, tilt, axis: .9, night: .3 });
  if (o.arc !== false) { c.save(); c.strokeStyle = '#f6c88f'; c.lineWidth = 5; c.beginPath(); c.arc(x, y, r * 1.35, -Math.PI / 2, -Math.PI / 2 + tilt, tilt < 0); c.stroke(); c.restore(); }
}
shot(67.0, (c, lt, d, vt) => {
  const tl = 23.5 * E.outBack(prog(vt, 67.3, 68.3)); axisDiagram(c, vt, tl);
  text(c, tl.toFixed(1) + '°', W / 2 + 150, 170, 80, { color: '#f6c88f', alpha: prog(vt, 67.6, 67.9) });
  pill(c, "EARTH'S TILT", 400, 200, 32, prog(vt, 67.4, 67.7));
});
// 24 — Seasons orbit
shot(70.8, (c, lt, d, vt) => {
  space(c, vt, { seed: 10 }); const cx = W / 2, cy = 560; drawSun(c, cx, cy, 90, 1, vt);
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, 700, 300, 0, 0, TAU); c.stroke();
  const names = ['SUMMER', 'AUTUMN', 'WINTER', 'SPRING'], ang = vt * .45;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI; const px = cx + Math.cos(a) * 700, py = cy + Math.sin(a) * 300; c.save(); c.globalAlpha = .55; drawEarth(c, px, py, 48, { rot: vt * .1, tilt: .41, glowA: .2 }); c.restore(); text(c, names[i], px, py + (Math.sin(a) > 0 ? 100 : -100), 28, { alpha: prog(vt, 71.0 + i * .3, 71.3 + i * .3), color: '#cfd8ff', spacing: 4 }); }
  const ea = ang; drawEarth(c, cx + Math.cos(ea) * 700, cy + Math.sin(ea) * 300, 64, { rot: vt * .2, tilt: .41, axis: .8 });
  pill(c, 'STEADY, PREDICTABLE SEASONS', W / 2, 140, 34, prog(vt, 71.6, 71.9));
});
// 25 — "And the Moon is what keeps it steady."
shot(73.65, (c, lt, d, vt) => {
  axisDiagram(c, vt, 23.5 + Math.sin(vt * 4) * .6, { arc: false });
  const a = vt * .9, mx = W / 2 + Math.cos(a) * 520, my = H / 2 + 20 + Math.sin(a) * 160;
  c.save(); c.strokeStyle = 'rgba(246,200,143,0.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(W / 2, H / 2 + 20, 520, 160, 0, 0, TAU); c.stroke(); c.restore();
  drawMoon(c, mx, my, 50, { alpha: 1, halo: true }); c.save(); c.strokeStyle = 'rgba(246,200,143,0.6)'; c.setLineDash([6, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2, H / 2 + 20); c.lineTo(mx, my); c.stroke(); c.restore();
  pill(c, 'THE MOON KEEPS IT STEADY', W / 2, 140, 34, prog(vt, 73.9, 74.2), { border: '#f6c88f' });
});
// 26 — Wobble over millions of years
shot(75.8, (c, lt, d, vt) => {
  const gone = E.in(prog(vt, 75.9, 76.5)); const wob = prog(vt, 76.6, 83.5);
  const tilt = 23.5 + Math.sin(vt * (1.2 + wob * 2.5)) * 6 + Math.sin(vt * 2.7) * wob * 24 * prog(vt, 80.5, 83);
  axisDiagram(c, vt, tilt, { arc: true });
  if (gone < 1) drawMoon(c, W / 2 + 520, H / 2 + 20, 50 * (1 - gone), { alpha: 1 - gone });
  // arc range of drift
  const ra = prog(vt, 81.2, 82.2); if (ra > 0) { c.save(); c.globalAlpha = ra; c.fillStyle = 'rgba(255,107,90,0.18)'; c.beginPath(); c.moveTo(W / 2, H / 2 + 20); c.arc(W / 2, H / 2 + 20, 400, -Math.PI / 2 - .05, -Math.PI / 2 + 1.0); c.closePath(); c.fill(); c.restore(); }
  pill(c, 'NOT OVERNIGHT', W / 2, 140, 34, prog(vt, 78.7, 78.95) * (1 - prog(vt, 79.6, 79.85)));
  const yrs = Math.floor(E.in(prog(vt, 79.6, 82.6)) * 10) * 1e6;
  if (vt > 79.6) { text(c, yrs.toLocaleString('en-US') + ' YEARS', W / 2, 140, 60, { spacing: 6, alpha: prog(vt, 79.6, 79.8), color: '#f6c88f' }); }
  pill(c, 'TILT DRIFTS BY TENS OF DEGREES', W / 2, 960, 32, prog(vt, 82.3, 82.6), { border: '#ff6b5a' });
});
// 27 — Summers so hot the tropics become unlivable
shot(83.95, (c, lt, d, vt) => {
  vgrad(c, 0, H, [[0, '#f0b45a'], [.6, '#e36b2f'], [1, '#8a2d16']]); drawSun(c, 1450, 260, 160, 1, vt);
  c.save(); for (let i = 0; i < 5; i++) { c.globalAlpha = .08; c.fillStyle = '#fff3d6'; const y = 620 + i * 40 + Math.sin(vt * 3 + i) * 6; c.fillRect(0, y, W, 6); } c.restore();
  c.fillStyle = '#5a1f12'; c.beginPath(); c.moveTo(0, 800); for (let x = 0; x <= W; x += 60) c.lineTo(x, 800 + Math.sin(x * .004) * 30); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  // dead palm
  c.strokeStyle = '#2a0f08'; c.lineWidth = 22; c.beginPath(); c.moveTo(380, 820); c.quadraticCurveTo(420, 600, 360, 430); c.stroke(); c.lineWidth = 10; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(360, 430); c.quadraticCurveTo(360 + (i - 2) * 80, 400, 360 + (i - 2) * 140, 520); c.stroke(); }
  const sh = shake(vt, 2); person(c, { x: 1000 + sh[0], y: 830, s: 1.7, color: P.red, mouth: 'o', brows: 'worried', sweat: true, look: [.3, -.3], armL: [2.4, .6], tilt: .08 + Math.sin(vt * 3) * .03, rimSide: 1, rim: '#ffe0a0' });
  thermometer(c, 1700, 860, 420, .5 + .5 * E.out(prog(vt, 84.1, 85.4)));
  text(c, 'UNLIVABLE TROPICS', 800, 160, 64, { spacing: 8, alpha: prog(vt, 85.0, 85.3) });
}, { heat: 1 });
// 28 — Winters that bury continents in ice
shot(87.2, (c, lt, d, vt) => {
  space(c, vt, { seed: 12 }); const ice = E.inOut(prog(vt, 87.4, 89.7)); c.save(); camera(c, 1.05 + lt * .03); drawEarth(c, W / 2, H / 2, 330, { rot: vt * .03, ice, tilt: .2 }); c.restore();
  const r = rng(91); c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 200; i++) { const x = (r() * W + vt * (90 + r() * 120)) % W, y = (r() * H + vt * (160 + r() * 200)) % H; circle(c, x, y, 1.5 + r() * 2.5); c.fill(); }
  thermometer(c, 1700, 860, 420, .5 - .45 * E.out(prog(vt, 87.3, 88.6)));
  text(c, 'CONTINENTS UNDER ICE', W / 2, 140, 60, { spacing: 8, alpha: prog(vt, 88.2, 88.5) });
}, { cold: 1 });
// 29 — Climate swings from one extreme to the other
shot(90.2, (c, lt, d, vt) => {
  const sw = .5 + .5 * Math.sin((vt - 90.2) * 2.6 - Math.PI / 2);
  vgrad(c, 0, H, [[0, mixColor('#173c66', '#e88a3a', sw)], [1, mixColor('#0b1a33', '#7a2410', sw)]]);
  drawEarth(c, 700, H / 2 + 20, 280, { rot: vt * .04, ice: (1 - sw) * .7, heat: sw * .8, tilt: Math.sin(vt * 1.3) * .5 });
  thermometer(c, 1350, 820, 520, sw, 1);
  text(c, 'HOT', 1530, 360, 44, { alpha: .4 + .6 * sw, color: '#ffb08a' }); text(c, 'COLD', 1530, 800, 44, { alpha: 1 - .6 * sw, color: '#a6d8ff' });
  text(c, 'EXTREME TO EXTREME', W / 2, 120, 56, { spacing: 8, alpha: prog(vt, 90.4, 90.7) });
});
// 30 — Long pause: empty sky, breath
shot(93.3, (c, lt, d, vt) => { c.save(); camera(c, 1.15 - lt * .06); nightSky(c, .1, vt, { seed: 14 }); c.restore(); }, { fadeIn: .4 });
// 31 — "So, could we survive?"
shot(94.45, (c, lt, d, vt) => {
  const p = E.inOutSine(prog(lt, 0, d));
  rooftop(c, vt, { moon: 0, light: .3, cam: { z: 1.0 + p * .1, x: 0, y: 0 }, pose: { x: 820, look: [.2, -.8], mouth: 'flat', blink: blinkAt(vt, 2) } });
  text(c, 'COULD WE SURVIVE?', W / 2, 220, 84, { spacing: 10, alpha: prog(vt, 94.6, 95.0) * (1 - prog(vt, 96.5, 96.8)) });
});
// 32 — "Probably. Humans are stubborn."
shot(96.8, (c, lt, d, vt) => {
  const hh = vt > 97.55; rooftop(c, vt, { moon: 0, light: .32, cam: { z: 1.4, x: -60, y: -180 }, pose: { look: [0, 0], mouth: hh ? 'grin' : 'smile', brows: hh ? 'angry' : null, hardhat: hh, armL: hh ? [.3, -.1] : [2.6, 1.6], blink: blinkAt(vt, 4) } });
  text(c, 'PROBABLY.', W / 2, 200, 96, { spacing: 10, alpha: prog(vt, 96.9, 97.1) * (1 - prog(vt, 97.5, 97.6)) });
  pill(c, 'HUMANS ARE STUBBORN', 1350, 330, 40, prog(vt, 97.6, 97.85));
}, { punchAt: 97.55 });
// 33 — "We'd adapt, we'd build, and we'd move."
shot(98.95, (c, lt, d, vt) => {
  c.fillStyle = '#0b0910'; c.fillRect(0, 0, W, H);
  const panels = [[99.0, 'ADAPT'], [99.85, 'BUILD'], [100.6, 'MOVE']]; const pw = W / 3;
  panels.forEach(([t0, label], i) => {
    const k = E.outExpo(prog(vt, t0, t0 + .35)); if (k <= 0) return; const x = i * pw;
    c.save(); c.beginPath(); c.rect(x + 6, 6, pw - 12, H - 12); c.clip(); c.translate(0, (1 - k) * H);
    vgrad(c, 0, H, [[0, ['#1e2a4a', '#3a2440', '#2a1d3a'][i]], [1, '#0c0a12']], x, pw);
    if (i === 0) { glow(c, x + pw / 2, 520, 300, 'rgba(255,190,110,0.5)'); c.fillStyle = '#ffcf7a'; circle(c, x + pw / 2, 420, 30); c.fill(); c.fillStyle = '#ddd'; c.fillRect(x + pw / 2 - 4, 450, 8, 120); person(c, { x: x + pw / 2 - 30, y: 900, s: 1.4, color: P.teal, look: [.3, -.6], mouth: 'smile', armR: [-2.4, .2], rimSide: 1 }); }
    if (i === 1) { const bh = E.out(prog(vt, 99.9, 101.2)); c.fillStyle = '#4a3f55'; for (let b = 0; b < 5; b++) c.fillRect(x + 120 + b * 75, 900 - bh * (150 + b * 70), 60, bh * (150 + b * 70)); c.fillStyle = 'rgba(255,190,110,0.8)'; for (let b = 0; b < 5; b++) for (let wy = 0; wy < bh * (150 + b * 70) - 30; wy += 40) c.fillRect(x + 140 + b * 75, 870 - wy, 20, 16); person(c, { x: x + 80, y: 900, s: 1.2, color: P.yellow, hardhat: true, look: [.5, -.3], mouth: 'grin', armR: [-1.8 + Math.sin(vt * 12) * .4, .6], rimSide: 1 }); }
    if (i === 2) { for (let g = 0; g < 3; g++) { const ph = vt * 7 + g; person(c, Object.assign({ x: x + 120 + g * 120 + ((vt - 100.6) * 60), y: 900, s: 1.1, color: [P.red, P.purple, P.green][g], look: [.6, 0], mouth: 'smile', rimSide: 1 }, walkPose(ph))); } }
    c.restore();
    text(c, label, x + pw / 2, 160, 64, { spacing: 12, alpha: k });
  });
});
// 34 — "But our world would be darker, stranger, and far less predictable."
shot(101.8, (c, lt, d, vt) => {
  const p = E.inOutSine(prog(lt, 0, d)); const lightning = (vt > 103.25 && vt < 103.4) || (vt > 104.15 && vt < 104.22) ? 1 : 0;
  rooftop(c, vt, { moon: 0, light: .12 + lightning * .28, cam: { z: 1.0 - p * .05, x: 0, y: 0 }, noPerson: true, crowd: (cc) => { for (let g = 0; g < 5; g++) person(cc, { x: 500 + g * 230, y: H - 172, s: 1.1, color: [P.red, P.yellow, P.teal, P.purple, P.green][g], look: [0, -.7], mouth: 'flat', rim: '#3a3352' }); } });
  if (lightning) { c.save(); c.strokeStyle = 'rgba(230,235,255,0.95)'; c.lineWidth = 5; c.beginPath(); let x = 1500, y = 0; c.moveTo(x, y); const r = rng(Math.floor(vt * 10)); while (y < 520) { x += (r() - .5) * 90; y += 40 + r() * 40; c.lineTo(x, y); } c.stroke(); c.restore(); }
  const words = [[101.9, 'DARKER'], [103.25, 'STRANGER'], [104.15, 'LESS PREDICTABLE']];
  words.forEach(([t0, w], i) => text(c, w, W / 2, 200 + i * 110, 70, { spacing: 10, alpha: prog(vt, t0, t0 + .2), color: i === 2 ? '#ffb347' : P.white }));
}, { flashAt: 103.25 });
// 35 — Total solar eclipse, never again
shot(105.9, (c, lt, d, vt) => {
  const fade = E.inOut(prog(vt, 107.0, 108.6));
  vgrad(c, 0, H, [[0, mixColor('#05060d', '#7fb6e6', fade)], [1, mixColor('#1a1426', '#e8c49a', fade)]]);
  drawStars(c, 4, vt, 1 - fade, 300, 700);
  const x = W / 2, y = 400;
  if (fade < 1) { c.save(); c.globalAlpha = 1 - fade; c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; c.strokeStyle = 'rgba(255,245,230,0.12)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + Math.cos(a) * 150, y + Math.sin(a) * 150); c.lineTo(x + Math.cos(a) * (230 + (i % 5) * 50), y + Math.sin(a) * (230 + (i % 5) * 50)); c.stroke(); } glow(c, x, y, 360, 'rgba(255,245,230,0.8)'); c.restore(); }
  drawSun(c, x, y, 140, fade, vt);
  if (fade < 1) { c.fillStyle = `rgba(0,0,0,${1 - fade})`; circle(c, x, y, 145); c.fill(); }
  c.fillStyle = mixColor('#07060a', '#4a3a40', fade); c.fillRect(0, 900, W, 200);
  for (let g = 0; g < 7; g++) { person(c, { x: 300 + g * 220, y: 905, s: 1.15, color: [P.red, P.yellow, P.teal, P.purple, P.green, P.blue, P.pink][g], look: [0, -.9], mouth: fade > .5 ? 'flat' : 'o', glasses: true, rim: fade > .5 ? '#f6c88f' : '#fff2d8' }); }
  pill(c, 'NO MORE TOTAL SOLAR ECLIPSES', W / 2, 150, 34, prog(vt, 107.4, 107.7), { border: '#f6c88f' });
});
// 36 — Finale: Moon returns, take a second
shot(109.35, (c, lt, d, vt) => {
  const back = E.inOut(prog(vt, 109.4, 110.6)); const p = E.inOutSine(prog(vt, 109.35, VO_LEN + 2.4));
  rooftop(c, vt, { moon: back, light: lerp(.3, 1, back), cam: { z: 1.18 - p * .18, x: 30 * p, y: 0 }, pose: { look: [.4, -.85], mouth: vt > 111 ? 'smile' : 'o', blink: vt > 110.9 && vt < 111.8 ? .08 : blinkAt(vt, 5) } });
  text(c, "IT'S DOING A LOT MORE", W / 2 - 300, 300, 50, { spacing: 6, alpha: prog(vt, 112.4, 112.7) * (1 - prog(vt, VO_LEN + .9, VO_LEN + 1.4)), align: 'center' });
  text(c, 'THAN YOU THINK.', W / 2 - 300, 370, 50, { spacing: 6, alpha: prog(vt, 113.4, 113.7) * (1 - prog(vt, VO_LEN + .9, VO_LEN + 1.4)), color: '#f6c88f' });
}, { fadeOutAt: VO_LEN + 1.6 });

// ---------- Frame dispatcher ----------
function findShot(vt) { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].s <= vt) i++; return i; }
function renderFrame(ctx, t) {
  const vt = t - OFF; const i = findShot(vt), S = SHOTS[i], end = i + 1 < SHOTS.length ? SHOTS[i + 1].s : TOTAL - OFF;
  const lt = vt - S.s, d = end - S.s;
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // global camera micro-drift (handheld feel) + punch-in on cut
  const pin = 1 + .035 * Math.exp(-lt * 9) * (S.post.punchAt && vt > S.post.punchAt ? 0 : 1);
  const dr = [noise1(t * .35, 1) * 4, noise1(t * .35, 2) * 3];
  ctx.translate(W / 2 + dr[0], H / 2 + dr[1]); ctx.scale(pin, pin); ctx.translate(-W / 2, -H / 2);
  S.f(ctx, lt, d, vt);
  ctx.restore();
  // post
  let fade = 0, flash = 0;
  if (S.post.fadeIn) fade = Math.max(fade, 1 - prog(lt, 0, S.post.fadeIn));
  if (S.post.fadeOutAt) fade = Math.max(fade, prog(vt, S.post.fadeOutAt, S.post.fadeOutAt + 1.0));
  if (S.post.flash) flash = S.post.flash * Math.exp(-lt * 7);
  if (S.post.flashAt && vt > S.post.flashAt) flash = Math.max(flash, .32 * Math.exp(-(vt - S.post.flashAt) * 6));
  if (S.post.punchAt && vt > S.post.punchAt) flash = Math.max(flash, .2 * Math.exp(-(vt - S.post.punchAt) * 8));
  if (S.post.heat) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,140,40,0.35)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (S.post.cold) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(80,160,255,0.35)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // letterbox bars (reference look)
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18);
  postFX(ctx, t, { fade, flash });
}
