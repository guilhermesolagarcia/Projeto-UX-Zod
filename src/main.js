import './style.css';
import { BRAND, FLAVORS } from './flavors.js';
import { flavorState, currentFlavor } from './scrollState.js';
import { loadLabelFonts } from './labels.js';
import { createScene } from './scene.js';
import { createCan } from './can.js';
import { createState, initScroll, POSES } from './scroll.js';
import { initCursor } from './cursor.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches;
const root = document.documentElement;
const SECTION_BG = { hero: FLAVORS[0].a, ingredientes: '#F4F1EA', cta: '#111111' };
const poses = POSES[mobile ? 'mobile' : 'desktop'];

document.querySelectorAll('[data-brand]').forEach((el) => { el.textContent = BRAND; });

const ui = {
  name: document.querySelector('.flavor-name'),
  desc: document.querySelector('.flavor-desc'),
  num: document.querySelector('.flavor-num'),
  dots: [...document.querySelectorAll('.dots button')],
  bgA: document.querySelector('.bg-a'),
  bgB: document.querySelector('.bg-b'),
};

function hasWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

function showFlavor(i) {
  const f = FLAVORS[i];
  ui.name.textContent = f.title;
  ui.desc.textContent = f.desc;
  ui.num.textContent = String(i + 1);
  ui.dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
  root.style.setProperty('--flavor', f.a);
  if (!reduced) ui.name.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

function paintBackground(section, fs) {
  root.dataset.section = section;
  if (section === 'sabores') {
    ui.bgA.style.backgroundColor = FLAVORS[fs.from].a;
    ui.bgB.style.backgroundColor = ui.bgB.style.color = FLAVORS[fs.to].a;
    ui.bgB.style.transform = `translateY(${(1 - fs.mix) * 105}%)`;
  } else {
    ui.bgA.style.backgroundColor = SECTION_BG[section];
    ui.bgB.style.transform = 'translateY(105%)';
  }
}

const state = createState(mobile);
let lastFlavor = -1;

function tickUI() {
  if (reduced) Object.assign(state, poses[state.section]);
  const fs = flavorState(state.flavorP, FLAVORS.length);
  if (reduced) fs.mix = Math.round(fs.mix);
  const cur = currentFlavor(fs);
  const changed = cur !== lastFlavor;
  if (changed) { showFlavor(cur); lastFlavor = cur; }
  paintBackground(state.section, fs);
  return { fs, cur, changed };
}

function bindControls(scroll) {
  ui.dots.forEach((d, i) => d.addEventListener('click', () => scroll.goToFlavor(i, FLAVORS.length)));
}

async function start() {
  if (!hasWebGL()) {
    root.classList.add('no-webgl');
    bindControls(initScroll({ state, mobile, reducedMotion: reduced }));
    (function loop() { tickUI(); requestAnimationFrame(loop); })();
    return;
  }

  await loadLabelFonts();
  const s3 = createScene(document.getElementById('scene'), { mobile });
  const hero = createCan({ condensation: !reduced });
  s3.scene.add(hero.group);
  const extras = [0, 1, 2].map((i) => {
    const c = createCan({ condensation: false });
    c.setFlavors(i, i, 0);
    c.group.visible = false;
    s3.scene.add(c.group);
    return c;
  });

  bindControls(initScroll({ state, mobile, reducedMotion: reduced }));

  const cursor = initCursor();
  const pointer = { x: 0, y: 0 };
  if (!reduced) addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; });

  let prev = performance.now();
  s3.renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - prev) / 1000, 0.05); prev = now;
    const t = now / 1000;
    const { fs, cur, changed } = tickUI();
    const idle = reduced ? 0 : 1;
    const { w, h } = s3.viewSize();

    hero.setFlavors(fs.from, fs.to, fs.mix);
    const g = hero.group;
    g.position.set((state.x * w) / 2, (state.y * h) / 2 + state.drop * h + Math.sin(t * 1.1) * 0.06 * idle, 0);
    g.scale.setScalar(state.s);
    const spin = reduced ? 0 : state.flavorP * Math.PI * 4;
    g.rotation.set(0.12 + pointer.y * 0.12 * idle, spin - 0.4 + pointer.x * 0.25 * idle, -0.14);
    hero.setOpen(state.open);

    if (changed) cursor.setColor(FLAVORS[cur].a);

    const ctaOn = reduced ? (state.section === 'cta' ? 1 : 0) : state.cta;
    extras.forEach((c, i) => {
      c.group.visible = ctaOn > 0.01;
      c.group.position.set(((-0.6 + i * 0.4) * w) / 2, (poses.cta.y * h) / 2, 0);
      c.group.scale.setScalar(poses.cta.s * ctaOn);
      c.group.rotation.set(0.1, t * 0.6 * idle + i, -0.1);
      c.update(dt, t);
    });

    hero.update(dt, t);
    s3.render();
  });
}

start();
