import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const POSES = {
  desktop: { hero: { x: 0.42, y: -0.08, s: 0.85 }, sabores: { x: 0, y: 0.02, s: 1 }, ingredientes: { x: 0.68, y: 0.35, s: 0.45 }, cta: { x: 0.6, y: -0.15, s: 0.55 } },
  mobile: { hero: { x: 0.25, y: -0.42, s: 0.6 }, sabores: { x: 0, y: 0.25, s: 0.75 }, ingredientes: { x: 0.6, y: 0.62, s: 0.3 }, cta: { x: 0.6, y: -0.35, s: 0.4 } },
};

export function createState(mobile) {
  return { ...POSES[mobile ? 'mobile' : 'desktop'].hero, drop: 0, open: 0, flavorP: 0, cta: 0, section: 'hero' };
}

export function initScroll({ state, mobile, reducedMotion, onOpen }) {
  const poses = POSES[mobile ? 'mobile' : 'desktop'];

  for (const id of ['hero', 'sabores', 'ingredientes', 'cta']) {
    ScrollTrigger.create({ trigger: `#${id}`, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) state.section = id; } });
  }

  const flavors = ScrollTrigger.create({ trigger: '#sabores', start: 'top top', end: '+=300%', pin: true, onUpdate: (self) => { state.flavorP = self.progress; } });

  function goToFlavor(i, count) {
    const y = flavors.start + (flavors.end - flavors.start) * (i / (count - 1));
    window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function replayOpen() { onOpen(); }

  return { goToFlavor, replayOpen, poses };
}
