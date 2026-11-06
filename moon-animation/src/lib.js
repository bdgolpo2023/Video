// ---------- Core helpers: math, easing, noise, drawing primitives ----------
'use strict';
const W = 1920, H = 1080, FPS = 60;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const E = {
  inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; const h = n => { const s = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453; return s - Math.floor(s); }; return lerp(h(i), h(i + 1), smooth(f)) * 2 - 1; }
function mkCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const cache = new Map();
function cached(key, w, h, fn) { if (!cache.has(key)) { const c = mkCanvas(w, h); fn(c.getContext('2d'), c); cache.set(key, c); } return cache.get(key); }

// ---------- Palette (matches the reference look: dusk purples, warm oranges, black silhouettes) ----------
const P = {
  ink: '#0c0a10', rim: '#f6c88f', rimCool: '#c9d4ff', white: '#f4efe8',
  red: '#e2452f', redDark: '#a92c1f', yellow: '#f2b632', teal: '#2aa39a', purple: '#7b57c9', green: '#3fa45b', blue: '#3f74c9', pink: '#e66b9a', orange: '#ef7d32',
  moon: '#fbf3dc', moonShade: '#e6d6b2',
};

// ---------- Fill helpers ----------
function vgrad(ctx, y0, y1, stops, x = 0, w = W) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); ctx.fillStyle = g; ctx.fillRect(x, y0, w, y1 - y0); }
function glow(ctx, x, y, r, color, a = 1) { if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalAlpha *= a; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }

// ---------- Sky pieces ----------
function starfield(seed, n = 420, h = H) {
  return cached('stars' + seed + n + h, W, h, (c) => {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = Math.pow(r(), 1.3) * h, s = r() < .08 ? 2.2 : .6 + r() * 1.2;
      c.globalAlpha = .25 + r() * .75; c.fillStyle = r() < .2 ? '#ffe6c4' : '#e8ecff'; circle(c, x, y, s); c.fill();
      if (s > 2) { c.globalAlpha = .25; glow(c, x, y, 9, '#ffffff'); }
    }
  });
}
function drawStars(ctx, seed, t, a = 1, n, h) { ctx.save(); ctx.globalAlpha = a * (.88 + .12 * Math.sin(t * 3.1 + seed)); ctx.drawImage(starfield(seed, n, h), 0, 0); ctx.restore(); }

// Moon with craters, limb shading, halo and slow god-rays like the reference shots
function drawMoon(ctx, x, y, r, opt = {}) {
  const a = opt.alpha ?? 1, t = opt.t ?? 0; if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (opt.halo !== false) { glow(ctx, x, y, r * 5.5, 'rgba(255,236,200,0.22)'); glow(ctx, x, y, r * 2.4, 'rgba(255,240,215,0.45)'); }
  if (opt.rays) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.03); ctx.globalCompositeOperation = 'lighter';
    const rr = rng(7);
    for (let i = 0; i < 28; i++) {
      const ang = i / 28 * TAU + rr() * .1, len = r * (4 + rr() * 6), wdt = .018 + rr() * .03;
      ctx.globalAlpha = a * opt.rays * (.04 + rr() * .07) * (.75 + .25 * Math.sin(t * .7 + i));
      const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len); g.addColorStop(0, 'rgba(255,238,210,1)'); g.addColorStop(1, 'rgba(255,238,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, len, ang - wdt, ang + wdt); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  const g = ctx.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
  g.addColorStop(0, '#fffaf0'); g.addColorStop(.75, P.moon); g.addColorStop(1, P.moonShade);
  ctx.fillStyle = g; circle(ctx, x, y, r); ctx.fill();
  ctx.save(); circle(ctx, x, y, r); ctx.clip();
  const cr = rng(42); ctx.fillStyle = 'rgba(190,170,135,0.16)';
  for (let i = 0; i < 14; i++) { const cx = x + (cr() - .5) * r * 1.6, cy = y + (cr() - .5) * r * 1.6, rr2 = r * (.05 + cr() * .2); circle(ctx, cx, cy, rr2); ctx.fill(); }
  ctx.fillStyle = 'rgba(170,150,120,0.18)'; ctx.beginPath(); ctx.ellipse(x + r * .15, y - r * .1, r * .45, r * .3, .5, 0, TAU); ctx.fill();
  ctx.restore(); ctx.restore();
}
function drawCloud(ctx, x, y, s, color = '#3a2f55', a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.beginPath();
  [[0, 0, 60], [55, -25, 55], [115, -5, 62], [170, 10, 45], [-55, 12, 42], [60, 20, 60]].forEach(([dx, dy, r]) => { ctx.moveTo(x + (dx + r) * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); });
  ctx.fill(); ctx.restore();
}

