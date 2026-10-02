const HOLD = 0.6; // fração de cada trecho em que o sabor fica parado antes de trocar

export function flavorState(p, count) {
  const last = count - 1;
  const clamped = Number.isFinite(p) ? Math.min(Math.max(p, 0), 1) : 0;
  const t = clamped * last;
  const from = Math.min(Math.floor(t), last);
  const local = t - from;
  const mix = from === last ? 0 : Math.min(Math.max((local - HOLD) / (1 - HOLD), 0), 1);
  return { from, to: Math.min(from + 1, last), mix };
}

export function currentFlavor({ from, to, mix }) {
  return mix >= 0.5 ? to : from;
}

// ângulo de apresentação: frente (múltiplo de 2π) em cada descanso, 1 volta suave por troca
export function presentationSpin({ from, mix }) {
  const eased = 0.5 - Math.cos(Math.PI * mix) / 2; // easeInOutSine
  return (from + eased) * Math.PI * 2;
}
