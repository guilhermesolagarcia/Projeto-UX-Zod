# Landing page de energético 3D: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a landing page de uma marca fictícia de energético em que uma lata tallboy 3D acompanha o scroll, troca de sabor com transição líquida e passa por hero, sabores, ingredientes e CTA.

**Architecture:** Página estática servida pelo Vite. O HTML tem as 4 seções reais por cima de um `<canvas>` Three.js fixo e de uma camada de fundo fixa. O `scroll.js` (GSAP + ScrollTrigger + ScrollSmoother) escreve num objeto de estado simples (`state`). O `main.js` lê esse estado a cada quadro e posiciona a lata, troca os rótulos e pinta o fundo. Os rótulos são desenhados em canvas 2D (portados do protótipo aprovado), e a troca de sabor é um shader que mistura dois rótulos.

**Tech Stack:** Vite 7, Three.js 0.169, GSAP 3.13 (ScrollTrigger, ScrollSmoother), JavaScript puro (ES modules), testes com `node --test` (sem dependência extra).

**Spec:** `docs/superpowers/specs/2026-10-01-landing-energetico-design.md`
**Referências visuais:** `docs/superpowers/specs/referencias/latas-prototipo.html` (rótulos e lata aprovados) e `docs/superpowers/specs/referencias/scroll-prototipo.html`

## Global Constraints

- Sem framework de UI. Dependências de runtime: só `three` e `gsap`. Dependência de dev: só `vite`.
- Fontes: Unbounded 900 (títulos grandes e nomes nas latas), Bricolage Grotesque 400/500/600/800 (resto), Shrikhand (só o nome da Watermelon Wave na lata). Todas pelo Google Fonts.
- Nome da marca provisório `SUA MARCA`, definido **só** em `src/flavors.js` (`BRAND`).
- Cores base: creme `#F4F1EA`, tinta `#111111`.
- Sabores, na ordem: Tropical Passion (`#FFB800`/`#FF5A1F`), Watermelon Wave (`#FF4D6D`/`#1FA35B`), Lime Volt (`#B6F500`/`#0E7C3A`), Grape Midnight (`#A57CFF`/`#24135F`).
- Textos da página em português. Nomes de sabores e textos da lata em inglês.
- Lata tallboy 473 ml. O lacre segue o path `LACRE` da spec (seção 2.3).
- Som desligado por padrão, e só toca depois que a pessoa ativa.
- Celular: pixel ratio máximo 1.5, menos partículas, sem cursor customizado.
- `prefers-reduced-motion: reduce`: nenhuma animação. A lata fica parada e o conteúdo aparece pronto.
- Sem WebGL: imagem estática `public/lata-fallback.png` no lugar do canvas.
- Commits em português no estilo conventional commits, **sem** linhas de coautoria ou "Generated with".
- Meta de 60fps no desktop durante a seção de sabores.

## Review Focus

1. **Redimensionar a janela ou girar o celular no meio do scroll:** o canvas acompanha o novo tamanho sem esticar, e a lata continua na posição certa da seção atual (Task 3: `resize` do scene; Task 6: `ScrollTrigger.refresh` é automático, conferir no passo de verificação).
2. **Fontes ainda não carregadas quando os rótulos são desenhados:** se desenhar antes, a lata sai com fonte do sistema. Todo desenho de rótulo espera `loadLabelFonts()` (Task 2: o preview só desenha depois do `await`; Task 5: o `main.js` faz `await loadLabelFonts()` antes de criar a lata).
3. **Pular vários sabores de uma vez pelas bolinhas ou com scroll rápido:** `from`/`to` mudam juntos num quadro só. O rótulo tem que mostrar o par certo, sem ficar preso no anterior (Task 1: teste de saltos em `flavorState`; Task 3: `setFlavors` aceita qualquer par).
4. **Ativar o som antes de qualquer interação:** o navegador bloqueia áudio sem gesto. O `AudioContext` só nasce no clique do botão, e `play()` sem som ativo não faz nada nem lança erro (Task 4: teste em node do `createFizz`).
5. **Tela de celular estreita:** o texto do hero e dos sabores não pode ficar embaixo da lata. No celular a lata usa poses próprias (menor e mais baixa) (Task 5: `POSES.mobile`; Task 7: verificação em 390×844).

---

## Estrutura de arquivos

```
package.json            → scripts dev/build/preview/test, deps
index.html              → as 4 seções + fundo fixo + canvas + fallback
public/lata-fallback.png→ imagem estática da lata (gerada na Task 7)
src/
  flavors.js            → BRAND + FLAVORS (dados puros)
  scrollState.js        → flavorState() e currentFlavor() (funções puras, testadas)
  labels.js             → desenho dos 4 rótulos em canvas (portado do protótipo)
  scene.js              → renderer, câmera, luzes, ambiente, partículas
  can.js                → lata: geometria, shader da troca líquida, lacre, condensação
  sfx.js                → som "tssss" sintetizado (WebAudio)
  cursor.js             → cursor na cor do sabor
  scroll.js             → estado, poses, intro, ScrollTrigger, ScrollSmoother
  main.js               → liga tudo
  style.css             → layout, tokens, responsivo
tests/
  scrollState.test.js
  sfx.test.js
tools/
  labels.html           → preview dos 4 rótulos (só dev)
  can.html              → preview da lata (só dev, e gera o fallback)
  shot.sh               → screenshot headless pra verificação visual
```

**Desvio consciente da spec:** a spec previa `public/sfx/` com um arquivo de som. Aqui o "tssss" é sintetizado em `src/sfx.js` (ruído filtrado), o que evita um asset binário e direitos de áudio. O comportamento pedido não muda: o som é opcional e fica desligado por padrão.

---

### Task 0: Base do projeto (Vite, dados, HTML e CSS)

**Files:**
- Create: `package.json`, `index.html`, `src/style.css`, `src/flavors.js`, `src/main.js`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `BRAND: string`, `FLAVORS: Array<{ title, name, l1, l2, a, b, bdeep, inkB, desc }>` em `src/flavors.js`. Seletores de DOM usados depois: `#bg .bg-a`, `#bg .bg-b`, `#scene`, `.fallback-can`, `.sound`, `.flavor-name`, `.flavor-desc`, `.flavor-num`, `.dots button`, `[data-brand]`, `[data-count]`, `.card`, `.hero .w > span`, `#smooth-wrapper`, `#smooth-content`, seções `#hero`, `#sabores`, `#ingredientes`, `#cta`.

- [ ] **Step 1: Criar a branch de trabalho**