// City skyline silhouette (cached). Lit windows give the warm reference glow.
function skyline(seed, color, minH, maxH, winA = .8, w = W * 1.3) {
  return cached(`sky${seed}${color}${minH}${maxH}${winA}`, Math.ceil(w), maxH + 40, (c, cv) => {
    const r = rng(seed); let x = 0; const base = cv.height;
    while (x < w) {
      const bw = 50 + r() * 130, bh = minH + r() * (maxH - minH); c.fillStyle = color; c.fillRect(x, base - bh, bw, bh);
      if (r() < .3) { c.fillRect(x + bw * .4, base - bh - 30 - r() * 40, 6, 70); }
      if (r() < .25) { c.beginPath(); c.moveTo(x, base - bh); c.lineTo(x + bw / 2, base - bh - 26); c.lineTo(x + bw, base - bh); c.fill(); }
      if (winA > 0) for (let wy = base - bh + 16; wy < base - 12; wy += 22) for (let wx = x + 10; wx < x + bw - 12; wx += 18) if (r() < .22) { c.fillStyle = r() < .7 ? `rgba(255,190,110,${winA})` : `rgba(255,225,170,${winA})`; c.fillRect(wx, wy, 8, 11); c.fillStyle = color; }
      x += bw + r() * 8;
    }
  });
}

