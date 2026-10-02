// "tssss" da lata abrindo: ruído branco filtrado, sintetizado na hora (sem arquivo de áudio)
export function createFizz({ AudioCtx = globalThis.AudioContext } = {}) {
  let ctx = null, enabled = false;
  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      if (enabled && !ctx && AudioCtx) ctx = new AudioCtx();
      return enabled;
    },
    play() {
      if (!enabled || !ctx) return;
      const len = 0.7, now = ctx.currentTime;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5000; bp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + len);
      src.connect(bp).connect(g).connect(ctx.destination);
      src.start();
    },
  };
}