```bash
git checkout -b feat/landing-energetico
```

- [ ] **Step 2: Criar `package.json` e instalar**

```json
{
  "name": "landing-energetico",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test tests/"
  }
}
```

```bash
npm install three@^0.169.0 gsap@^3.13.0
npm install -D vite@^7
```

- [ ] **Step 3: Atualizar `.gitignore`**

Conteúdo final do arquivo:

```
.superpowers/
node_modules/
dist/
```

- [ ] **Step 4: Criar `src/flavors.js`**

```js
export const BRAND = 'SUA MARCA';

export const FLAVORS = [
  { title: 'Tropical Passion', name: 'TROPICAL PASSION', l1: 'TROPICAL', l2: 'PASSION', a: '#FFB800', b: '#FF5A1F', bdeep: '#E0400A', inkB: '#111', desc: 'Manga e maracujá num pôr do sol que cabe na lata.' },
  { title: 'Watermelon Wave', name: 'WATERMELON WAVE', l1: 'WATERMELON', l2: 'WAVE', a: '#FF4D6D', b: '#1FA35B', bdeep: '#15824A', inkB: '#F4F1EA', desc: 'Melancia gelada com cara de amanhecer na praia.' },
  { title: 'Lime Volt', name: 'LIME VOLT', l1: 'LIME', l2: 'VOLT', a: '#B6F500', b: '#0E7C3A', bdeep: '#0A5F2C', inkB: '#F4F1EA', desc: 'Limão cítrico que dá choque de energia.' },
  { title: 'Grape Midnight', name: 'GRAPE MIDNIGHT', l1: 'GRAPE', l2: 'MIDNIGHT', a: '#A57CFF', b: '#24135F', bdeep: '#1A0D47', inkB: '#F4F1EA', desc: 'Uva intensa pra quem rende até a meia-noite.' },
];
```

- [ ] **Step 5: Criar `index.html`**

```html
<!doctype html>
<html lang="pt-BR" data-section="hero">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Energia que tem cor</title>
  <meta name="description" content="Energético zero açúcar em quatro sabores: Tropical Passion, Watermelon Wave, Lime Volt e Grape Midnight." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,800&family=Unbounded:wght@900&family=Shrikhand&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="bg" aria-hidden="true">
    <div class="bg-a"></div>
    <div class="bg-b"><svg class="bg-wave" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 20 Q150 0 300 20 T600 20 T900 20 T1200 20 V40 H0Z" /></svg></div>
  </div>
  <canvas id="scene" aria-hidden="true"></canvas>
  <img class="fallback-can" src="/lata-fallback.png" alt="Lata Tropical Passion" width="600" height="900" />

  <header class="nav">
    <a class="logo" href="#hero" data-brand>SUA MARCA</a>
    <nav><a href="#sabores">Sabores</a><a href="#ingredientes">Ingredientes</a></nav>
    <div class="nav-actions">
      <button class="sound" type="button" aria-pressed="false">Som: off</button>
      <a class="pill" href="#cta">Peça o seu</a>
    </div>
  </header>

  <div id="smooth-wrapper"><div id="smooth-content"><main>
    <section id="hero" class="section hero">
      <div class="copy">
        <h1 class="display"><span class="w"><span>Energia</span></span> <span class="w"><span>que</span></span> <span class="w"><span>tem</span></span> <span class="w"><span>cor.</span></span></h1>
        <p class="lead">Quatro sabores, zero açúcar e 160mg de cafeína pra você render o dia inteiro.</p>
        <a class="btn" href="#sabores">Conheça os sabores →</a>
      </div>
    </section>

    <section id="sabores" class="section sabores">
      <div class="flavor-info" aria-live="polite">
        <p class="eyebrow">Sabor <span class="flavor-num">1</span>/4</p>
        <h2 class="display flavor-name">Tropical Passion</h2>
        <p class="flavor-desc">Manga e maracujá num pôr do sol que cabe na lata.</p>
      </div>
      <nav class="dots" aria-label="Escolher sabor">
        <button type="button" aria-label="Tropical Passion" aria-current="true"></button>
        <button type="button" aria-label="Watermelon Wave" aria-current="false"></button>
        <button type="button" aria-label="Lime Volt" aria-current="false"></button>
        <button type="button" aria-label="Grape Midnight" aria-current="false"></button>
      </nav>
    </section>

    <section id="ingredientes" class="section ingredientes">
      <h2 class="section-title">O que tem dentro</h2>
      <div class="cards">
        <article class="card"><p class="display num"><span data-count="160">160</span><small>mg</small></p><h3>Cafeína</h3><p>Energia que chega rápido e não derruba depois.</p></article>
        <article class="card"><p class="display num"><span data-count="0">0</span><small>g</small></p><h3>Açúcar</h3><p>Doce de fruta de verdade, sem açúcar adicionado.</p></article>
        <article class="card"><p class="display num">B<span data-count="12">12</span></p><h3>Vitaminas</h3><p>Complexo B pra mente acordada e foco no que importa.</p></article>
      </div>
    </section>

    <section id="cta" class="section cta">
      <h2 class="display">Peça o seu.</h2>
      <p class="lead">Quatro sabores, uma energia que tem cor.</p>
      <a class="btn btn-light" href="#hero">Quero experimentar →</a>
      <footer class="footer"><span data-brand>SUA MARCA</span> · Projeto fictício de portfólio · 2026</footer>
    </section>
  </main></div></div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Criar `src/style.css`**

```css
:root {
  --creme: #F4F1EA;
  --ink: #111111;
  --flavor: #FFB800;
  --font-display: 'Unbounded', system-ui, sans-serif;
  --font-body: 'Bricolage Grotesque', system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; }
html { background: var(--creme); }
body { font-family: var(--font-body); color: var(--ink); -webkit-font-smoothing: antialiased; }

#bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
.bg-a, .bg-b { position: absolute; inset: 0; }
.bg-a { background-color: #FFB800; transition: background-color .6s ease; }
[data-section="sabores"] .bg-a { transition: none; }
.bg-b { transform: translateY(105%); }
.bg-wave { position: absolute; left: 0; top: -39px; width: 100%; height: 40px; fill: currentColor; }
#scene { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 1; pointer-events: none; }
.fallback-can { display: none; }
#smooth-wrapper { position: relative; z-index: 2; }

.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px clamp(16px, 4vw, 48px); font-weight: 600; color: var(--ink); transition: color .4s; }
.logo { font-family: var(--font-display); font-weight: 900; font-size: 18px; letter-spacing: -0.02em; color: inherit; text-decoration: none; }
.nav nav { display: flex; gap: 24px; }
.nav a { color: inherit; text-decoration: none; }
.nav-actions { display: flex; align-items: center; gap: 10px; }
.sound { font: 600 14px var(--font-body); color: inherit; background: transparent; border: 2px solid currentColor; border-radius: 99px; padding: 8px 14px; cursor: pointer; }
.pill, .btn { display: inline-block; background: var(--ink); color: #fff; border-radius: 99px; padding: 10px 18px; font-weight: 600; text-decoration: none; }
.btn { margin-top: 28px; padding: 15px 26px; font-size: 16px; transition: transform .2s; }
.btn:hover { transform: translateY(-2px) scale(1.02); }
.btn-light { background: var(--creme); color: var(--ink); }
[data-section="cta"] .nav { color: var(--creme); }
[data-section="cta"] .pill { background: var(--creme); color: var(--ink); }

.display { font-family: var(--font-display); font-weight: 900; letter-spacing: -0.035em; line-height: .9; }
.section { position: relative; min-height: 100vh; padding: 120px clamp(16px, 6vw, 96px) 64px; }

.hero { display: flex; align-items: center; }
.hero .copy { max-width: 560px; }
.hero h1 { font-size: clamp(48px, 8vw, 112px); }
.w { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .06em; }
.w > span { display: inline-block; }
.lead { max-width: 380px; margin-top: 22px; font-size: clamp(17px, 1.6vw, 21px); line-height: 1.45; }

.sabores { height: 100vh; }
.flavor-info { position: absolute; left: clamp(16px, 6vw, 96px); bottom: 64px; max-width: 420px; }
.eyebrow { font-weight: 800; font-size: 14px; letter-spacing: .12em; text-transform: uppercase; }
.flavor-name { margin-top: 10px; font-size: clamp(40px, 6vw, 88px); }
.flavor-desc { margin-top: 14px; font-size: 18px; line-height: 1.45; }
.dots { position: absolute; right: clamp(16px, 4vw, 48px); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 12px; }
.dots button { width: 14px; height: 14px; padding: 0; border-radius: 50%; border: 2px solid var(--ink); background: transparent; cursor: pointer; transition: transform .2s, background .2s; }
.dots button[aria-current="true"] { background: var(--ink); transform: scale(1.25); }

.ingredientes { display: flex; flex-direction: column; justify-content: center; }
.section-title { max-width: 60%; font-family: var(--font-display); font-weight: 900; font-size: clamp(32px, 4vw, 56px); letter-spacing: -0.03em; }
.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; max-width: 900px; margin-top: 40px; }
.card { background: #fff; border-radius: 20px; padding: 26px; }
.num { font-size: clamp(44px, 5vw, 64px); }
.num small { margin-left: 4px; font-size: .4em; }
.card h3 { margin-top: 10px; font-size: 19px; font-weight: 800; }
.card p:last-child { margin-top: 6px; font-size: 15px; line-height: 1.45; opacity: .75; }

.cta { display: flex; flex-direction: column; justify-content: center; color: var(--creme); }
.cta h2 { font-size: clamp(56px, 9vw, 128px); }
.footer { position: absolute; left: clamp(16px, 6vw, 96px); bottom: 28px; font-size: 14px; opacity: .6; }

.cursor { position: fixed; left: 0; top: 0; z-index: 100; width: 18px; height: 18px; border-radius: 50%; background: var(--flavor); pointer-events: none; transition: width .25s, height .25s, opacity .25s, background-color .4s; }
.cursor.is-hover { width: 54px; height: 54px; opacity: .55; }
.has-cursor, .has-cursor a, .has-cursor button { cursor: none; }

.no-webgl #scene { display: none; }
.no-webgl .fallback-can { display: block; position: fixed; right: 6vw; top: 50%; z-index: 1; height: 70vh; width: auto; transform: translateY(-50%); pointer-events: none; }

@media (max-width: 768px) {
  .nav nav { display: none; }
  .hero { align-items: flex-start; padding-top: 110px; }
  .hero .copy { max-width: 100%; }
  .section-title { max-width: 100%; }
  .cards { grid-template-columns: 1fr; }
  .flavor-info { right: 16px; bottom: 100px; }
  .dots { top: auto; bottom: 64px; right: 16px; transform: none; flex-direction: row; }
  .no-webgl .fallback-can { top: auto; bottom: 4vh; right: 50%; height: 42vh; transform: translateX(50%); }
}
@media (prefers-reduced-motion: reduce) {
  .bg-a, .btn, .nav, .dots button { transition: none; }
}
```

- [ ] **Step 7: Criar `src/main.js` provisório (só preenche a marca)**

```js
import './style.css';
import { BRAND } from './flavors.js';

document.querySelectorAll('[data-brand]').forEach((el) => { el.textContent = BRAND; });
```

- [ ] **Step 8: Verificar o build**

Run: `npm run build`
Expected: termina com `✓ built in ...` e sem erros. Cria `dist/index.html`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore index.html src/
git commit -m "feat: base do projeto com Vite, seções em HTML e estilos"
```

---

### Task 1: Lógica "posição do scroll → sabor" (TDD)

**Files:**
- Create: `src/scrollState.js`
- Test: `tests/scrollState.test.js`

**Interfaces:**
- Produces:
  - `flavorState(p: number, count: number) → { from: number, to: number, mix: number }`. O `p` é o progresso da seção de sabores (0 a 1). Em cada trecho entre dois sabores, os primeiros 60% seguram o sabor atual (`mix = 0`) e os 40% finais fazem a troca (`mix` de 0 a 1). Em `p = 1`: `{ from: count-1, to: count-1, mix: 0 }`. Valores fora de 0–1 são limitados, e `NaN` vira 0.
  - `currentFlavor({ from, to, mix }) → number`: devolve `to` quando `mix >= 0.5`, senão `from`.

- [ ] **Step 1: Escrever os testes que falham**

`tests/scrollState.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flavorState, currentFlavor } from '../src/scrollState.js';

test('começo da seção mostra o primeiro sabor parado', () => {
  assert.deepEqual(flavorState(0, 4), { from: 0, to: 1, mix: 0 });
});

test('fim da seção mostra o último sabor parado', () => {
  assert.deepEqual(flavorState(1, 4), { from: 3, to: 3, mix: 0 });
});

test('cada sabor tem um ponto exato de repouso', () => {
  assert.deepEqual(flavorState(1 / 3, 4), { from: 1, to: 2, mix: 0 });
  assert.deepEqual(flavorState(2 / 3, 4), { from: 2, to: 3, mix: 0 });
});

test('a troca acontece só nos 40% finais de cada trecho', () => {
  assert.equal(flavorState(0.5 / 3, 4).mix, 0);
  assert.equal(flavorState(0.6 / 3, 4).mix, 0);
  assert.ok(Math.abs(flavorState(0.8 / 3, 4).mix - 0.5) < 1e-9);
});

test('saltos grandes vão direto pro par certo', () => {
  const s = flavorState(0.95, 4);
  assert.equal(s.from, 2);
  assert.equal(s.to, 3);
  assert.ok(s.mix > 0.5 && s.mix <= 1);
});

test('entradas fora do intervalo são limitadas', () => {
  assert.deepEqual(flavorState(-2, 4), flavorState(0, 4));
  assert.deepEqual(flavorState(7, 4), flavorState(1, 4));
  assert.deepEqual(flavorState(NaN, 4), flavorState(0, 4));
});

test('um sabor só nunca troca', () => {
  assert.deepEqual(flavorState(0.7, 1), { from: 0, to: 0, mix: 0 });
});

test('currentFlavor troca na metade da transição', () => {
  assert.equal(currentFlavor({ from: 1, to: 2, mix: 0.49 }), 1);
  assert.equal(currentFlavor({ from: 1, to: 2, mix: 0.5 }), 2);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `src/scrollState.js`.

- [ ] **Step 3: Implementar**

`src/scrollState.js`:

```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 8` e `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/scrollState.js tests/scrollState.test.js
git commit -m "feat: lógica que converte o scroll em sabor e progresso da troca"
```

---

### Task 2: Rótulos das latas (porte do protótipo)

**Files:**
- Create: `src/labels.js`, `tools/labels.html`, `tools/shot.sh`

**Interfaces:**
- Consumes: `BRAND`, `FLAVORS` de `src/flavors.js`.
- Produces:
  - `LACRE: string` (o path do símbolo)
  - `loadLabelFonts(): Promise` (resolve quando as fontes dos rótulos carregaram)
  - `drawLabelMaps(index: number) → { color, rough, metal, bump }`: quatro `HTMLCanvasElement` de 2048×1432, em cache por índice. O `bump` já vem desfocado.

- [ ] **Step 1: Montar `src/labels.js` a partir do protótipo aprovado**

O código de desenho é copiado **sem alterações** do protótipo (linhas 67–108: constantes, `PASS`, `seeded`, `fitFont`, `lacre`, `backInfo`; linhas 160–310: `drawV3`, `topBottom`, `emblem`, `mark`, `drawTropical`, `drawWatermelon`, `drawGrape` e o array `DRAW`). `drawV1`/`drawV2` ficam de fora (eram layouts rejeitados).

```bash
{
cat <<'EOF'
// Rótulos das latas: um layout por sabor, desenhado em 4 passes (cor, rugosidade, metal, relevo).
// O código de desenho veio de docs/superpowers/specs/referencias/latas-prototipo.html.
import { BRAND, FLAVORS } from './flavors.js';

export const LACRE = 'M50 6 C72 6 82 20 82 38 V62 C82 82 70 94 50 94 C30 94 18 82 18 62 V38 C18 20 28 6 50 6Z M50 20 C40.6 20 33 26.3 33 34 C33 41.7 40.6 48 50 48 C59.4 48 67 41.7 67 34 C67 26.3 59.4 20 50 20Z';
const lacrePath = new Path2D(LACRE);
const WM_FONT = '400 {s}px Shrikhand';

export function loadLabelFonts() {
  return Promise.all(['900 100px Unbounded', '800 100px "Bricolage Grotesque"', '500 40px "Bricolage Grotesque"', '400 100px Shrikhand'].map((f) => document.fonts.load(f)));
}

EOF
sed -n '67,108p;160,310p' docs/superpowers/specs/referencias/latas-prototipo.html
cat <<'EOF'

const cache = new Map();
export function drawLabelMaps(index) {
  if (cache.has(index)) return cache.get(index);
  const f = FLAVORS[index], out = {};
  for (const pass of ['color', 'rough', 'metal', 'bump']) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    DRAW[index](cv.getContext('2d'), PASS[pass](f), f, pass);
    if (pass === 'bump') {
      const b = document.createElement('canvas'); b.width = W; b.height = H;
      const bg = b.getContext('2d'); bg.filter = 'blur(3px)'; bg.drawImage(cv, 0, 0);
      out.bump = b;
    } else out[pass] = cv;
  }
  cache.set(index, out);
  return out;
}
EOF
} > src/labels.js
sed -i "s/'SUA MARCA'/BRAND/g; s/drawV3/drawLime/g" src/labels.js
```

- [ ] **Step 2: Conferir o porte**

Run: `grep -c "SUA MARCA\|drawV1\|drawV2\|THREE" src/labels.js; grep -c "drawLime" src/labels.js; node --check src/labels.js`
Expected: primeira linha `0`, segunda `2`, e o `node --check` sem erro.

- [ ] **Step 3: Criar o preview `tools/labels.html`**

```html
<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Unbounded:wght@900&family=Shrikhand&display=swap" rel="stylesheet">
<style>body{margin:0;background:#333;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}canvas{width:100%;display:block}</style>
</head><body>
<script type="module">
import { loadLabelFonts, drawLabelMaps } from '/src/labels.js';
await loadLabelFonts();
for (let i = 0; i < 4; i++) document.body.appendChild(drawLabelMaps(i).color);
document.title = 'ready';
</script>
</body></html>
```

- [ ] **Step 4: Criar o helper de screenshot `tools/shot.sh`**

```bash
#!/usr/bin/env bash
# uso: tools/shot.sh <url> <saida.png> [LxA]
# Tira um print headless (WebGL via SwiftShader) de uma página servida pelo `npm run dev`.
set -euo pipefail
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --default-background-color=00000000 --window-size="${3:-1600,1150}" --virtual-time-budget=12000 \
  --screenshot="$2" "$1" 2>/dev/null
echo "salvo em $2"
```

- [ ] **Step 5: Verificar visualmente**

Em outro terminal (ou em background): `npm run dev -- --port 5173 --strictPort`
Run: `bash tools/shot.sh "http://localhost:5173/tools/labels.html" /tmp/labels.png`
Expected: abrir `/tmp/labels.png` e ver os 4 rótulos **iguais** aos aprovados em `docs/superpowers/specs/referencias/latas-prototipo.html`: pôr do sol com palmeiras, "estratos" com WATERMELON em Shrikhand e lacre rosa, onda da Lime, meia-noite da Grape com o lacre na lua. Faixas com `SUA MARCA` nas fontes certas (não pode aparecer fonte serifada do sistema).

- [ ] **Step 6: Commit**

```bash
git add src/labels.js tools/labels.html tools/shot.sh
git commit -m "feat: rótulos das quatro latas portados do protótipo aprovado"
```

---

### Task 3: Núcleo 3D (cena, partículas e lata com troca líquida)

**Files:**
- Create: `src/scene.js`, `src/can.js`, `tools/can.html`

**Interfaces:**
- Consumes: `drawLabelMaps`, `LACRE`, `loadLabelFonts` de `src/labels.js`.
- Produces:
  - `createScene(canvas: HTMLCanvasElement, { mobile: boolean }) → { renderer, scene, camera, viewSize(): { w, h }, burst(origin: THREE.Vector3, colors: string[], opts?: { up?: boolean }), render(dt: number) }`. O `viewSize` é o tamanho visível em unidades do mundo no plano z = 0.
  - `createCan({ condensation?: boolean }) → { group: THREE.Group, setFlavors(from: number, to: number, mix: number), setOpen(p: number), update(dt: number, t: number) }`. A lata tem cerca de 3,4 unidades de altura, centrada na origem.

- [ ] **Step 1: Criar `src/scene.js`**

```js
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createScene(canvas, { mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const key = new THREE.DirectionalLight('#fff', 2.2); key.position.set(4, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#fff', 3); rim.position.set(-5, 2, -4); scene.add(rim);

  // partículas: um InstancedMesh reaproveitado por todas as explosões
  const COUNT = mobile ? 40 : 120;
  const pMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 1), new THREE.MeshStandardMaterial({ roughness: 0.4 }), COUNT);
  pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  pMesh.frustumCulled = false;
  scene.add(pMesh);
  const parts = Array.from({ length: COUNT }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, s: 1 }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < COUNT; i++) pMesh.setColorAt(i, col.set('#ffffff'));

  function burst(origin, colors, { up = false } = {}) {
    parts.forEach((pt, i) => {
      pt.p.copy(origin);
      if (up) pt.v.set((Math.random() - 0.5) * 0.05, 0.06 + Math.random() * 0.08, (Math.random() - 0.5) * 0.05);
      else pt.v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.04 + Math.random() * 0.07);
      pt.life = 1;
      pt.s = (up ? 0.4 : 0.8) + Math.random() * 1.2;
      pMesh.setColorAt(i, col.set(colors[i % colors.length]));
    });
    pMesh.instanceColor.needsUpdate = true;
  }

  function stepParticles(dt) {
    const k = dt * 60;
    parts.forEach((pt, i) => {
      if (pt.life > 0) {
        pt.p.addScaledVector(pt.v, k);
        pt.v.multiplyScalar(Math.pow(0.96, k));
        pt.v.y -= 0.0015 * k;
        pt.life -= 0.012 * k;
      }
      sc.setScalar(Math.max(pt.life, 0) * pt.s);
      m.compose(pt.p, q, sc);
      pMesh.setMatrixAt(i, m);
    });
    pMesh.instanceMatrix.needsUpdate = true;
  }

  function viewSize() {
    const h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return { w: h * camera.aspect, h };
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function render(dt) {
    stepParticles(dt);
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, viewSize, burst, render };
}
```

- [ ] **Step 2: Criar `src/can.js`**

```js
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { drawLabelMaps, LACRE } from './labels.js';

