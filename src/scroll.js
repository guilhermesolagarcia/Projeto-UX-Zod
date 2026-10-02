import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export const POSES = {
  desktop: { hero: { x: 0.42, y: -0.08, s: 0.85 }, sabores: { x: 0, y: 0.02, s: 1 }, ingredientes: { x: 0.68, y: 0.35, s: 0.45 }, cta: { x: 0.6, y: -0.15, s: 0.55 } },
  mobile: { hero: { x: 0.1, y: -0.42, s: 0.6 }, sabores: { x: 0, y: 0.25, s: 0.75 }, ingredientes: { x: 0.6, y: 0.62, s: 0.3 }, cta: { x: 0.6, y: -0.35, s: 0.4 } },
};

export function createState(mobile) {
  return { ...POSES[mobile ? 'mobile' : 'desktop'].hero, drop: 0, open: 0, flavorP: 0, cta: 0, section: 'hero' };
}

export function initScroll({ state, mobile, reducedMotion }) {
  const poses = POSES[mobile ? 'mobile' : 'desktop'];
  const smoother = reducedMotion ? null : ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1 });
  const scrollTo = (y) => (smoother ? smoother.scrollTo(y, true) : window.scrollTo({ top: y, behavior: 'auto' }));

  for (const id of ['hero', 'sabores', 'ingredientes', 'cta']) {
    ScrollTrigger.create({ trigger: `#${id}`, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) state.section = id; } });
  }

  const flavors = ScrollTrigger.create({ trigger: '#sabores', start: 'top top', end: '+=300%', pin: true, onUpdate: (self) => { state.flavorP = self.progress; } });

  if (!reducedMotion) {
    // abertura: a lata cai quicando, o título sobe palavra por palavra e o lacre abre
    state.drop = 1;
    gsap.timeline({ delay: 0.2 })
      .to(state, { drop: 0, duration: 1.3, ease: 'bounce.out' })
      .from('.hero .w > span', { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.3)
      .to(state, { open: 1, duration: 0.25, ease: 'back.out(3)' }, '+=0.15');

    // hero → sabores: a lata vai pro centro
    gsap.to(state, { ...poses.sabores, ease: 'none', scrollTrigger: { trigger: '#sabores', start: 'top bottom', end: 'top top', scrub: true } });
    // sabores → ingredientes: encolhe e vai pro canto
    gsap.to(state, { ...poses.ingredientes, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#ingredientes', start: 'top bottom', end: 'top 20%', scrub: true } });
    // ingredientes → CTA: volta e as outras três latas aparecem
    gsap.to(state, { ...poses.cta, cta: 1, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'top top', scrub: true } });

    gsap.from('.card', { y: 60, opacity: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 75%' } });
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count), o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 80%' }, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
    });
  }

  // links internos (#sabores, #cta…) usam a rolagem suave
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    if (href === '#sabores') scrollTo(flavors.start);
    else scrollTo(smoother ? target : target.getBoundingClientRect().top + window.scrollY);
  }));

  function goToFlavor(i, count) {
    scrollTo(flavors.start + (flavors.end - flavors.start) * (i / (count - 1)));
  }

  return { goToFlavor };
}
