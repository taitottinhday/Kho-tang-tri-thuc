/* Âm thanh cho quà tặng – Claude Code (đợt 17). Tổng hợp bằng Web Audio (không cần tệp âm thanh, không vướng bản quyền).
   Dùng chung bộ âm thanh của app (getAudioCtx – đã mở khoá cho iPhone ở đợt 14); tôn trọng nút tắt tiếng & âm lượng. */
'use strict';
const QuaAm = (() => {
  let master = null, compressor = null, noiseBuf = null;
  let playing = false;
  function begin() { playing = true; }
  function end() {
    playing = false;
    if (!master) return;
    master.disconnect();
    compressor.disconnect();
    master = compressor = null;
  }
  const on = () => typeof db !== 'undefined' && db.settings.sound;
  function ctx() {
    if (!playing || !on()) return null;
    const c = typeof getAudioCtx === 'function' ? getAudioCtx() : null; if (!c) return null;
    if (c.state !== 'running') { try { c.resume(); } catch (e) {} }
    if (!master || master.context !== c) {
      compressor = c.createDynamicsCompressor(); compressor.threshold.value = -14; compressor.ratio.value = 6; compressor.connect(c.destination);
      master = c.createGain(); master.connect(compressor);
    }
    master.gain.value = 0.9 * (db.settings.sfxVol == null ? 0.8 : db.settings.sfxVol);
    return c;
  }
  function noise(c) {
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate); const d = noiseBuf.getChannelData(0);
      let brown = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; brown = (brown + 0.02 * w) / 1.02; d[i] = w * 0.6 + brown * 2.2; }
    }
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
  }
  const env = (c, g, t, a, hold, rel, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel); };
  function tone(f, t, dur, type, vol, glide) {
    const c = ctx(); if (!c) return; const o = c.createOscillator(), g = c.createGain(), at = c.currentTime + (t || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, at); if (glide) o.frequency.exponentialRampToValueAtTime(glide, at + dur);
    env(c, g, at, 0.012, dur * 0.35, dur * 0.65, vol || 0.2); o.connect(g); g.connect(master); o.start(at); o.stop(at + dur + 0.1);
  }
  function noiseHit(t, dur, type, freq, q, vol, glide, attack) {
    const c = ctx(); if (!c) return; const s = noise(c), f = c.createBiquadFilter(), g = c.createGain(), at = c.currentTime + t;
    f.type = type; f.frequency.setValueAtTime(freq, at); if (glide) f.frequency.exponentialRampToValueAtTime(glide, at + dur); f.Q.value = q;
    env(c, g, at, attack || 0.01, dur * 0.3, dur * 0.7, vol); s.connect(f); f.connect(g); g.connect(master); s.start(at, Math.random() * 1.5); s.stop(at + dur + 0.15);
  }
  /* Tiếng gầm sư tử: giọng cổ họng (răng cưa trầm + rung nhanh) qua 3 khoang cộng hưởng + hơi thở ồn, có tiếng vang */
  function roar(t, len, big) {
    const c = ctx(); if (!c) return; const at = c.currentTime + (t || 0), dur = len || 2.1, k = big ? 1 : 0.75;
    const out = c.createGain(); env(c, out, at, 0.18, dur * 0.45, dur * 0.5, 0.95 * k);
    const dist = c.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.2); } dist.curve = curve;
    const delay = c.createDelay(1), fb = c.createGain(), wet = c.createGain(); delay.delayTime.value = 0.11; fb.gain.value = 0.32; wet.gain.value = 0.35;
    out.connect(master); out.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    const formants = [[270, 4, 1], [620, 5, 0.7], [1150, 6, 0.28]].map(([fq, q, gv]) => { const f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(fq * 0.75, at); f.frequency.linearRampToValueAtTime(fq * 1.18, at + dur * 0.28); f.frequency.linearRampToValueAtTime(fq * 0.7, at + dur); g.gain.value = gv * 2.2; f.connect(g); g.connect(out); return f; });
    const growl = c.createGain(); growl.gain.value = 0.62; const lfo = c.createOscillator(), depth = c.createGain(); lfo.type = 'sawtooth'; lfo.frequency.setValueAtTime(31, at); lfo.frequency.linearRampToValueAtTime(22, at + dur); depth.gain.value = 0.42; lfo.connect(depth); depth.connect(growl.gain);
    formants.forEach(f => dist.connect(f)); growl.connect(dist);
    [1, 1.503, 0.502].forEach((mul, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(78 * mul, at); o.frequency.linearRampToValueAtTime(128 * mul, at + dur * 0.25); o.frequency.linearRampToValueAtTime(64 * mul, at + dur); o.detune.value = i * 7; g.gain.value = i === 2 ? 0.55 : 0.34; o.connect(g); g.connect(growl); o.start(at); o.stop(at + dur + 0.1); });
    const n = noise(c), ng = c.createGain(); ng.gain.value = 0.5; n.connect(ng); ng.connect(growl); n.start(at); n.stop(at + dur + 0.1);
    lfo.start(at); lfo.stop(at + dur + 0.1);
    const sub = c.createOscillator(), sg = c.createGain(); sub.type = 'sine'; sub.frequency.setValueAtTime(52, at); sub.frequency.linearRampToValueAtTime(38, at + dur); env(c, sg, at, 0.2, dur * 0.4, dur * 0.5, 0.45 * k); sub.connect(sg); sg.connect(master); sub.start(at); sub.stop(at + dur + 0.1);
  }
  function screech(t) { // tiếng phượng hoàng
    [0, 0.42].forEach((d, i) => { tone(1500, t + d, 0.5, 'sawtooth', 0.06, 2600); tone(1520, t + d, 0.55, 'triangle', 0.12, i ? 1700 : 2900); noiseHit(t + d, 0.45, 'bandpass', 2600, 6, 0.18, 3600); });
  }
  const thud = (t, v) => { tone(120, t, 0.28, 'sine', v || 0.6, 42); noiseHit(t, 0.14, 'lowpass', 500, 1, (v || 0.6) * 0.7); };
  const whoosh = (t, up) => noiseHit(t, 0.6, 'bandpass', up ? 300 : 2400, 1.4, 0.35, up ? 3200 : 280, 0.22);
  function cheer(t, dur) { // khán đài hò reo: nhiều lớp ồn dải giọng người + tiếng vỗ tay
    const d = dur || 3;
    [[700, 0.28], [1100, 0.24], [1700, 0.13], [420, 0.2]].forEach(([f, v], i) => noiseHit(t + i * 0.05, d, 'bandpass', f, 1.1, v, f * 1.12, 0.35));
    for (let i = 0; i < d * 28; i++) noiseHit(t + 0.2 + Math.random() * (d - 0.5), 0.045, 'highpass', 1800 + Math.random() * 2200, 0.8, 0.05 + Math.random() * 0.09);
    for (let i = 0; i < 7; i++) tone(500 + Math.random() * 500, t + 0.15 + Math.random() * d * 0.6, 0.45, 'triangle', 0.025, 800 + Math.random() * 700);
  }
  const whistle = t => { [0, 0.28].forEach((d, i) => { const f = 2350; tone(f, t + d, i ? 0.5 : 0.18, 'square', 0.05); tone(f * 1.015, t + d, i ? 0.5 : 0.18, 'sine', 0.16); }); };
  function boom(t, v) { tone(85, t, 0.7, 'sine', (v || 0.5), 32); noiseHit(t, 0.5, 'lowpass', 900, 0.7, (v || 0.5) * 0.9, 120); for (let i = 0; i < 24; i++) noiseHit(t + 0.12 + Math.random() * 0.9, 0.03, 'highpass', 3000 + Math.random() * 3000, 1, 0.04 + Math.random() * 0.1); }
  const launch = t => { noiseHit(t, 0.9, 'bandpass', 500, 3, 0.2, 2800, 0.3); tone(380, t, 0.85, 'sine', 0.05, 1500); };
  function rumble(t, dur) { noiseHit(t, dur, 'lowpass', 190, 0.8, 0.95, 420, 0.5); noiseHit(t, dur, 'bandpass', 900, 0.6, 0.2, 1800, 0.8); tone(46, t, dur, 'sawtooth', 0.16, 70); }
  const coin = t => { tone(1320, t, 0.09, 'square', 0.05); tone(1760 + Math.random() * 300, t + 0.05, 0.32, 'triangle', 0.13); };
  const sparkle = (t, n) => { for (let i = 0; i < (n || 10); i++) tone(1500 + Math.random() * 2600, t + i * 0.055, 0.28, 'sine', 0.07); };
  const splash = t => { noiseHit(t, 0.7, 'bandpass', 1800, 0.7, 0.5, 450); noiseHit(t + 0.05, 0.9, 'highpass', 3200, 0.6, 0.18); tone(300, t, 0.2, 'sine', 0.2, 90); };
  const dolphin = t => { [0, 0.16, 0.3].forEach((d, i) => tone(2100 + i * 220, t + d, 0.14, 'sine', 0.13, 3400 - i * 200)); };
  function fanfare(t, grand) {
    const seq = grand ? [[392, 0, .16], [523, .16, .16], [659, .32, .16], [784, .48, .42], [659, .92, .14], [784, 1.06, .9]] : [[523, 0, .14], [659, .14, .14], [784, .28, .14], [1046, .42, .6]];
    seq.forEach(([f, d, len]) => { tone(f, t + d, len + .12, 'sawtooth', 0.075); tone(f * 2, t + d, len + .1, 'triangle', 0.06); tone(f / 2, t + d, len + .12, 'triangle', 0.1); });
  }
  const tick = (t, hi) => tone(hi ? 1250 : 820, t, hi ? 0.4 : 0.15, 'square', 0.12);
  return { begin, end, roar, screech, thud, whoosh, cheer, whistle, boom, launch, rumble, coin, sparkle, splash, dolphin, fanfare, tick, tone };
})();
