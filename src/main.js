import './style.css';
import { Color } from 'three';
import { BRAND, FLAVORS } from './flavors.js';
import { flavorState, currentFlavor, presentationSpin } from './scrollState.js';
import { loadLabelFonts } from './labels.js';
import { createScene } from './scene.js';
import { createCan, preloadLabels } from './can.js';
import { createState, initScroll, currentPoses } from './scroll.js';
import { initCursor } from './cursor.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches; // só pra qualidade do renderer
const root = document.documentElement;
const SECTION_BG = { hero: FLAVORS[0].a, ingredientes: '#F4F1EA', cta: '#111111' };
const RIM_A = FLAVORS.map((f) => new Color(f.a)), RIM_B = FLAVORS.map((f) => new Color(f.b)), WHITE = new Color('#fff'), rimMix = new Color();

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
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch { return false; }
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

// só escreve no DOM quando o valor muda
const painted = {};
function paint(key, value, write) { if (painted[key] !== value) { painted[key] = value; write(value); } }
function paintBackground(section, fs) {
  paint('section', section, (v) => { root.dataset.section = v; });
  const sab = section === 'sabores';
  paint('a', sab ? FLAVORS[fs.from].a : SECTION_BG[section], (v) => { ui.bgA.style.backgroundColor = v; });
  if (sab) paint('b', FLAVORS[fs.to].a, (v) => { ui.bgB.style.backgroundColor = ui.bgB.style.color = v; });
  paint('t', `translateY(${sab ? (1 - fs.mix) * 105 : 105}%)`, (v) => { ui.bgB.style.transform = v; });
}

const state = createState();
let lastFlavor = -1;

function tickUI() {
  if (reduced) Object.assign(state, currentPoses()[state.section]);
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

function fallback() {
  root.classList.add('no-webgl');
  (function loop() { tickUI(); requestAnimationFrame(loop); })();
}

async function start() {
  // scroll primeiro: pin, seções e a intro do título não esperam fontes nem 3D
  bindControls(initScroll({ state, reducedMotion: reduced }));
  if (!hasWebGL()) return fallback();

  let s3, hero, extras;
  try {
    await loadLabelFonts();
    s3 = createScene(document.getElementById('scene'), { mobile });
    hero = createCan({ condensation: !reduced });
    s3.scene.add(hero.group);
    extras = [0, 1, 2].map((i) => {
      const c = createCan({ condensation: false });
      c.setFlavors(i, i, 0);
      c.group.visible = false;
      s3.scene.add(c.group);
      return c;
    });
    preloadLabels(s3.renderer, FLAVORS.length);
  } catch (err) {
    console.error(err);
    s3?.renderer.dispose();
    return fallback();
  }

  const cursor = initCursor();
  const pointer = { x: 0, y: 0 };
  if (!reduced) addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; });

  const TAU = Math.PI * 2;
  let prev = performance.now(), ctaSpin = 0, tilt = 0, tiltV = 0;
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
    const spin = reduced ? 0 : presentationSpin(fs);
    const ctaOn = reduced ? (state.section === 'cta' ? 1 : 0) : state.cta;
    // giro lento no CTA acumulado por frame (t * ctaOn giraria rápido durante o scrub); fora dele volta pra frente
    ctaSpin = ctaOn > 0.01 ? ctaSpin + dt * 0.6 * ctaOn * idle : ctaSpin + (Math.round(ctaSpin / TAU) * TAU - ctaSpin) * Math.min(dt * 4, 1);
    // mola: a lata inclina com a velocidade da rolagem e volta balançando quando para
    if (!reduced) { state.vel *= 0.9; tiltV += ((state.vel * 0.35 - tilt) * 90 - tiltV * 12) * dt; tilt += tiltV * dt; }
    g.rotation.set(0.12 + pointer.y * 0.12 * idle + tilt, spin - 0.15 + state.turn + pointer.x * 0.25 * idle + ctaSpin, -0.14 + tilt * 0.3);
    hero.setOpen(state.open);

    if (changed) cursor.setColor(FLAVORS[cur].a);
    const sec = state.section;
    const rimColor = sec === 'sabores' ? rimMix.lerpColors(RIM_B[fs.from], RIM_B[fs.to], fs.mix) : sec === 'ingredientes' ? WHITE : sec === 'cta' ? RIM_A[cur] : RIM_B[0];
    s3.setRim(rimColor, sec === 'ingredientes' ? 3 : 4, reduced ? 1 : 0.08);

    const poses = currentPoses();
    extras.forEach((c, i) => {
      c.group.visible = ctaOn > 0.01;
      c.group.position.set((poses.slots[i] * w) / 2, (poses.cta.y * h) / 2, 0);
      c.group.scale.setScalar(poses.cta.s * ctaOn);
      c.group.rotation.set(0.1, (t * 0.6 + i) * idle, -0.1);
      c.update(dt, t);
    });

    hero.update(dt, t);
    s3.render();
  });
}

start();
