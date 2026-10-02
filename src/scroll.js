import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// turn: giro extra da lata; no ingredientes mostra o verso (tabela nutricional), no CTA volta pra frente
export const BACK = 2.26; // ângulo em que a tabela (u ≈ 0,14 do rótulo) fica de frente pra câmera
export const POSES = {
  desktop: { hero: { x: 0.42, y: -0.08, s: 0.85, turn: 0 }, sabores: { x: 0.28, y: 0.02, s: 1, turn: 0 }, ingredientes: { x: 0.62, y: 0, s: 1.1, turn: BACK }, cta: { x: 0.54, y: -0.48, s: 0.4, turn: Math.PI * 2 }, slots: [-0.54, -0.18, 0.18] },
  mobile: { hero: { x: 0.1, y: -0.42, s: 0.6, turn: 0 }, sabores: { x: 0, y: 0.25, s: 0.75, turn: 0 }, ingredientes: { x: 0.78, y: 0.68, s: 0.18, turn: BACK }, cta: { x: 0.66, y: -0.5, s: 0.24, turn: Math.PI * 2 }, slots: [-0.66, -0.22, 0.22] },
};

const narrow = matchMedia('(max-width: 768px)'); // mesma query do CSS
export const currentPoses = () => POSES[narrow.matches ? 'mobile' : 'desktop'];
const TAIL = 0.15; // fim do pin em que o último sabor fica parado antes da página seguir

export function createState() {
  return { ...currentPoses().hero, drop: 0, open: 0, flavorP: 0, cta: 0, vel: 0, section: 'hero', lines: [{ p: 1 }, { p: 1 }, { p: 1 }] };
}

export function initScroll({ state, reducedMotion }) {
  const smoother = reducedMotion ? null : ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.6 });
  const scrollTo = (y) => (smoother ? smoother.scrollTo(y, true) : window.scrollTo({ top: y, behavior: 'auto' }));

  // o pin vem antes dos triggers de seção: sem ScrollSmoother eles precisam medir já com o espaçador do pin
  const flavors = ScrollTrigger.create({ trigger: '#sabores', start: 'top top', end: '+=600%', pin: true, onUpdate: (self) => { state.flavorP = Math.min(self.progress / (1 - TAIL), 1); } });

  // em #sabores o trigger é o espaçador do pin (700% de altura), senão a seção só valeria nos primeiros 100%
  for (const id of ['hero', 'sabores', 'ingredientes', 'cta']) {
    ScrollTrigger.create({ trigger: id === 'sabores' ? flavors.pin.parentNode : `#${id}`, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) state.section = id; } });
  }

  if (!reducedMotion) {
    // velocidade da rolagem normalizada (-1..1); main.js faz decair a 0 quando a rolagem para
    ScrollTrigger.create({ onUpdate: (self) => { state.vel = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500); } });

    // abertura: a lata cai quicando, o título sobe palavra por palavra e o lacre abre
    state.drop = 1;
    gsap.timeline({ delay: 0.2 })
      .to(state, { drop: 0, duration: 1.3, ease: 'bounce.out' })
      .from('.hero .w > span', { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.3)
      .to(state, { open: 1, duration: 0.25, ease: 'back.out(3)' }, '+=0.15');

    // poses da lata por largura; refeitas quando a tela cruza 768px
    gsap.matchMedia().add({ narrow: '(max-width: 768px)', wide: '(min-width: 769px)' }, () => {
      const p = currentPoses();
      const scrub = (trigger, start, end) => ({ trigger, start, end, scrub: true });
      // hero → sabores: a lata vai pro centro
      gsap.fromTo(state, { ...p.hero }, { ...p.sabores, ease: 'none', scrollTrigger: scrub('#sabores', 'top bottom', 'top top') });
      // sabores → ingredientes: encolhe e vai pro canto
      gsap.fromTo(state, { ...p.sabores }, { ...p.ingredientes, ease: 'none', immediateRender: false, scrollTrigger: scrub('#ingredientes', 'top bottom', 'top 20%') });
      // ingredientes → CTA: desce pra fileira e as outras três latas aparecem
      gsap.fromTo(state, { ...p.ingredientes, cta: 0 }, { ...p.cta, cta: 1, ease: 'none', immediateRender: false, scrollTrigger: scrub('#cta', 'top bottom', 'top top') });
    });

    gsap.from('.card', { y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 75%' } });
    // linhas card → tabela: esperam a lata terminar de virar (pose em "top 20%") e se desenham na ordem dos cards
    gsap.fromTo(state.lines, { p: 0 }, { p: 1, stagger: 0.15, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: '#ingredientes', start: 'top 20%' } });
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
    scrollTo(flavors.start + (flavors.end - flavors.start) * (1 - TAIL) * (i / (count - 1)));
  }

  return { goToFlavor };
}
