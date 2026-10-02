import './style.css';
import { Color, Raycaster, Vector2, Vector3 } from 'three';
import { gsap } from 'gsap';
import { BRAND, FLAVORS } from './flavors.js';
import { flavorState, currentFlavor, presentationSpin, ctaSlots } from './scrollState.js';
import { loadLabelFonts, LACRE } from './labels.js';
import { createScene } from './scene.js';
import { createCan, preloadLabels } from './can.js';
import { createState, initScroll, currentPoses, BACK } from './scroll.js';
import { initCursor } from './cursor.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches; // só pra qualidade do renderer
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches; // raycast nas latas do CTA só com mouse
const root = document.documentElement;
const SECTION_BG = { hero: FLAVORS[0].a, ingredientes: '#F4F1EA', cta: '#111111' };
const RIM_A = FLAVORS.map((f) => new Color(f.a)), RIM_B = FLAVORS.map((f) => new Color(f.b)), WHITE = new Color('#fff'), rimMix = new Color();

document.querySelectorAll('[data-brand]').forEach((el) => { el.textContent = BRAND; });

// faixa de sabores separados pelo lacre; cada metade tem o conjunto 2× pra não abrir buraco em tela larga
const lacre = `<svg viewBox="18 6 64 88"><path fill-rule="evenodd" d="${LACRE}"/></svg>`;
document.querySelector('.marquee-track').innerHTML = FLAVORS.map((f) => `<span>${f.name}</span>${lacre}`).join('').repeat(4);

const ui = {
  name: document.querySelector('.flavor-name'),
  desc: document.querySelector('.flavor-desc'),
  num: document.querySelector('.flavor-num'),
  dots: [...document.querySelectorAll('.dots button')],
  bgA: document.querySelector('.bg-a'),
  bgB: document.querySelector('.bg-b'),
  words: [...document.querySelectorAll('.bg-word span')],
  labelBox: document.querySelector('.can-labels'),
  labels: [...document.querySelectorAll('.can-label')],
};

function hasWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch { return false; }
}

// nome gigante atrás da lata: ocupa ~92vw (limitado pela altura), recalculado no resize e quando a fonte carrega
let wordK = 0;
function fitWord(el = ui.words[wordK]) {
  el.style.fontSize = '100px';
  el.style.fontSize = `${Math.min((100 * innerWidth * 0.92) / el.offsetWidth, innerHeight * 0.42)}px`;
}
addEventListener('resize', () => fitWord());
document.fonts.load('900 100px Unbounded').then(() => fitWord(), () => {});

