// Render driver: draws every frame in headless Chrome, encodes H.264 with WebCodecs, mixes + encodes Opus audio, muxes MP4.
import { open } from './launcher.mjs'; import fs from 'fs'; import { writeMp4 } from './mp4.mjs';
const outFile = process.argv[2] || '/projects/sandbox/work/out.mp4';
const limitSec = process.argv[3] ? +process.argv[3] : null; // optional: render only the first N seconds (test)
const voDir = '/projects/sandbox/my-voice'; const voFile = voDir + '/' + fs.readdirSync(voDir).find(f => f.endsWith('.mp3'));
const segs = JSON.parse(fs.readFileSync('/projects/sandbox/work/vo2.json')).segs;

const { browser, page } = await open();
const video = { samples: [], avcC: null }, audio = { samples: [], channels: 2, sampleRate: 48000, preSkip: 312 };
await page.exposeFunction('pushVideo', (b64, metas) => { const buf = Buffer.from(b64, 'base64'); let o = 0; for (const m of metas) { video.samples.push({ data: buf.subarray(o, o + m.n), key: m.key, ts: m.ts }); o += m.n; } });
await page.exposeFunction('pushAudio', (b64, metas) => { const buf = Buffer.from(b64, 'base64'); let o = 0; for (const m of metas) { audio.samples.push({ data: buf.subarray(o, o + m.n), dur: m.dur }); o += m.n; } });
await page.exposeFunction('setAvcC', b64 => { video.avcC = Buffer.from(b64, 'base64'); });
await page.exposeFunction('setOpusHead', b64 => { const h = Buffer.from(b64, 'base64'); if (h.length >= 12 && h.toString('ascii', 0, 8) === 'OpusHead') { audio.preSkip = h.readUInt16LE(10); audio.inputRate = h.readUInt32LE(12); } });
await page.goto('http://localhost/projects/sandbox/work/moon/page.html');
await page.addScriptTag({ url: 'http://localhost/projects/sandbox/work/moon/audio.js' });

const t0 = Date.now();
const info = await page.evaluate(async ({ voUrl, segs, limitSec, qp, qmode, br, grain }) => {
  window.GRAIN = grain;
  return (async () => {
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const flush = async (q, fn) => { if (!q.length) return; const list = q.splice(0, q.length); const tot = list.reduce((a, c) => a + c.data.length, 0), all = new Uint8Array(tot); let o = 0; for (const c of list) { all.set(c.data, o); o += c.data.length; } await fn(b64(all), list.map(c => c.meta)); };
  // ---------- AUDIO ----------
  const mix = await buildMix(voUrl, segs);
  const aq = []; let opusHeadSent = false;
  const aenc = new AudioEncoder({ output: (ch, md) => { if (!opusHeadSent && md && md.decoderConfig && md.decoderConfig.description) { opusHeadSent = true; window.setOpusHead(b64(new Uint8Array(md.decoderConfig.description))); } const d = new Uint8Array(ch.byteLength); ch.copyTo(d); aq.push({ data: d, meta: { n: d.length, dur: Math.round((ch.duration || 20000) * 48000 / 1e6) } }); }, error: e => console.log('AENC', e.message) });
  aenc.configure({ codec: 'opus', sampleRate: 48000, numberOfChannels: 2, bitrate: 256000, opus: { frameDuration: 20000, complexity: 10 } });
  const buf = mix.buffer, L = buf.getChannelData(0), R = buf.getChannelData(1), N = limitSec ? Math.min(buf.length, Math.ceil(limitSec * 48000)) : buf.length;
  for (let i = 0; i < N; i += 4800) { const n = Math.min(4800, N - i); const pl = new Float32Array(n * 2); pl.set(L.subarray(i, i + n), 0); pl.set(R.subarray(i, i + n), n); aenc.encode(new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data: pl })); }
  await aenc.flush(); await flush(aq, window.pushAudio);
  console.log('audio done: peakBefore dB', mix.peakBefore.toFixed(2), 'rms dB', mix.rmsDb.toFixed(2));
  // ---------- VIDEO ----------
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const frames = Math.round((limitSec || TOTAL) * FPS); const vq = []; let cfgSent = false, encErr = null;
  const venc = new VideoEncoder({ output: (ch, md) => { if (!cfgSent && md && md.decoderConfig && md.decoderConfig.description) { cfgSent = true; window.setAvcC(b64(new Uint8Array(md.decoderConfig.description))); } const d = new Uint8Array(ch.byteLength); ch.copyTo(d); vq.push({ data: d, meta: { n: d.length, key: ch.type === 'key', ts: ch.timestamp } }); }, error: e => { encErr = e.message; } });
  venc.configure({ codec: 'avc1.64002A', width: W, height: H, framerate: FPS, bitrateMode: qmode === 'vbr' ? 'variable' : 'quantizer', bitrate: br, latencyMode: 'quality', avc: { format: 'avc' }, hardwareAcceleration: 'prefer-software' });
  const ts = performance.now();
  for (let i = 0; i < frames; i++) {
    renderFrame(ctx, i / FPS);
    const f = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    venc.encode(f, qmode === 'vbr' ? { keyFrame: i % 120 === 0 } : { keyFrame: i % 120 === 0, avc: { quantizer: qp } }); f.close();
    while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 1));
    if (vq.length >= 120) await flush(vq, window.pushVideo);
    if (encErr) throw new Error(encErr);
    if (i % 600 === 0) console.log(`frame ${i}/${frames}  ${((performance.now() - ts) / (i + 1)).toFixed(1)} ms/frame`);
  }
  await venc.flush(); await flush(vq, window.pushVideo);
  return { frames, peakBefore: mix.peakBefore, rms: mix.rmsDb };
  })();
}, { voUrl: 'http://localhost' + encodeURI(voFile), segs, limitSec, qp: +(process.env.QP || 20), qmode: process.env.QMODE || 'q', br: +(process.env.BR || 50e6), grain: +(process.env.GRAIN || .045) });
await browser.close();
const r = writeMp4(outFile, { video, audio, width: 1920, height: 1080, fps: 60 });
console.log('frames', info.frames, 'video samples', video.samples.length, 'keyframes', video.samples.filter(s => s.key).length, 'audio packets', audio.samples.length, 'preSkip', audio.preSkip);
console.log('wrote', outFile, (r.bytes / 1e6).toFixed(1), 'MB in', ((Date.now() - t0) / 1000).toFixed(0), 's');