// ---------- Character rig (stick figure, black head, colored hoodie, warm rim light) ----------
// p: {x,y,s,color, coat, glasses, hardhat, armL:[a1,a2], armR, legL, legR, lean, tilt, look:[x,y], blink, mouth, brows, rim, rimSide, phone, sweat, flip}
function limb(ctx, x, y, a1, l1, a2, l2) {
  const ex = x + Math.sin(a1) * l1, ey = y + Math.cos(a1) * l1;
  const hx = ex + Math.sin(a1 + a2) * l2, hy = ey + Math.cos(a1 + a2) * l2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke(); return [hx, hy];
}
function person(ctx, p) {
  const s = p.s ?? 1; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s * (p.flip ? -1 : 1), s);
  const rim = p.rim ?? P.rim, rs = p.rimSide ?? -1; // rim light offset direction (x)
  const passes = p.noRim ? [false] : [true, false];
  let hand = null;
  for (const isRim of passes) {
    ctx.save(); if (isRim) ctx.translate(rs * 3.2, -2.6);
    const ink = isRim ? rim : P.ink; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // legs
    ctx.lineWidth = 11;
    const legL = p.legL || [.06, 0], legR = p.legR || [-.06, 0];
    limb(ctx, -9, -112, -legL[0], 56, -legL[1], 56); limb(ctx, 9, -112, -legR[0], 56, -legR[1], 56);
    ctx.save(); ctx.translate(0, -112); ctx.rotate(p.lean || 0); ctx.translate(0, 112);
    // arms behind body
    ctx.lineWidth = 10;
    const armL = p.armL || [.25, -.15], armR = p.armR || [-.25, .15];
    limb(ctx, -24, -196, -armL[0], 50, -armL[1], 48);
    const hr = limb(ctx, 24, -196, -armR[0], 50, -armR[1], 48);
    if (!isRim) hand = hr;
    // torso / hoodie
    ctx.fillStyle = isRim ? rim : (p.color || P.red);
    ctx.beginPath(); ctx.moveTo(-26, -206); ctx.quadraticCurveTo(0, -214, 26, -206); ctx.lineTo(p.coat ? 34 : 29, p.coat ? -84 : -108); ctx.quadraticCurveTo(0, p.coat ? -78 : -102, p.coat ? -34 : -29, p.coat ? -84 : -108); ctx.closePath(); ctx.fill();
    if (!isRim) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(4, -210); ctx.lineTo(p.coat ? 34 : 29, p.coat ? -84 : -108); ctx.lineTo(4, p.coat ? -80 : -104); ctx.fill();
      if (p.coat) { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, -82); ctx.stroke(); }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -200); ctx.lineTo(-7, -176); ctx.moveTo(6, -200); ctx.lineTo(7, -176); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; rrect(ctx, -15, -152, 30, 16, 5); ctx.fill(); }
    }
    // head
    ctx.save(); ctx.translate(0, -244); ctx.rotate(p.tilt || 0);
    ctx.fillStyle = ink; circle(ctx, 0, 0, 36); ctx.fill();
    if (p.hardhat) { ctx.fillStyle = isRim ? rim : P.yellow; ctx.beginPath(); ctx.arc(0, -6, 37, Math.PI, 0); ctx.fill(); ctx.fillRect(-44, -8, 88, 7); }
    if (!isRim) face(ctx, p);
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }
  if (p.phone && hand) { ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(.15); glow(ctx, 0, -16, 60, 'rgba(160,210,255,0.35)'); ctx.fillStyle = '#111'; rrect(ctx, -11, -36, 22, 38, 4); ctx.fill(); ctx.fillStyle = '#bfe3ff'; rrect(ctx, -8, -33, 16, 30, 2); ctx.fill(); ctx.restore(); }
  if (p.flashlight && hand) { ctx.save(); ctx.translate(hand[0], hand[1]); ctx.fillStyle = '#333'; ctx.fillRect(-4, -6, 26, 10); ctx.restore(); }
  ctx.restore();
  return hand;
}
function face(ctx, p) {
  const lk = p.look || [0, 0], bl = clamp(p.blink ?? 1, .06, 1);
  const ex = 11 + lk[0] * 7, ey = -4 + lk[1] * 7;
  ctx.fillStyle = '#fff';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * ex + lk[0] * 3, ey, 6.5, 9.5 * bl, 0, 0, TAU); ctx.fill(); }
  if (bl > .3) { ctx.fillStyle = P.ink; for (const sx of [-1, 1]) { circle(ctx, sx * ex + lk[0] * 5.5, ey + lk[1] * 4, 3.2); ctx.fill(); } }
  if (p.glasses) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; for (const sx of [-1, 1]) { circle(ctx, sx * ex + lk[0] * 3, ey, 11); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-ex + 11 + lk[0] * 3, ey); ctx.lineTo(ex - 11 + lk[0] * 3, ey); ctx.stroke(); }
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (p.brows === 'worried') { ctx.beginPath(); ctx.moveTo(-ex - 7, ey - 13); ctx.lineTo(-ex + 6, ey - 17); ctx.moveTo(ex + 7, ey - 13); ctx.lineTo(ex - 6, ey - 17); ctx.stroke(); }
  if (p.brows === 'angry') { ctx.beginPath(); ctx.moveTo(-ex - 7, ey - 17); ctx.lineTo(-ex + 6, ey - 12); ctx.moveTo(ex + 7, ey - 17); ctx.lineTo(ex - 6, ey - 12); ctx.stroke(); }
  const mx = lk[0] * 6, my = 15 + lk[1] * 4;
  ctx.beginPath();
  switch (p.mouth) {
    case 'smile': ctx.arc(mx, my - 5, 8, .25 * Math.PI, .75 * Math.PI); ctx.stroke(); break;
    case 'grin': ctx.fillStyle = '#fff'; ctx.arc(mx, my - 3, 9, 0, Math.PI); ctx.fill(); break;
    case 'o': ctx.fillStyle = '#fff'; ctx.ellipse(mx, my, 4.5, 6, 0, 0, TAU); ctx.fill(); break;
    case 'frown': ctx.arc(mx, my + 6, 7, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); break;
    case 'flat': ctx.moveTo(mx - 6, my); ctx.lineTo(mx + 6, my); ctx.stroke(); break;
    default: break;
  }
  if (p.sweat) { ctx.fillStyle = '#9fd6ff'; ctx.beginPath(); ctx.moveTo(30, -22); ctx.quadraticCurveTo(37, -8, 30, -5); ctx.quadraticCurveTo(23, -8, 30, -22); ctx.fill(); }
}
// Walk cycle helper -> pose overrides
function walkPose(ph, amt = 1) { const a = Math.sin(ph) * .45 * amt; return { legL: [a, Math.max(0, -Math.cos(ph)) * .5 * amt], legR: [-a, Math.max(0, Math.cos(ph)) * .5 * amt], armL: [-a * .8 + .1, -.3], armR: [a * .8 - .1, .3] }; }
const blinkAt = (t, seed = 0) => { const k = (t + seed * 1.7) % 3.3; return k < .12 ? Math.abs(k - .06) / .06 : 1; };