const V = (x, y) => new THREE.Vector2(x, y);
const BODY = [V(0.66, -1.55), V(0.66, 1.35)];
const TOP = [V(0.66, 1.35), V(0.655, 1.42), V(0.6, 1.55), V(0.56, 1.62), V(0.568, 1.665), V(0.574, 1.695), V(0.56, 1.712), V(0.542, 1.70), V(0.53, 1.66), V(0.3, 1.648), V(0, 1.645)];
const BOTTOM = [V(0, -1.6), V(0.3, -1.63), V(0.45, -1.685), V(0.5, -1.70), V(0.58, -1.68), V(0.64, -1.62), V(0.66, -1.55)];

// texturas de rótulo compartilhadas entre todas as latas
const texCache = new Map();
function labelTextures(i) {
  if (texCache.has(i)) return texCache.get(i);
  const c = drawLabelMaps(i);
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const out = { map: tex(c.color, true), rough: tex(c.rough), metal: tex(c.metal), bump: tex(c.bump) };
  texCache.set(i, out);
  return out;
}

let tabGeo = null;
function tabGeometry() {
  if (tabGeo) return tabGeo;
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" d="${LACRE}"/></svg>`);
  tabGeo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(svg.paths[0]), { depth: 3, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 2 });
  tabGeo.center();
  return tabGeo;
}

function dropsTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const g = c.getContext('2d');
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 1024, rad = 1 + r() * r() * 6;
    g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.25})`; g.beginPath(); g.ellipse(x, y, rad, rad * 1.25, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - rad * 0.35, y - rad * 0.4, rad * 0.3, 0, 7); g.fill();
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * 512, y0 = r() * 700, len = 120 + r() * 260, w = 2 + r() * 3;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.35)');
    g.fillStyle = gr; g.fillRect(x, y0, w, len);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x + w / 2, y0 + len, w * 1.4, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let shadowTex = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(0,0,0,.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  return (shadowTex = new THREE.CanvasTexture(c));
}

export function createCan({ condensation = true } = {}) {
  const group = new THREE.Group();
  const inner = new THREE.Group(); inner.rotation.y = Math.PI; group.add(inner); // frente do rótulo (u = 0,5) virada pra câmera

  // troca líquida: o rótulo B sobe por cima do A com uma onda na borda
  const uniforms = { uMix: { value: 0 }, uTime: { value: 0 }, mapB: { value: null }, roughnessMapB: { value: null }, metalnessMapB: { value: null } };
  const bodyMat = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 1, bumpScale: 1.2, clearcoat: 0.7, clearcoatRoughness: 0.18 });
  bodyMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uMix;
uniform float uTime;
uniform sampler2D mapB;
uniform sampler2D roughnessMapB;
uniform sampler2D metalnessMapB;`)
      .replace('#include <map_fragment>', `
float lq = step(vMapUv.y, uMix * 1.12 - 0.06 + 0.025 * sin(vMapUv.x * 18.85 + uTime * 2.0));
diffuseColor *= mix(texture2D(map, vMapUv), texture2D(mapB, vMapUv), lq);`)
      .replace('#include <roughnessmap_fragment>', `
float roughnessFactor = roughness;
roughnessFactor *= mix(texture2D(roughnessMap, vRoughnessMapUv), texture2D(roughnessMapB, vRoughnessMapUv), lq).g;`)
      .replace('#include <metalnessmap_fragment>', `
float metalnessFactor = metalness;
metalnessFactor *= mix(texture2D(metalnessMap, vMetalnessMapUv), texture2D(metalnessMapB, vMetalnessMapUv), lq).b;`);
  };
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(BODY, 128), bodyMat));

  const alu = new THREE.MeshStandardMaterial({ color: '#d6dade', metalness: 1, roughness: 0.26, side: THREE.DoubleSide });
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(TOP, 128), alu));
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(BOTTOM, 128), alu));

  // lacre 3D com dobradiça
  const tabPivot = new THREE.Group(); tabPivot.position.set(0, 1.665, 0); inner.add(tabPivot);
  const tab = new THREE.Mesh(tabGeometry(), new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 1, roughness: 0.22 }));
  tab.scale.setScalar(0.0045); tab.rotation.x = -Math.PI / 2; tab.position.set(0, 0, -0.12);
  tabPivot.add(tab);

  let drops = null;
  if (condensation) {
    drops = dropsTexture();
    const dropMat = new THREE.MeshPhysicalMaterial({ map: drops, transparent: true, depthWrite: false, roughness: 0.08, metalness: 0, clearcoat: 1 });
    inner.add(new THREE.Mesh(new THREE.LatheGeometry([V(0.664, -1.55), V(0.664, 1.35)], 128), dropMat));
  }

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.72; shadow.scale.y = 0.5;
  group.add(shadow);

  const cur = { from: -1, to: -1, bump: null };
  function setFlavors(from, to, mix) {
    if (from !== cur.from) {
      const t = labelTextures(from);
      bodyMat.map = t.map; bodyMat.roughnessMap = t.rough; bodyMat.metalnessMap = t.metal;
      if (cur.from === -1) bodyMat.needsUpdate = true;
      cur.from = from;
    }
    if (to !== cur.to) {
      const t = labelTextures(to);
      uniforms.mapB.value = t.map; uniforms.roughnessMapB.value = t.rough; uniforms.metalnessMapB.value = t.metal;
      cur.to = to;
    }
    uniforms.uMix.value = mix;
    const bump = labelTextures(mix < 0.5 ? from : to).bump;
    if (bump !== cur.bump) { bodyMat.bumpMap = bump; if (!cur.bump) bodyMat.needsUpdate = true; cur.bump = bump; }
  }

  function setOpen(p) { tabPivot.rotation.x = -p * 0.9; }

  function update(dt, t) {
    uniforms.uTime.value = t;
    if (drops) drops.offset.y -= dt * 0.01;
  }

  setFlavors(0, 1, 0);
  return { group, setFlavors, setOpen, update };
}
```

- [ ] **Step 3: Criar o preview `tools/can.html`**

Parâmetros pela URL: `from`, `to`, `mix`, `rot`.

```html
<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Unbounded:wght@900&family=Shrikhand&display=swap" rel="stylesheet">
<style>html,body{margin:0;height:100%;background:transparent}canvas{width:100%;height:100%;display:block}</style>
</head><body><canvas id="c"></canvas>
<script type="module">
import { loadLabelFonts } from '/src/labels.js';
import { createScene } from '/src/scene.js';
import { createCan } from '/src/can.js';
const q = new URLSearchParams(location.search);
await loadLabelFonts();
const s = createScene(document.getElementById('c'), { mobile: false });
const can = createCan({ condensation: q.get('drops') !== '0' });
s.scene.add(can.group);
can.setFlavors(+(q.get('from') ?? 0), +(q.get('to') ?? 1), +(q.get('mix') ?? 0));
can.group.rotation.y = +(q.get('rot') ?? 0);
s.renderer.setAnimationLoop((now) => { can.update(1 / 60, now / 1000); s.render(1 / 60); document.title = 'ready'; });
</script></body></html>
```

- [ ] **Step 4: Verificar visualmente as três situações da troca**

Com o `npm run dev -- --port 5173 --strictPort` rodando:

```bash
bash tools/shot.sh "http://localhost:5173/tools/can.html?from=0&to=1&mix=0" /tmp/can-0.png 600,900
bash tools/shot.sh "http://localhost:5173/tools/can.html?from=0&to=1&mix=0.5" /tmp/can-50.png 600,900
bash tools/shot.sh "http://localhost:5173/tools/can.html?from=0&to=1&mix=1" /tmp/can-100.png 600,900
```

Expected:
- `can-0.png`: tallboy com o rótulo Tropical Passion de frente (TROPICAL legível e não espelhado), tampa de alumínio com o lacre, sombra embaixo e gotinhas de condensação.
- `can-50.png`: metade de baixo com Watermelon Wave e metade de cima com Tropical, separadas por uma linha ondulada.
- `can-100.png`: lata inteira em Watermelon Wave.

Se o texto sair espelhado, troque `inner.rotation.y = Math.PI` por `0` e refaça. Se o shader não compilar (lata preta ou erro no console), confira se os nomes `vMapUv`, `vRoughnessMapUv` e `vMetalnessMapUv` existem na versão do three instalada (`grep -r "vMapUv" node_modules/three/src/renderers/shaders/ShaderChunk/map_fragment.glsl.js`).

- [ ] **Step 5: Commit**

```bash
git add src/scene.js src/can.js tools/can.html
git commit -m "feat: cena 3D e lata tallboy com troca líquida de rótulo"
```

---

### Task 4: Som da lata e cursor com sabor

**Files:**
- Create: `src/sfx.js`, `src/cursor.js`
- Test: `tests/sfx.test.js`

**Interfaces:**
- Produces:
  - `createFizz({ AudioCtx = globalThis.AudioContext } = {}) → { toggle(): boolean, play(): void, get enabled(): boolean }`. O `AudioContext` só é criado no primeiro `toggle()` que liga o som. `play()` sem som ligado não faz nada.
  - `initCursor() → { setColor(color: string) }`. Em tela de toque devolve um `setColor` que não faz nada e não cria o cursor.

- [ ] **Step 1: Escrever os testes que falham**

`tests/sfx.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFizz } from '../src/sfx.js';