function showWord(f) {
  const old = ui.words[wordK], el = ui.words[(wordK ^= 1)];
  el.textContent = f.l1; el.style.color = f.b; fitWord(el);
  if (reduced) { gsap.set(old, { opacity: 0 }); gsap.set(el, { opacity: 1 }); return; }
  gsap.to(old, { yPercent: -110, opacity: 0, duration: 0.7, ease: 'power3.out', overwrite: true });
  gsap.fromTo(el, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', overwrite: true });
}

function showFlavor(i) {
  const f = FLAVORS[i];
  ui.name.textContent = f.title;
  ui.desc.textContent = f.desc;
  ui.num.textContent = String(i + 1);
  ui.dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
  root.style.setProperty('--flavor', f.a);
  showWord(f);
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
  const scroll = initScroll({ state, reducedMotion: reduced });
  bindControls(scroll);
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
  addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; });

  // CTA: latas por slot (3 extras + a principal), rótulos-botão e hover por raycast
  const cans = [...extras, hero];
  cans.forEach((c, k) => c.group.children[0].traverse((o) => { o.userData.slot = k; }));
  const targets = cans.map((c) => c.group.children[0]);
  const ray = new Raycaster(), ndc = new Vector2(), base = new Vector3();
  const lift = [0, 0, 0, 0], liftV = [0, 0, 0, 0];
  let slotMap = ctaSlots(FLAVORS.length - 1, FLAVORS.length), canHover = -1, labelHover = -1;
  const pick = (k) => scroll.goToFlavor(slotMap[k], FLAVORS.length);
  ui.labels.forEach((b, k) => {
    b.addEventListener('click', () => pick(k));
    b.addEventListener('pointerenter', () => { labelHover = k; }); b.addEventListener('pointerleave', () => { labelHover = -1; });
    b.addEventListener('focus', () => { labelHover = k; }); b.addEventListener('blur', () => { labelHover = -1; });
  });
  addEventListener('click', (e) => { if (canHover >= 0 && !e.target.closest('a, button')) pick(canHover); });

  // linhas card → item da tabela no verso da lata (só desktop). Alvos em UV do rótulo (labels.js backInfo, 2048×1432):
  // logo antes do texto da linha (x 120, as linhas chegam pela esquerda) e no meio da altura da letra (baseline − 7)
  const wide = matchMedia('(min-width: 769px)');
  const lead = document.querySelector('.leaders'), leadG = [...lead.children], cards = [...document.querySelectorAll('.card')];
  const ROWS = [696, 552, 768].map((y) => [120 / 2048, 1 - (y - 7) / 1432]); // Cafeína, Açúcares totais, Vitamina B12
  const lp = new Vector3(), ln = new Vector3(), eye = new Vector3();
  let leadOp = 0;
  // caixa final de cada card relativa à seção: offset* ignora transform, então a linha não escorrega enquanto os cards entram
  const secEl = cards[0].offsetParent, box = [], last = [[], [], []];
  const measure = () => { cards.forEach((c, i) => { box[i] = [c.offsetLeft, c.offsetTop, c.offsetLeft + c.offsetWidth, c.offsetTop + c.offsetHeight]; }); last.forEach((v) => { v.length = 0; }); };
  new ResizeObserver(measure).observe(cards[0].parentNode); measure();

  const TAU = Math.PI * 2;
  let prev = performance.now(), ctaSpin = 0, tilt = 0, tiltV = 0;
  s3.renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - prev) / 1000, 0.05); prev = now;
    const t = now / 1000;
    const { fs, cur, changed } = tickUI();
    const idle = reduced ? 0 : 1;
    const { w, h } = s3.viewSize();
    const ctaOn = reduced ? (state.section === 'cta' ? 1 : 0) : state.cta;
    const inCta = state.section === 'cta' && ctaOn > 0.9;
    const poses = currentPoses();

    if (changed) {
      slotMap = ctaSlots(cur, FLAVORS.length);
      extras.forEach((c, k) => c.setFlavors(slotMap[k], slotMap[k], 0));
      ui.labels.forEach((b, k) => { b.textContent = FLAVORS[slotMap[k]].title; });
    }
    let hit = -1;
    if (inCta && finePointer) {
      ray.setFromCamera(ndc.set(pointer.x, -pointer.y), s3.camera);
      const first = ray.intersectObjects(targets, true)[0];
      if (first) hit = first.object.userData.slot;
    }
    if (hit !== canHover) { canHover = hit; cursor.setHover(hit >= 0); }
    const hot = inCta ? (canHover >= 0 ? canHover : labelHover) : -1;
    for (let k = 0; k < 4; k++) {
      if (reduced) { lift[k] = 0; continue; }
      liftV[k] += (((hot === k ? 1 : 0) - lift[k]) * 160 - liftV[k] * 18) * dt; lift[k] += liftV[k] * dt;
    }

    hero.setFlavors(fs.from, fs.to, fs.mix);
    const g = hero.group;
    g.position.set((state.x * w) / 2, (state.y * h) / 2 + state.drop * h + Math.sin(t * 1.1) * 0.06 * idle + lift[3] * 0.18, 0);
    g.scale.setScalar(state.s * (1 + lift[3] * 0.08));
    const spin = reduced ? 0 : presentationSpin(fs);
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

    extras.forEach((c, i) => {
      c.group.visible = ctaOn > 0.01;
      c.group.position.set((poses.slots[i] * w) / 2, (poses.cta.y * h) / 2 + lift[i] * 0.18, 0);
      c.group.scale.setScalar(poses.cta.s * ctaOn * (1 + lift[i] * 0.08));
      c.group.rotation.set(0.1, (t * 0.6 + i) * idle, -0.1);
      c.update(dt, t);
    });

    // rótulos sob a base de cada lata (sem o levantar do hover)
    paint('labels', inCta, (v) => { ui.labelBox.hidden = !v; });
    if (inCta) cans.forEach((c, k) => {
      const extra = k < 3, sc = extra ? poses.cta.s * ctaOn : state.s;
      base.set(c.group.position.x, ((extra ? poses.cta.y : state.y) * h) / 2 - 1.75 * sc, 0).project(s3.camera);
      ui.labels[k].style.transform = `translate(${((base.x + 1) / 2) * innerWidth}px, ${((1 - base.y) / 2) * innerHeight}px) translate(-50%, 6px)`;
      ui.labels[k].classList.toggle('is-hot', hot === k);
    });

    // linhas: aparecem com a lata virada no ingredientes e somem (fade) fora dele.
    // 0,12 rad ≈ 7°: a tabela já está de frente; a margem cobre o fim do scrub sem acender durante o giro
    leadOp += ((wide.matches && sec === 'ingredientes' && Math.abs(state.turn - BACK) < 0.12 ? 1 : 0) - leadOp) * (reduced ? 1 : Math.min(dt * 6, 1));
    paint('leadOp', leadOp > 0.01 ? leadOp.toFixed(2) : '0', (v) => { lead.style.opacity = v; });
    if (leadOp > 0.01) {
      const sr = secEl.getBoundingClientRect(), ox = Math.round(sr.left), oy = Math.round(sr.top);
      for (let i = 0; i < 3; i++) {
        hero.labelPoint(ROWS[i][0], ROWS[i][1], lp, ln);
        const back = ln.dot(eye.copy(s3.camera.position).sub(lp)) <= 0;
        lp.project(s3.camera);
        const x = Math.round(((lp.x + 1) / 2) * innerWidth * 2) / 2, y = Math.round(((1 - lp.y) / 2) * innerHeight * 2) / 2;
        const p = Math.round(state.lines[i].p * 1000) / 1000, v = last[i];
        // só escreve no DOM quando algo mudou (quadro parado = zero escritas)
        if (v[0] === x && v[1] === y && v[2] === ox && v[3] === oy && v[4] === p && v[5] === back) continue;
        v[0] = x; v[1] = y; v[2] = ox; v[3] = oy; v[4] = p; v[5] = back;
        const b = box[i], [line, dot] = leadG[i].children;
        // o 160 (coluna esquerda) passa pelo vão entre os cards da direita; os outros saem da borda direita do próprio card
        const gy = oy + (box[1][3] + box[2][1]) / 2;
        const from = i === 0 ? `${ox + b[2]},${gy} ${ox + box[1][2]},${gy}` : `${ox + b[2]},${Math.min(Math.max(y, oy + b[1] + 20), oy + b[3] - 20)}`;
        leadG[i].style.visibility = back ? 'hidden' : '';
        line.setAttribute('points', `${from} ${x},${y}`);
        line.style.strokeDashoffset = 1 - p;
        dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.style.opacity = Math.max(0, (p - 0.85) / 0.15);
      }
    }

    hero.update(dt, t);
    s3.render();
  });
}

start();
