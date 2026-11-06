// ---------- Reusable environments ----------
'use strict';

// Night sky gradient. light: 1 = moonlit dusk purple, 0 = moonless pitch black
function nightSky(ctx, light, t, o = {}) {
  const top = mixColor('#05050c', '#2a2350', light), mid = mixColor('#07070f', '#5a4580', light), low = mixColor('#0a0910', '#a3708a', light * (o.warm ?? 1));
  vgrad(ctx, 0, H, [[0, top], [.62, mid], [1, low]]);
  drawStars(ctx, o.seed ?? 1, t, .35 + (1 - light) * .65, 420, H);
}
function mixColor(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = (s) => Math.round(lerp(pa >> s & 255, pb >> s & 255, clamp(t))); return `rgb(${c(16)},${c(8)},${c(0)})`; }

// Rooftop at night: distant skyline, near buildings, ledge, character. Used for intro/outro.
// o: {moon:0..1 alpha, moonX, moonY, moonR, light (sky brightness), cam:{z,x,y}, pose (person overrides), noPerson, crowd}
function rooftop(ctx, t, o = {}) {
  const light = o.light ?? 1; const cam = o.cam || { z: 1, x: 0, y: 0 };
  ctx.save(); camera(ctx, cam.z, cam.x * .15, cam.y * .15);
  nightSky(ctx, light, t, { seed: 3 });
  if (o.moon > 0) drawMoon(ctx, o.moonX ?? 1320, o.moonY ?? 300, o.moonR ?? 110, { alpha: o.moon, rays: o.rays ?? .9, t });
  if (o.cloud) drawCloud(ctx, o.cloud[0], o.cloud[1], o.cloud[2], mixColor('#14101e', '#3c3058', light), .96);
  ctx.restore();
  // far skyline (parallax)
  ctx.save(); camera(ctx, cam.z, cam.x * .35, cam.y * .35);
  const f = skyline(5, mixColor('#0d0b14', '#3b2d4f', light), 120, 330, .5 * (.4 + .6 * light));
  ctx.drawImage(f, -200, H - 230 - f.height + 120);
  glow(ctx, W / 2, H - 200, 900, `rgba(255,150,110,${.12 * light})`);
  ctx.restore();
  // near buildings
  ctx.save(); camera(ctx, cam.z, cam.x * .6, cam.y * .6);
  const n = skyline(9, mixColor('#08070c', '#1e1729', light), 220, 470, .85 * (.5 + .5 * light));
  ctx.drawImage(n, -300, H - 120 - n.height + 140);
  ctx.restore();
  // rooftop ledge + character
  ctx.save(); camera(ctx, cam.z, cam.x, cam.y);
  ctx.fillStyle = mixColor('#0a080e', '#241b2c', light); ctx.fillRect(-200, H - 170, W + 400, 400);
  ctx.fillStyle = mixColor('#120e17', '#3a2c40', light); ctx.fillRect(-200, H - 178, W + 400, 14);
  ctx.strokeStyle = `rgba(246,200,143,${.35 * light})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-200, H - 178); ctx.lineTo(W + 200, H - 178); ctx.stroke();
  // antenna + water tank silhouettes
  ctx.fillStyle = mixColor('#060509', '#150f1c', light); ctx.fillRect(220, H - 470, 120, 200); ctx.fillRect(235, H - 270, 12, 100); ctx.fillRect(313, H - 270, 12, 100);
  ctx.beginPath(); ctx.moveTo(210, H - 470); ctx.lineTo(280, H - 520); ctx.lineTo(350, H - 470); ctx.fill();
  ctx.fillRect(1700, H - 520, 6, 350); ctx.fillRect(1660, H - 470, 86, 4); ctx.fillRect(1675, H - 420, 56, 4);
  glow(ctx, 1703, H - 520, 18, 'rgba(255,60,60,0.9)', .5 + .5 * Math.sin(t * 3));
  if (o.crowd) o.crowd(ctx);
  if (!o.noPerson) person(ctx, Object.assign({ x: 820, y: H - 172, s: 1.55, color: P.red, look: [.35, -.8], blink: blinkAt(t), mouth: 'smile', rimSide: 1 }, o.pose || {}));
  ctx.restore();
  // floating dust motes (foreground depth, like the reference bokeh)
  { const r = rng(808); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const sp = .3 + r(); const x = ((r() * W + t * 14 * sp) % (W + 200)) - 100, y = r() * H + Math.sin(t * .6 + i) * 20, rad = 3 + r() * 14; glow(ctx, x, y, rad * 2.5, `rgba(255,220,180,${.10 * light * (.4 + r())})`); } ctx.restore(); }
  // moonlight wash
  if (o.moon > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .35 * o.moon; glow(ctx, o.moonX ?? 1320, o.moonY ?? 300, 1400, 'rgba(200,190,255,1)'); ctx.restore(); }
}

// Ocean horizon (beach). light 0..1, wave phase from t
function ocean(ctx, t, o = {}) {
  const light = o.light ?? .7, cam = o.cam || { z: 1, x: 0, y: 0 };
  ctx.save(); camera(ctx, cam.z, cam.x * .2, cam.y * .2);
  nightSky(ctx, light, t, { seed: 8, warm: .8 });
  if (o.moon > 0) drawMoon(ctx, 1450, 260, 80, { alpha: o.moon, rays: .5, t });
  ctx.restore();
  ctx.save(); camera(ctx, cam.z, cam.x * .5, cam.y * .5);
  const hy = o.horizon ?? 600;
  vgrad(ctx, hy, H + 200, [[0, mixColor('#05070d', '#3d3a63', light)], [1, mixColor('#020306', '#141429', light)]], -300, W + 600);
  // moon glitter path
  if (o.moon > 0) { const r = rng(4); ctx.fillStyle = `rgba(255,240,210,${.55 * o.moon})`; for (let i = 0; i < 160; i++) { const y = hy + Math.pow(r(), 1.6) * (H - hy), sp = (y - hy) / (H - hy); const x = 1450 + (r() - .5) * (40 + sp * 500) + Math.sin(t * 2 + i) * 6; ctx.fillRect(x, y, 10 + sp * 40 * r(), 2 + sp * 3); } }
  // wave lines
  for (let k = 0; k < 9; k++) { const y = hy + 20 + k * k * 9; ctx.strokeStyle = `rgba(200,200,255,${.05 + .02 * k})`; ctx.lineWidth = 1 + k * .4; ctx.beginPath(); for (let x = -300; x <= W + 300; x += 30) { const yy = y + Math.sin(x * .01 + t * (1 + k * .1) + k) * (2 + k); x === -300 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
  ctx.restore();
  if (o.beach !== false) {
    ctx.save(); camera(ctx, cam.z, cam.x, cam.y);
    const sw = Math.sin(t * .9) * .5 + .5, wy = 900 - sw * 40 * (o.tide ?? 1);
    ctx.fillStyle = mixColor('#0b0a0c', '#4a3a3a', light * .8); ctx.beginPath(); ctx.moveTo(-300, 860); ctx.quadraticCurveTo(W / 2, 820, W + 300, 870); ctx.lineTo(W + 300, H + 300); ctx.lineTo(-300, H + 300); ctx.fill();
    ctx.fillStyle = `rgba(220,225,255,${.35 * (.5 + light * .5)})`; ctx.beginPath(); ctx.moveTo(-300, wy); for (let x = -300; x <= W + 300; x += 40) ctx.lineTo(x, wy + Math.sin(x * .008 + t * 1.3) * 10); ctx.lineTo(W + 300, wy - 60); ctx.lineTo(-300, wy - 60); ctx.fill();
    ctx.restore();
  }
}

// Space backdrop
function space(ctx, t, o = {}) {
  vgrad(ctx, 0, H, [[0, '#04040c'], [.5, '#0a0b1e'], [1, '#05050d']]);
  drawStars(ctx, o.seed ?? 21, t, 1, 700, H);
  glow(ctx, W * .2, H * .25, 700, 'rgba(110,60,160,0.16)'); glow(ctx, W * .85, H * .8, 800, 'rgba(40,80,170,0.16)');
}

// Underwater
function underwater(ctx, t, light) {
  vgrad(ctx, 0, H, [[0, mixColor('#02060c', '#1b4f78', light)], [.6, mixColor('#01040a', '#0d2c4d', light)], [1, mixColor('#010205', '#061527', light)]]);
  if (light > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const x = 300 + i * 230 + Math.sin(t * .4 + i) * 40; ctx.globalAlpha = .07 * light * (.6 + .4 * Math.sin(t * .8 + i * 2)); const g = ctx.createLinearGradient(x, 0, x + 200, H); g.addColorStop(0, 'rgba(200,230,255,1)'); g.addColorStop(1, 'rgba(200,230,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 330, H); ctx.lineTo(x + 120, H); ctx.fill(); } ctx.restore(); }
}
function coral(ctx, x, y, s, col, seed, dim) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const r = rng(seed);
  ctx.strokeStyle = mixColor('#151018', col, dim); ctx.lineCap = 'round';
  const branch = (len, ang, w, d) => { if (d > 4) return; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke(); ctx.save(); ctx.translate(0, -len); for (const a of [-.45 - r() * .2, .4 + r() * .2]) { ctx.save(); ctx.rotate(a); branch(len * .72, a, w * .7, d + 1); ctx.restore(); } ctx.restore(); };
  branch(70, 0, 20, 0); ctx.restore();
}
function brainCoral(ctx, x, y, r, col, dim) { ctx.fillStyle = mixColor('#120e15', col, dim); ctx.beginPath(); ctx.ellipse(x, y, r, r * .7, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y, r * i / 4, r * .7 * i / 4, 0, Math.PI, 0); ctx.stroke(); } }

// Sun
function drawSun(ctx, x, y, r, a = 1, t = 0) { ctx.save(); ctx.globalAlpha *= a; glow(ctx, x, y, r * 4, 'rgba(255,170,70,0.35)'); glow(ctx, x, y, r * 2, 'rgba(255,210,120,0.6)'); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#fff6d8'); g.addColorStop(.7, '#ffcf5a'); g.addColorStop(1, '#ff9a30'); ctx.fillStyle = g; circle(ctx, x, y, r * (1 + .01 * Math.sin(t * 5))); ctx.fill(); ctx.restore(); }

// Critters
function crab(ctx, x, y, s, col, t, dead = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (dead) { ctx.rotate(Math.PI * dead); }
  const c = mixColor(col, '#6e6268', dead); ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const wig = Math.sin(t * 10 + i) * 4 * (1 - dead); ctx.beginPath(); ctx.moveTo(sx * 20, 0); ctx.lineTo(sx * (42 + i * 6), 10 + i * 8 + wig); ctx.lineTo(sx * (50 + i * 6), 28 + i * 6); ctx.stroke(); }
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 40, 26, 0, 0, TAU); ctx.fill();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 28, -12); ctx.lineTo(sx * 46, -38); ctx.stroke(); circle(ctx, sx * 52, -46, 14); ctx.fill(); }
  ctx.fillStyle = '#fff'; for (const sx of [-1, 1]) { circle(ctx, sx * 10, -30, 7); ctx.fill(); } ctx.fillStyle = P.ink; for (const sx of [-1, 1]) { if (dead > .5) { ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx * 10 - 4, -34); ctx.lineTo(sx * 10 + 4, -26); ctx.moveTo(sx * 10 + 4, -34); ctx.lineTo(sx * 10 - 4, -26); ctx.stroke(); } else { circle(ctx, sx * 10, -29, 3.5); ctx.fill(); } }
  ctx.restore();
}
function snail(ctx, x, y, s, t, dead = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = mixColor('#c9a77a', '#6e6268', dead); ctx.beginPath(); ctx.moveTo(-50, 0); ctx.quadraticCurveTo(0, -8, 55, 0); ctx.lineTo(60, -18); ctx.quadraticCurveTo(70, -30, 64, -40); ctx.lineTo(56, -20); ctx.lineTo(-50, 0); ctx.fill();
  if (!dead) { ctx.strokeStyle = '#c9a77a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(60, -20); ctx.lineTo(68 + Math.sin(t * 3) * 3, -48); ctx.stroke(); }
  ctx.fillStyle = mixColor('#8a5a3c', '#544a50', dead); circle(ctx, 0, -30, 34); ctx.fill(); ctx.strokeStyle = mixColor('#e2b47e', '#7a7076', dead); ctx.lineWidth = 5; ctx.beginPath(); for (let a = 0; a < 12; a += .2) { const rr = 30 - a * 2.4; ctx.lineTo(Math.cos(a) * rr, -30 + Math.sin(a) * rr); } ctx.stroke();
  ctx.restore();
}
function seaStar(ctx, x, y, s, t, dead = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * .7) * .05 * (1 - dead));
  ctx.fillStyle = mixColor('#ef7d32', '#6e6268', dead); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 22 : 56; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; for (let k = 1; k < 4; k++) { circle(ctx, Math.cos(a) * k * 12, Math.sin(a) * k * 12, 3); ctx.fill(); } }
  ctx.restore();
}
function gull(ctx, x, y, s, flap, col = '#e9e4dc') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
  const w = Math.sin(flap) * 30; ctx.beginPath(); ctx.moveTo(-70, -w); ctx.quadraticCurveTo(-30, -20 - w * .3, 0, 0); ctx.quadraticCurveTo(30, -20 - w * .3, 70, -w); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 4, 22, 12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2b632'; ctx.beginPath(); ctx.moveTo(20, 2); ctx.lineTo(36, 6); ctx.lineTo(20, 9); ctx.fill(); ctx.restore();
}

// Stopwatch UI
function stopwatch(ctx, x, y, r, frac, label, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = P.white; ctx.lineWidth = 6; circle(ctx, x, y, r); ctx.stroke(); ctx.fillStyle = 'rgba(10,12,30,0.6)'; circle(ctx, x, y, r - 3); ctx.fill();
  ctx.fillStyle = P.white; ctx.fillRect(x - 10, y - r - 22, 20, 16); ctx.fillRect(x - 4, y - r - 8, 8, 8);
  for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; ctx.fillRect(x + Math.sin(an) * (r - 14) - 2, y - Math.cos(an) * (r - 14) - 2, 4, 4); }
  ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, r - 26, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke();
  ctx.strokeStyle = P.white; ctx.lineWidth = 5; ctx.lineCap = 'round'; const an = frac * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(an) * (r - 30), y - Math.cos(an) * (r - 30)); ctx.stroke();
  ctx.restore(); if (label) text(ctx, label, x, y + r + 50, 46, { alpha: a, spacing: 2 });
}
function thermometer(ctx, x, y, h, v, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(255,255,255,0.9)'; rrect(ctx, x - 26, y - h, 52, h, 26); ctx.fill(); circle(ctx, x, y + 10, 46); ctx.fill();
  const col = mixColor('#4fb3ff', '#ff4b2b', v); ctx.fillStyle = col; circle(ctx, x, y + 10, 34); ctx.fill(); rrect(ctx, x - 14, y - (h - 30) * v - 10, 28, (h - 30) * v + 30, 14); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 1; i < 8; i++) ctx.fillRect(x + 12, y - i * (h - 30) / 8 - 10, 12, 3);
  ctx.restore();
}