// ---------- Text ----------
function text(ctx, str, x, y, size, o = {}) {
  ctx.save(); ctx.font = `${o.weight || 'bold'} ${size}px "Noto Sans", sans-serif`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.spacing) ctx.letterSpacing = o.spacing + 'px';
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * .35; ctx.shadowOffsetY = size * .06; }
  if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || P.ink; ctx.strokeText(str, x, y); }
  ctx.fillStyle = o.color || P.white; ctx.fillText(str, x, y); ctx.restore();
}
function pill(ctx, str, x, y, size = 30, a = 1, o = {}) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = `bold ${size}px "Noto Sans", sans-serif`;
  const w = ctx.measureText(str).width + size * 1.4, h = size * 1.7;
  const sc = .85 + .15 * E.outBack(clamp(a)); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = o.fill || 'rgba(14,18,40,0.72)'; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = o.border || 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore(); text(ctx, str, x, y + 1, size, { alpha: a, shadow: false, color: o.color });
}
function calendarTag(ctx, str, x, y, a = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = 'bold 34px "Noto Sans", sans-serif'; const w = ctx.measureText(str).width + 50;
  ctx.fillStyle = '#f7f1e6'; rrect(ctx, x - w / 2, y - 30, w, 66, 8); ctx.fill(); ctx.fillStyle = '#e2452f'; ctx.fillRect(x - w / 2, y - 30, w, 12);
  ctx.fillStyle = '#c33'; for (const dx of [-w / 3, w / 3]) { ctx.fillRect(x + dx - 3, y - 40, 6, 20); }
  ctx.restore(); text(ctx, str, x, y + 8, 34, { alpha: a, color: '#2b2230', shadow: false });
}