function fakeAudio() {
  const log = { created: 0, started: 0 };
  const node = () => ({ connect(n) { return n; }, frequency: { value: 0 }, Q: { value: 0 }, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  class Ctx {
    constructor() { log.created++; this.sampleRate = 8000; this.currentTime = 0; this.destination = {}; }
    createBuffer(_c, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return { ...node(), start() { log.started++; } }; }
    createBiquadFilter() { return node(); }
    createGain() { return node(); }
  }
  return { Ctx, log };
}

test('não cria áudio nem toca nada enquanto o som está desligado', () => {
  const { Ctx, log } = fakeAudio();
  const fizz = createFizz({ AudioCtx: Ctx });
  fizz.play();
  assert.equal(log.created, 0);
  assert.equal(log.started, 0);
  assert.equal(fizz.enabled, false);
});

test('ligar cria o contexto uma vez e tocar dispara o som', () => {
  const { Ctx, log } = fakeAudio();
  const fizz = createFizz({ AudioCtx: Ctx });
  assert.equal(fizz.toggle(), true);
  fizz.play(); fizz.play();
  assert.equal(log.created, 1);
  assert.equal(log.started, 2);
});

test('desligar de novo silencia', () => {
  const { Ctx, log } = fakeAudio();
  const fizz = createFizz({ AudioCtx: Ctx });
  fizz.toggle(); fizz.toggle();
  fizz.play();
  assert.equal(log.started, 0);
});

test('sem suporte a áudio, ligar não quebra', () => {
  const fizz = createFizz({ AudioCtx: undefined });
  assert.doesNotThrow(() => { fizz.toggle(); fizz.play(); });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL em `tests/sfx.test.js` com `Cannot find module` apontando para `src/sfx.js`. Os testes do scrollState continuam passando.

- [ ] **Step 3: Implementar `src/sfx.js`**

```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 12` e `# fail 0`.

- [ ] **Step 5: Implementar `src/cursor.js`**

```js
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
```

- [ ] **Step 6: Commit**

```bash
git add src/sfx.js src/cursor.js tests/sfx.test.js
git commit -m "feat: som opcional da lata abrindo e cursor na cor do sabor"
```

---

### Task 5: Ligar tudo no `main.js` (estado estático + fundo + sabores pelas bolinhas)

Nesta task a página já funciona inteira, mas **sem scroll animado**: a lata fica na pose do hero e as bolinhas trocam o sabor. O roteiro de scroll entra na Task 6.

**Files:**
- Create: `src/scroll.js` (versão inicial: só estado, poses e trigger de seção)
- Modify: `src/main.js` (substituir o conteúdo inteiro)

**Interfaces:**
- Consumes: tudo das Tasks 0 a 4.
- Produces (em `src/scroll.js`, que a Task 6 amplia sem mudar as assinaturas):
  - `POSES: { desktop, mobile }`, cada um `{ hero, sabores, ingredientes, cta }` com `{ x, y, s }`. O `x`/`y` são frações da metade da área visível (−1 a 1) e o `s` é a escala.
  - `createState(mobile: boolean) → { x, y, s, drop, open, flavorP, cta, section }`
  - `initScroll({ state, mobile, reducedMotion, onOpen }) → { goToFlavor(i: number, count: number), replayOpen() }`

- [ ] **Step 1: Criar `src/scroll.js` (versão inicial)**

```js
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
```

- [ ] **Step 2: Substituir `src/main.js`**

```js
import './style.css';
import { Vector3 } from 'three';
import { BRAND, FLAVORS } from './flavors.js';
import { flavorState, currentFlavor } from './scrollState.js';
import { loadLabelFonts } from './labels.js';
import { createScene } from './scene.js';
import { createCan } from './can.js';
import { createState, initScroll, POSES } from './scroll.js';
import { initCursor } from './cursor.js';
import { createFizz } from './sfx.js';

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
  sound: document.querySelector('.sound'),
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
const fizz = createFizz();
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
  ui.sound.addEventListener('click', () => {
    const on = fizz.toggle();
    ui.sound.setAttribute('aria-pressed', String(on));
    ui.sound.textContent = on ? 'Som: on' : 'Som: off';
    if (on) scroll.replayOpen();
  });
}

async function start() {
  if (!hasWebGL()) {
    root.classList.add('no-webgl');
    bindControls(initScroll({ state, mobile, reducedMotion: reduced, onOpen: () => fizz.play() }));
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

  const onOpen = () => {
    fizz.play();
    if (reduced) return;
    const top = new Vector3().copy(hero.group.position);
    top.y += 1.7 * hero.group.scale.y;
    s3.burst(top, ['#ffffff', '#F4F1EA'], { up: true });
  };
  bindControls(initScroll({ state, mobile, reducedMotion: reduced, onOpen }));

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

    if (changed) {
      cursor.setColor(FLAVORS[cur].a);
      if (!reduced && state.section === 'sabores') s3.burst(g.position, [FLAVORS[cur].a, FLAVORS[cur].b]);
    }

    const ctaOn = reduced ? (state.section === 'cta' ? 1 : 0) : state.cta;
    extras.forEach((c, i) => {
      c.group.visible = ctaOn > 0.01;
      c.group.position.set(((-0.6 + i * 0.4) * w) / 2, (poses.cta.y * h) / 2, 0);
      c.group.scale.setScalar(poses.cta.s * ctaOn);
      c.group.rotation.set(0.1, t * 0.6 * idle + i, -0.1);
      c.update(dt, t);
    });

    hero.update(dt, t);
    s3.render(dt);
  });
}

start();
```

- [ ] **Step 3: Verificar no navegador**

Com `npm run dev -- --port 5173 --strictPort` rodando:
`bash tools/shot.sh "http://localhost:5173/" /tmp/home.png 1440,900`

Expected: hero com fundo amarelo `#FFB800`, título "Energia que tem cor." à esquerda, a lata Tropical Passion à direita e o menu no topo com `SUA MARCA`.

Depois, abrir `http://localhost:5173/` num navegador de verdade e conferir:
- Clicar nas bolinhas da seção de sabores rola até cada sabor. O nome, a descrição, o fundo e o rótulo da lata trocam.
- Rolar até "O que tem dentro" deixa o fundo creme, e até "Peça o seu" deixa o fundo quase preto com o menu claro.
- "Som: off" vira "Som: on" e toca o "tssss".
- O console não mostra erros.

- [ ] **Step 4: Commit**

```bash
git add src/scroll.js src/main.js
git commit -m "feat: liga lata, fundo, sabores, som e cursor na página"
```

---

### Task 6: Roteiro do scroll (intro, transições entre seções, cards, rolagem suave)

**Files:**
- Modify: `src/scroll.js` (substituir o conteúdo inteiro)

**Interfaces:**
- Consumes: as mesmas assinaturas da Task 5 (`POSES`, `createState`, `initScroll` → `{ goToFlavor, replayOpen }`). O `main.js` não muda.

- [ ] **Step 1: Substituir `src/scroll.js`**

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export const POSES = {
  desktop: { hero: { x: 0.42, y: -0.08, s: 0.85 }, sabores: { x: 0, y: 0.02, s: 1 }, ingredientes: { x: 0.68, y: 0.35, s: 0.45 }, cta: { x: 0.6, y: -0.15, s: 0.55 } },
  mobile: { hero: { x: 0.25, y: -0.42, s: 0.6 }, sabores: { x: 0, y: 0.25, s: 0.75 }, ingredientes: { x: 0.6, y: 0.62, s: 0.3 }, cta: { x: 0.6, y: -0.35, s: 0.4 } },
};

export function createState(mobile) {
  return { ...POSES[mobile ? 'mobile' : 'desktop'].hero, drop: 0, open: 0, flavorP: 0, cta: 0, section: 'hero' };
}

export function initScroll({ state, mobile, reducedMotion, onOpen }) {
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
      .to(state, { open: 1, duration: 0.25, ease: 'back.out(3)', onStart: onOpen }, '+=0.15');

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
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    scrollTo(smoother ? target : target.getBoundingClientRect().top + window.scrollY);
  }));

  function goToFlavor(i, count) {
    scrollTo(flavors.start + (flavors.end - flavors.start) * (i / (count - 1)));
  }

  function replayOpen() {
    if (reducedMotion) { onOpen(); return; }
    gsap.fromTo(state, { open: 0 }, { open: 1, duration: 0.3, delay: 0.1, ease: 'back.out(3)', onStart: onOpen });
  }

  return { goToFlavor, replayOpen };
}
```

- [ ] **Step 2: Verificar o build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 3: Verificar no navegador (desktop, 1440×900)**

Abrir `http://localhost:5173/` e conferir, em ordem:
1. Ao carregar, a lata cai quicando, o título sobe palavra por palavra e o lacre abre com um spray de gotinhas brancas.
2. Rolando pro hero, a lata desliza pro centro. Na seção de sabores ela gira, e cada troca sobe como líquido, sincronizada com a onda do fundo. Os ingredientes do novo sabor explodem em volta.
3. Clicar na 4ª bolinha pula direto pra Grape Midnight, e o rótulo mostra o par certo durante a troca (Review Focus 3).
4. Em "O que tem dentro", a lata encolhe pro canto, os cards sobem em sequência e os números contam (160, 0, 12).
5. Em "Peça o seu", a lata vai pra direita e as outras três aparecem girando.
6. Redimensionar a janela no meio da seção de sabores não estica o canvas, e a lata continua centralizada (Review Focus 1).
7. Ligar o som repete a abertura do lacre com o "tssss".

- [ ] **Step 4: Commit**

```bash
git add src/scroll.js
git commit -m "feat: roteiro de scroll com abertura, transições, cards e rolagem suave"
```

---

### Task 7: Proteções (sem WebGL, animação reduzida e celular)

**Files:**
- Create: `public/lata-fallback.png` (gerado)

**Interfaces:**
- Consumes: `tools/can.html` e `tools/shot.sh` (Task 2/3); o caminho `.no-webgl` do `main.js` (Task 5).

- [ ] **Step 1: Gerar a imagem de fallback**

Com o `npm run dev -- --port 5173 --strictPort` rodando:

```bash
mkdir -p public
bash tools/shot.sh "http://localhost:5173/tools/can.html?from=0&to=0&mix=0&rot=0.35&drops=0" public/lata-fallback.png 600,900
```

Expected: `public/lata-fallback.png` com a lata Tropical Passion sobre fundo transparente (abrir e conferir a transparência).

- [ ] **Step 2: Verificar sem WebGL**

Abrir o Chrome com WebGL desligado e conferir a página:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --disable-webgl --disable-3d-apis --user-data-dir="$(mktemp -d)" "http://localhost:5173/"
```

Expected: a imagem da lata aparece à direita do hero, os textos ficam legíveis, as bolinhas trocam nome, descrição e fundo, e o console não mostra erros.

- [ ] **Step 3: Verificar animação reduzida**

No Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" → recarregar.

Expected: a lata aparece parada (sem queda, sem girar, sem flutuar e sem seguir o mouse) e muda de pose de forma instantânea a cada seção. O sabor troca sem animação líquida, o título aparece pronto e os números já mostram o valor final.

- [ ] **Step 4: Verificar no celular (Review Focus 5)**

No DevTools, modo de dispositivo em 390×844 com toque:

Expected: a lata do hero fica embaixo do texto, sem cobrir o título nem o botão. Na seção de sabores, a lata fica acima do nome, e as bolinhas ficam embaixo, na horizontal. Os cards empilham, não aparece cursor customizado e a rolagem fica fluida.

Se o texto ficar embaixo da lata, ajuste só `POSES.mobile` em `src/scroll.js` (valores `y` mais negativos e `s` menor) e repita.

- [ ] **Step 5: Commit**

```bash
git add public/lata-fallback.png src/scroll.js
git commit -m "feat: fallback sem WebGL e ajustes para celular e animação reduzida"
```

---

### Task 8: Verificação final e desempenho

**Files:**
- Modify: só se a verificação achar problema

- [ ] **Step 1: Testes e build**

Run: `npm test && npm run build`
Expected: `# fail 0` e build sem erros nem avisos de import.

- [ ] **Step 2: Medir fps na seção de sabores**

`npm run preview -- --port 4173` e abrir `http://localhost:4173/`. No DevTools → Performance, gravar 5 segundos rolando pela seção de sabores.

Expected: quadros a ~60fps, sem tarefas longas repetidas. Se cair, reduzir nesta ordem: `COUNT` de partículas em `src/scene.js`, segmentos do `LatheGeometry` (128 → 64) em `src/can.js` e `anisotropy` (8 → 4).

- [ ] **Step 3: Conferir a spec item por item**

Abrir `docs/superpowers/specs/2026-10-01-landing-energetico-design.md` e marcar, seção por seção (4.1 a 4.5, 6 e 7), que cada comportamento aparece na página. Anotar qualquer desvio no resumo pra pessoa.

- [ ] **Step 4: Commit (se houve ajuste)**

```bash
git add -A src
git commit -m "perf: ajustes finais de desempenho"
```
