import { open } from './launcher.mjs'; import fs from 'fs';
const times = process.argv[2].split(',').map(Number); const out = process.argv[3] || 'prev'; const full = process.argv[4] === 'full';
const { browser, page } = await open();
await page.goto('http://localhost/projects/sandbox/work/moon/page.html');
const res = await page.evaluate(async ({ times, full }) => {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const sheet = mkCanvas(1920, 1080), sg = sheet.getContext('2d'); const outs = []; const t0 = performance.now();
  for (let i = 0; i < times.length; i++) {
    renderFrame(ctx, times[i] + OFF);
    if (full) { outs.push(cv.toDataURL('image/jpeg', .9)); continue; }
    const k = i % 16, x = (k % 4) * 480, y = Math.floor(k / 4) * 270; sg.drawImage(cv, x, y, 480, 270);
    sg.fillStyle = 'rgba(0,0,0,.7)'; sg.fillRect(x, y, 74, 22); sg.fillStyle = '#ff0'; sg.font = '16px monospace'; sg.fillText(times[i].toFixed(2), x + 4, y + 16);
    if (k === 15 || i === times.length - 1) { outs.push(sheet.toDataURL('image/jpeg', .85)); sg.clearRect(0, 0, 1920, 1080); }
  }
  return { outs, ms: (performance.now() - t0) / times.length };
}, { times, full });
res.outs.forEach((s, i) => fs.writeFileSync(`${out}${i}.jpg`, Buffer.from(s.split(',')[1], 'base64')));
console.log('rendered', times.length, 'frames, avg ms/frame', res.ms.toFixed(1));
await browser.close();