// ---------- Infographic background (dark navy grid like the reference explainer scenes) ----------
function gridBg(ctx, t, tint = '#0d1b3d') {
  const c = cached('grid' + tint, W, H, (g) => {
    vgrad(g, 0, H, [[0, '#0a1430'], [.55, tint], [1, '#081028']]);
    g.strokeStyle = 'rgba(120,160,255,0.07)'; g.lineWidth = 1; for (let x = 0; x <= W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    glow(g, W / 2, H / 2, 900, 'rgba(60,90,200,0.18)');
  });
  ctx.drawImage(c, 0, 0);
}

// ---------- Earth ----------
function earthMap() {
  return cached('earthmap', 1024, 512, (c) => {
    c.fillStyle = '#1f5fa8'; c.fillRect(0, 0, 1024, 512);
    const r = rng(11);
    const blob = (cx, cy, rx, ry, col) => { c.fillStyle = col; c.beginPath(); const n = 18; for (let i = 0; i <= n; i++) { const a = i / n * TAU, k = .7 + r() * .45; const px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.fill(); };
    const conts = [[180, 170, 110, 90], [250, 330, 60, 100], [520, 160, 140, 80], [560, 300, 80, 110], [760, 190, 150, 90], [860, 360, 60, 40], [420, 90, 60, 30]];
    for (const [x, y, rx, ry] of conts) for (const dx of [0, 1024, -1024]) { blob(x + dx, y, rx, ry, '#3f9a5a'); blob(x + dx + 15, y + 10, rx * .6, ry * .5, '#5aa95c'); blob(x + dx - 10, y - 15, rx * .3, ry * .3, '#c9b178'); }
    c.fillStyle = '#eef6ff'; c.fillRect(0, 0, 1024, 34); c.fillRect(0, 478, 1024, 34);
  });
}
function drawEarth(ctx, x, y, r, o = {}) {
  const rot = o.rot ?? 0, tilt = o.tilt ?? 0, ice = o.ice ?? 0, heat = o.heat ?? 0;
  ctx.save(); ctx.translate(x, y);
  glow(ctx, 0, 0, r * 1.5, 'rgba(90,160,255,0.35)', o.glowA ?? 1);
  ctx.rotate(tilt);
  ctx.save(); circle(ctx, 0, 0, r); ctx.clip();
  const m = earthMap(); const sc = (r * 2) / 512; const off = ((rot % 1) + 1) % 1 * 1024 * sc;
  for (let k = -1; k <= 1; k++) ctx.drawImage(m, -r * 2 - off + k * 1024 * sc + r, -r, 1024 * sc, r * 2);
  if (ice > 0) { ctx.fillStyle = `rgba(235,245,255,${.9 * ice})`; ctx.fillRect(-r, -r, r * 2, r * (.25 + .55 * ice)); ctx.fillRect(-r, r - r * (.25 + .55 * ice), r * 2, r * (.25 + .55 * ice)); }
  if (heat > 0) { ctx.fillStyle = `rgba(220,120,40,${.55 * heat})`; ctx.fillRect(-r, -r * .35, r * 2, r * .7); }
  const sh = ctx.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r * 1.05); sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,20,0.55)'); ctx.fillStyle = sh; ctx.fillRect(-r, -r, r * 2, r * 2);
  if (o.night) { const ng = ctx.createLinearGradient(-r, 0, r, 0); ng.addColorStop(0, 'rgba(5,8,25,0)'); ng.addColorStop(.55, 'rgba(5,8,25,0.0)'); ng.addColorStop(.75, `rgba(5,8,25,${.85 * o.night})`); ng.addColorStop(1, `rgba(5,8,25,${.9 * o.night})`); ctx.fillStyle = ng; ctx.fillRect(-r, -r, r * 2, r * 2); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(160,210,255,0.6)'; ctx.lineWidth = 3; circle(ctx, 0, 0, r); ctx.stroke();
  if (o.axis) { ctx.strokeStyle = `rgba(255,255,255,${o.axis})`; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(0, -r * 1.45); ctx.lineTo(0, r * 1.45); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}

// ---------- Camera + post ----------
function camera(ctx, zoom = 1, cx = 0, cy = 0, rot = 0) { ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-W / 2 + cx, -H / 2 + cy); }
function shake(t, amt, seed = 3) { return [noise1(t * 9, seed) * amt, noise1(t * 9, seed + 5) * amt]; }
let grainTiles = null;
function postFX(ctx, t, o = {}) {
  ctx.save();
  // vignette
  const v = cached('vig', W, H, (g) => { const gr = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  ctx.globalAlpha = o.vig ?? 1; ctx.drawImage(v, 0, 0);
  // film grain (pre-baked tiles, cycled per frame)
  if (!grainTiles) { grainTiles = []; for (let k = 0; k < 6; k++) { const c = mkCanvas(480, 270), g = c.getContext('2d'), d = g.createImageData(480, 270), r = rng(100 + k); for (let i = 0; i < d.data.length; i += 4) { const v2 = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v2; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); grainTiles.push(c); } }
  ctx.globalAlpha = o.grain ?? (window.GRAIN ?? .045); ctx.globalCompositeOperation = 'overlay'; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grainTiles[Math.floor(t * 24) % 6], 0, 0, W, H);
  ctx.restore();
  if (o.fade > 0) { ctx.save(); ctx.globalAlpha = clamp(o.fade); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (o.flash > 0) { ctx.save(); ctx.globalAlpha = clamp(o.flash); ctx.fillStyle = '#fff8ea'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
