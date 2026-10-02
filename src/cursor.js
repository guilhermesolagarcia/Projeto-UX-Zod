export function initCursor() {
  if (matchMedia('(pointer: coarse)').matches) return { setColor() {} };
  const dot = document.createElement('div');
  dot.className = 'cursor';
  document.body.append(dot);
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; });
  document.addEventListener('pointerover', (e) => { dot.classList.toggle('is-hover', !!e.target.closest('a, button')); });
  (function loop() {
    cx += (x - cx) * 0.25; cy += (y - cy) * 0.25;
    dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  return { setColor(color) { dot.style.backgroundColor = color; } };
}
