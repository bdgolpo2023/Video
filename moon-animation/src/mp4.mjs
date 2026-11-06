// Minimal ISO-BMFF (MP4) writer: one H.264 (avcC) video track + one Opus audio track, faststart (moov before mdat).
import fs from 'fs';

const u8 = (...a) => Buffer.from(a);
const u16 = v => { const b = Buffer.alloc(2); b.writeUInt16BE(v); return b; };
const u32 = v => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b; };
const i16 = v => { const b = Buffer.alloc(2); b.writeInt16BE(v); return b; };
const str = s => Buffer.from(s, 'ascii');
const box = (type, ...parts) => { const body = Buffer.concat(parts.flat()); return Buffer.concat([u32(8 + body.length), str(type), body]); };
const full = (type, ver, flags, ...parts) => box(type, u8(ver, flags >> 16 & 255, flags >> 8 & 255, flags & 255), ...parts);
const matrix = () => Buffer.concat([0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(u32));

export function writeMp4(file, { video, audio, width, height, fps }) {
  // video: {samples:[{data,key}], avcC}; audio: {samples:[{data,dur}], channels, sampleRate, preSkip}
  const vTS = fps * 1000, vDur = 1000; // timescale 60000, 1000 per frame
  const aTS = audio.sampleRate;
  // interleave ~0.5 s chunks of each track in time order
  const order = []; let vi = 0, ai = 0, at = 0;
  while (vi < video.samples.length || ai < audio.samples.length) {
    const vtime = vi / fps, atime = at / aTS;
    if (ai >= audio.samples.length || (vi < video.samples.length && vtime <= atime)) { const n = Math.min(30, video.samples.length - vi); order.push({ tr: 'v', from: vi, n }); vi += n; }
    else { let n = 0, d = 0; while (ai + n < audio.samples.length && d < aTS / 2) { d += audio.samples[ai + n].dur; n++; } order.push({ tr: 'a', from: ai, n }); ai += n; at += d; }
  }
  const build = (mdatStart) => {
    let off = mdatStart + 8; const vChunks = [], aChunks = [];
    for (const c of order) { const arr = c.tr === 'v' ? video.samples : audio.samples; (c.tr === 'v' ? vChunks : aChunks).push({ off, n: c.n }); for (let k = 0; k < c.n; k++) off += arr[c.from + k].data.length; }
    const stsc = (chunks) => { const ent = []; chunks.forEach((c, i) => { if (!ent.length || ent[ent.length - 1][1] !== c.n) ent.push([i + 1, c.n]); }); return full('stsc', 0, 0, u32(ent.length), ent.map(([f, n]) => Buffer.concat([u32(f), u32(n), u32(1)]))); };
    const stco = (chunks) => full('stco', 0, 0, u32(chunks.length), chunks.map(c => u32(c.off)));
    const stsz = (s) => full('stsz', 0, 0, u32(0), u32(s.length), s.map(x => u32(x.data.length)));
    const sttsRuns = (durs) => { const r = []; for (const d of durs) { if (r.length && r[r.length - 1][1] === d) r[r.length - 1][0]++; else r.push([1, d]); } return full('stts', 0, 0, u32(r.length), r.map(([n, d]) => Buffer.concat([u32(n), u32(d)]))); };
    const vTotal = Math.round((video.samples[video.samples.length - 1].ts - video.samples[0].ts) * vTS / 1e6) + vDur, aTotal = audio.samples.reduce((a, s) => a + s.dur, 0);
    const movieDur = Math.round(Math.max(vTotal / vTS, (aTotal - audio.preSkip) / aTS) * 1000);
    const dinf = box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1)));
    const tkhd = (id, dur, isAudio) => full('tkhd', 0, 3, u32(0), u32(0), u32(id), u32(0), u32(dur), u32(0), u32(0), i16(0), i16(isAudio ? 1 : 0), u16(isAudio ? 0x0100 : 0), u16(0), matrix(), u32(isAudio ? 0 : width << 16), u32(isAudio ? 0 : height << 16));
    const mdhd = (ts, dur) => full('mdhd', 0, 0, u32(0), u32(0), u32(ts), u32(dur), u16(0x55c4), u16(0));
    const hdlr = (t, name) => full('hdlr', 0, 0, u32(0), str(t), u32(0), u32(0), u32(0), str(name + '\0'));
    const elst = (segDur, mediaTime) => box('edts', full('elst', 0, 0, u32(1), u32(segDur), u32(mediaTime), u16(1), u16(0)));
    const avc1 = box('avc1', Buffer.alloc(6), u16(1), u16(0), u16(0), u32(0), u32(0), u32(0), u16(width), u16(height), u32(0x00480000), u32(0x00480000), u32(0), u16(1), Buffer.alloc(32), u16(0x18), i16(-1), box('avcC', video.avcC), box('pasp', u32(1), u32(1)));
    const vStbl = box('stbl', full('stsd', 0, 0, u32(1), avc1), sttsRuns(video.samples.map((s, i) => i + 1 < video.samples.length ? Math.round((video.samples[i + 1].ts - s.ts) * vTS / 1e6) : vDur)), full('stss', 0, 0, u32(video.samples.filter(s => s.key).length), video.samples.map((s, i) => s.key ? u32(i + 1) : null).filter(Boolean)), stsc(vChunks), stsz(video.samples), stco(vChunks));
    const vTrak = box('trak', tkhd(1, Math.round(vTotal / vTS * 1000), false), elst(Math.round(vTotal / vTS * 1000), 0), box('mdia', mdhd(vTS, vTotal), hdlr('vide', 'VideoHandler'), box('minf', full('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0)), dinf, vStbl)));
    const dOps = box('dOps', u8(0), u8(audio.channels), u16(audio.preSkip), u32(audio.inputRate || 48000), i16(0), u8(0));
    const opus = box('Opus', Buffer.alloc(6), u16(1), u32(0), u32(0), u16(audio.channels), u16(16), u16(0), u16(0), u32(aTS << 16), dOps);
    const aStbl = box('stbl', full('stsd', 0, 0, u32(1), opus), sttsRuns(audio.samples.map(s => s.dur)), stsc(aChunks), stsz(audio.samples), stco(aChunks), full('sgpd', 1, 0, str('roll'), u32(2), u32(1), i16(-3840 / 960 | 0)), full('sbgp', 0, 0, str('roll'), u32(1), u32(audio.samples.length), u32(1)));
    const aMovDur = Math.round((aTotal - audio.preSkip) / aTS * 1000);
    const aTrak = box('trak', tkhd(2, aMovDur, true), elst(aMovDur, audio.preSkip), box('mdia', mdhd(aTS, aTotal), hdlr('soun', 'SoundHandler'), box('minf', full('smhd', 0, 0, i16(0), u16(0)), dinf, aStbl)));
    const mvhd = full('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(movieDur), u32(0x00010000), u16(0x0100), Buffer.alloc(10), matrix(), Buffer.alloc(24), u32(3));
    return box('moov', mvhd, vTrak, aTrak);
  };
  const ftyp = box('ftyp', str('isom'), u32(512), str('isom'), str('iso2'), str('avc1'), str('mp41'), str('Opus'));
  let moov = build(0); moov = build(ftyp.length + moov.length);
  const mdatSize = order.reduce((s, c) => { const arr = c.tr === 'v' ? video.samples : audio.samples; for (let k = 0; k < c.n; k++) s += arr[c.from + k].data.length; return s; }, 0);
  const fd = fs.openSync(file, 'w');
  fs.writeSync(fd, ftyp); fs.writeSync(fd, moov); fs.writeSync(fd, Buffer.concat([u32(8 + mdatSize), str('mdat')]));
  for (const c of order) { const arr = c.tr === 'v' ? video.samples : audio.samples; for (let k = 0; k < c.n; k++) fs.writeSync(fd, arr[c.from + k].data); }
  fs.closeSync(fd);
  return { bytes: ftyp.length + moov.length + 8 + mdatSize };
}
