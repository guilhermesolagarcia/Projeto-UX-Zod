export function initCursor() {
  if (matchMedia('(pointer: coarse)').matches) return { setColor() {}, setHover() {} };
  const dot = document.createElement('div');
  dot.className = 'cursor';
  document.body.append(dot);
  document.documentElement.classList.add('has-cursor');
  const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.25; // sem rastro em movimento reduzido
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; });
  let overLink = false, overCan = false; // cresce sobre links/botões e sobre as latas do CTA
  const sync = () => dot.classList.toggle('is-hover', overLink || overCan);
  document.addEventListener('pointerover', (e) => { overLink = !!e.target.closest('a, button'); sync(); });
  (function loop() {
    cx += (x - cx) * k; cy += (y - cy) * k;
    dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  return { setColor(color) { dot.style.backgroundColor = color; }, setHover(v) { overCan = v; sync(); } };
}
