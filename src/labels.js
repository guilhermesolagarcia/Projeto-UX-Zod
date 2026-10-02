// Rótulos das latas: um layout por sabor, desenhado em 4 passes (cor, rugosidade, metal, relevo).
// O código de desenho veio de docs/superpowers/specs/referencias/latas-prototipo.html.
import { BRAND, FLAVORS } from './flavors.js';

export const LACRE = 'M50 6 C72 6 82 20 82 38 V62 C82 82 70 94 50 94 C30 94 18 82 18 62 V38 C18 20 28 6 50 6Z M50 20 C40.6 20 33 26.3 33 34 C33 41.7 40.6 48 50 48 C59.4 48 67 41.7 67 34 C67 26.3 59.4 20 50 20Z';
const lacrePath = new Path2D(LACRE);
const WM_FONT = '400 {s}px Shrikhand';

export function loadLabelFonts() {
  return Promise.all(['900 100px Unbounded', '800 100px "Bricolage Grotesque"', '500 40px "Bricolage Grotesque"', '400 100px Shrikhand'].map((f) => document.fonts.load(f)));
}

const W = 2048, H = 1432, CX = W / 2;
const PASS = {
  color: (f) => ({ base: f.a, b: f.b, accent: f.bdeep, inkB: f.inkB, dark: '#111', light: '#F4F1EA', metal: '#cfd4da', emboss: '#F4F1EA' }),
  rough: () => ({ base: '#787878', b: '#787878', accent: '#828282', inkB: '#8a8a8a', dark: '#8a8a8a', light: '#787878', metal: '#2c2c2c', emboss: '#707070' }),
  metal: () => ({ base: '#1e1e1e', b: '#1e1e1e', accent: '#1e1e1e', inkB: '#141414', dark: '#141414', light: '#141414', metal: '#ffffff', emboss: '#141414' }),
  bump:  () => ({ base: '#000', b: '#000', accent: '#000', inkB: '#000', dark: '#000', light: '#000', metal: '#fff', emboss: '#fff' }),
};

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function fitFont(g, text, family, maxW, maxSize) {
  let size = maxSize; g.font = `${family.replace('{s}', size)}`;
  const w = g.measureText(text).width;
  if (w > maxW) size = Math.floor(maxSize * maxW / w);
  g.font = family.replace('{s}', size); return size;
}
function lacre(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fill(lacrePath, 'evenodd'); g.restore(); }

function backInfo(g, c, f) {
  // tabela nutricional (lado de trás, à direita da emenda)
  g.fillStyle = c.light; g.fillRect(110, 300, 360, 520);
  g.fillStyle = c.dark; g.strokeStyle = c.dark; g.lineWidth = 3;
  g.strokeRect(110, 300, 360, 520);
  g.font = '800 34px "Bricolage Grotesque"'; g.fillText('INFORMAÇÃO', 130, 350); g.fillText('NUTRICIONAL', 130, 388);
  g.font = '500 22px "Bricolage Grotesque"'; g.fillText('Porção de 473 ml (1 lata)', 130, 424);
  g.fillRect(130, 438, 320, 8);
  const rows = [['Valor energético', '12 kcal'], ['Carboidratos', '2,8 g'], ['Açúcares totais', '0 g'], ['Proteínas', '0 g'], ['Gorduras totais', '0 g'], ['Sódio', '180 mg'], ['Cafeína', '160 mg'], ['Taurina', '1000 mg'], ['Vitamina B12', '2,4 µg']];
  rows.forEach(([a, b], i) => {
    const y = 480 + i * 36; g.fillText(a, 130, y); g.textAlign = 'right'; g.fillText(b, 450, y); g.textAlign = 'left';
    g.fillRect(130, y + 10, 320, 1.5);
  });
  // texto miúdo + código de barras (lado de trás, à esquerda da emenda)
  g.font = '500 19px "Bricolage Grotesque"';
  const fine = ['INGREDIENTES: água gaseificada, suco concentrado de', f.l1.toLowerCase() + ', acidulante ácido cítrico, taurina, cafeína,', 'aromatizante natural, edulcorantes sucralose e', 'acessulfame K, vitaminas B3, B6 e B12, corante natural.', 'NÃO CONTÉM GLÚTEN. CONTÉM CAFEÍNA: não recomendado', 'para crianças, gestantes e pessoas sensíveis à cafeína.', 'Consumir gelado. Agite levemente antes de abrir.'];
  g.font = '500 16px "Bricolage Grotesque"'; fine.forEach((t, i) => g.fillText(t, W - 470, 330 + i * 24));
  g.fillStyle = c.light; g.fillRect(W - 470, 540, 300, 180);
  g.fillStyle = c.dark; const r = seeded(7); let x = W - 455;
  while (x < W - 190) { const w = 2 + Math.floor(r() * 7); if (r() > 0.4) g.fillRect(x, 552, w, 125); x += w + 2 + Math.floor(r() * 4); }
  g.font = '500 20px "Bricolage Grotesque"'; g.fillText('7  891234  567890', W - 450, 707);
  // símbolo de reciclagem simplificado
  g.lineWidth = 5; g.beginPath(); g.arc(W - 90, 800, 34, 0.3, Math.PI * 1.8); g.stroke();
  g.font = '800 20px "Bricolage Grotesque"'; g.fillText('ALU', W - 110, 807);
}
function drawLime(g, c, f, pass) {
  // onda que fecha certinho na emenda (3 ondas na volta inteira)
  const wy = (x) => H * 0.56 + 55 * Math.sin((x / W) * Math.PI * 2 * 3);
  const wave = (off) => { g.beginPath(); g.moveTo(0, wy(0) + off); for (let x = 0; x <= W; x += 8) g.lineTo(x, wy(x) + off); };
  g.fillStyle = c.base; g.fillRect(0, 0, W, H);
  if (pass === 'color') { const gr = g.createLinearGradient(0, 0, 0, H * 0.6); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  wave(0); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fillStyle = c.b; g.fill();
  // retícula na cor de baixo, mais forte perto da base
  g.fillStyle = c.accent;
  for (let y = H * 0.62; y < H; y += 20) for (let x = (y / 20) % 2 ? 10 : 0; x < W; x += 20) {
    const r = ((y - H * 0.62) / (H * 0.38)) * 8; if (r > 0.6 && y > wy(x) + 30) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  }
  // filete creme acompanhando a onda (a "casca")
  wave(-22); g.strokeStyle = c.light; g.lineWidth = 14; g.stroke();
  // faixas de topo e base
  g.fillStyle = c.dark; g.fillRect(0, 0, W, 64); g.fillRect(0, H - 54, W, 54);
  g.fillStyle = c.emboss; g.font = '900 34px Unbounded'; g.textAlign = 'center';
  for (let x = CX % 512; x < W; x += 512) g.fillText(BRAND, x, 45);
  g.font = '800 24px "Bricolage Grotesque"';
  for (let x = CX % 512 + 256; x < W; x += 512) g.fillText('ENERGY DRINK · 473 ML', x, H - 19);
  // nome: palavra 1 gigante na cor de cima
  g.fillStyle = c.dark; g.font = '800 34px "Bricolage Grotesque"'; g.fillText('ENERGY DRINK  ·  ZERO SUGAR', CX, 250);
  fitFont(g, f.l1, '900 {s}px Unbounded', 1020, 290); g.fillText(f.l1, CX, 520);
  // lacre em alumínio + palavra 2 na cor de baixo
  mark(g, c, CX - 380, 900, 200);
  g.fillStyle = c.inkB; g.textAlign = 'left';
  fitFont(g, f.l2, '900 {s}px Unbounded', 640, 190); g.fillText(f.l2, CX - 180, 1040);
  g.font = '800 30px "Bricolage Grotesque"'; g.fillText('160MG CAFFEINE  ·  B12', CX - 172, 1110);
  g.textAlign = 'left';
  backInfo(g, c, f);
}

function topBottom(g, c) {
  g.fillStyle = c.dark; g.fillRect(0, 0, W, 64); g.fillRect(0, H - 54, W, 54);
  g.fillStyle = c.emboss; g.font = '900 34px Unbounded'; g.textAlign = 'center';
  for (let x = CX % 512; x < W; x += 512) g.fillText(BRAND, x, 45);
  g.font = '800 24px "Bricolage Grotesque"';
  for (let x = CX % 512 + 256; x < W; x += 512) g.fillText('ENERGY DRINK · 473 ML', x, H - 19);
}
function emblem(g, c, x, y, r, ink) {
  g.fillStyle = c.metal; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = ink; const s = (r * 1.4) / 100; lacre(g, x - 50 * s, y - 50 * s, s);
}

function mark(g, c, cx, top, size) { g.fillStyle = c.metal; lacre(g, cx - size / 2, top, size / 100); }

// 🥭 pôr do sol tropical
function drawTropical(g, c, f, pass) {
  const HZ = 1010;
  if (pass === 'color') { const gr = g.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#FFE680'); gr.addColorStop(0.3, c.base); gr.addColorStop(0.7, '#FF8A1F'); gr.addColorStop(1, '#F0430F'); g.fillStyle = gr; } else g.fillStyle = c.base;
  g.fillRect(0, 0, W, H);
  // sol listrado afundando
  const sx = CX, sy = 860, sr = 270;
  g.save(); g.beginPath(); g.rect(0, 0, W, HZ); g.clip();
  g.fillStyle = c.light; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
  g.fillStyle = pass === 'color' ? c.b : c.base;
  [[880, 10], [925, 16], [970, 24]].forEach(([y, h]) => g.fillRect(sx - sr, y, sr * 2, h));
  g.restore();
  // mar com reflexos
  g.fillStyle = c.accent; g.fillRect(0, HZ, W, H - HZ);
  g.fillStyle = c.light;
  [[1050, 360], [1095, 260], [1140, 180], [1185, 110]].forEach(([y, w]) => g.fillRect(sx - w / 2, y, w, 8));
  // palmeiras em silhueta
  const palm = (x, lean, h) => {
    g.strokeStyle = c.dark; g.fillStyle = c.dark; g.lineCap = 'round';
    g.lineWidth = 26; g.beginPath(); g.moveTo(x, HZ + 300); g.quadraticCurveTo(x + lean * 0.2, HZ - h * 0.5, x + lean, HZ - h); g.stroke();
    const tx = x + lean, ty = HZ - h;
    for (const [dx, dy] of [[-230, 40], [-170, 120], [210, 50], [160, 130], [-40, -70], [60, -60]]) {
      g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + dx * 0.5, ty + dy * 0.2 - 60, tx + dx, ty + dy);
      g.quadraticCurveTo(tx + dx * 0.5, ty + dy * 0.2 - 20, tx, ty); g.fill();
    }
  };
  // baía: uma silhueta só, descendo simétrica dos dois lados até se encontrar no centro
  g.fillStyle = c.dark; g.beginPath(); g.moveTo(0, H); g.lineTo(0, 1040);
  g.bezierCurveTo(CX - 650, 1000, CX - 330, 1330, CX, 1340);
  g.bezierCurveTo(CX + 330, 1330, CX + 650, 1000, W, 1040);
  g.lineTo(W, H); g.closePath(); g.fill();
  palm(CX - 700, 100, 520); palm(CX - 500, -30, 360); palm(CX - 900, 50, 300);
  palm(CX + 690, -90, 480); palm(CX + 500, 40, 340); palm(CX + 900, -40, 290);
  topBottom(g, c);
  g.fillStyle = c.dark; g.textAlign = 'center';
  g.font = '800 34px "Bricolage Grotesque"'; g.fillText('ENERGY DRINK  ·  ZERO SUGAR', CX, 190);
  fitFont(g, f.l1, '900 {s}px Unbounded', 1000, 250); g.fillText(f.l1, CX, 400);
  fitFont(g, f.l2, '900 {s}px Unbounded', 640, 130); g.lineWidth = 5; g.strokeStyle = c.dark; g.strokeText(f.l2, CX, 545);
  mark(g, c, CX, 1225, 64);
  g.textAlign = 'left';
  backInfo(g, c, f);
}

// 🍉 estratos: amanhecer no mar que é, em segredo, um corte de melancia
function drawWatermelon(g, c, f, pass) {
  const col = pass === 'color', HZ = 960;
  // céu = polpa
  if (col) { const gr = g.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#FFE4E9'); gr.addColorStop(0.45, '#FF9AAE'); gr.addColorStop(1, c.base); g.fillStyle = gr; } else g.fillStyle = c.base;
  g.fillRect(0, 0, W, H);
  // mar = casca, em camadas recuando (claro ao fundo, escuro na frente)
  const greens = col ? ['#7FE0B0', '#43BF7E', c.b, '#13703F', '#0B4A29'] : [c.b, c.b, c.b, c.accent, c.dark];
  const layers = [[HZ + 8, 8, 16], [HZ + 70, 16, 12], [HZ + 150, 26, 9], [HZ + 245, 36, 7], [HZ + 350, 46, 5]];
  g.fillStyle = greens[0]; g.fillRect(0, HZ, W, H - HZ);
  layers.forEach(([y0, amp, k], i) => {
    g.fillStyle = greens[i]; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) { const t = (x / W) * Math.PI * 2 * k + i * 1.3; g.lineTo(x, y0 - amp * Math.pow(1 - Math.abs(Math.sin(t)), 1.8)); }
    g.lineTo(W, H); g.closePath(); g.fill();
  });
  // horizonte = filete branco
  g.fillStyle = c.light; g.fillRect(0, HZ - 10, W, 10);
  // sementes = bando em V voando pra esquerda
  g.fillStyle = c.dark;
  const seed = (x, y, s) => { g.save(); g.translate(x, y); g.rotate(-Math.PI / 2 - 0.12); g.scale(s, s);
    g.beginPath(); g.moveTo(0, -22); g.bezierCurveTo(12, -8, 12, 14, 0, 16); g.bezierCurveTo(-12, 14, -12, -8, 0, -22); g.fill(); g.restore(); };
  const lx = CX - 260, ly = 745;
  seed(lx, ly, 1.9);
  for (let i = 1; i <= 4; i++) { const s = 1.9 - i * 0.2; seed(lx + i * 125, ly - i * 40, s); seed(lx + i * 125, ly + i * 40, s); }
  topBottom(g, c);
  g.fillStyle = c.dark; g.textAlign = 'center';
  g.font = '800 34px "Bricolage Grotesque"'; g.fillText('ENERGY DRINK  ·  ZERO SUGAR', CX, 190);
  fitFont(g, f.l1, WM_FONT, 1060, 250); g.fillText(f.l1, CX, 400);
  fitFont(g, f.l2, WM_FONT, 520, 130); g.lineWidth = 5; g.strokeStyle = c.dark; g.strokeText(f.l2, CX, 545);
  g.fillStyle = pass === 'color' ? c.base : c.light; lacre(g, CX - 40, 1215, 0.8);
  g.textAlign = 'left';
  backInfo(g, c, f);
}

// 🍇 céu da meia-noite
function drawGrape(g, c, f, pass) {
  if (pass === 'color') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120934'); gr.addColorStop(0.55, c.b); gr.addColorStop(0.82, c.base); g.fillStyle = gr; }
  else g.fillStyle = c.b;
  g.fillRect(0, 0, W, H);
  const mx = CX, my = 400, r = seeded(11);
  g.fillStyle = c.light;
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = 80 + r() * 900, s = r() < 0.08 ? 4.5 : 1.2 + r() * 1.6;
    if (Math.hypot(x - mx, y - my) < 300) continue;
    g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
  }
  if (pass === 'color') { const hg = g.createRadialGradient(mx, my, 200, mx, my, 420); hg.addColorStop(0, 'rgba(255,244,214,.35)'); hg.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = hg; g.fillRect(0, 0, W, H); }
  emblem(g, c, mx, my, 210, c.b);
  // colinas
  const hill = (base, amp, k, ph, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, base + amp * Math.sin((x / W) * Math.PI * 2 * k + ph)); g.lineTo(W, H); g.closePath(); g.fill(); };
  hill(1130, 40, 2, 1, c.accent); hill(1210, 30, 3, 0, '#0d0626');
  if (pass !== 'color') { hill(1130, 40, 2, 1, c.b); hill(1210, 30, 3, 0, c.dark); }
  topBottom(g, c);
  g.fillStyle = c.light; g.textAlign = 'center';
  fitFont(g, f.l1, '900 {s}px Unbounded', 1000, 260); g.fillText(f.l1, CX, 850);
  fitFont(g, f.l2, '900 {s}px Unbounded', 760, 120); g.lineWidth = 4; g.strokeStyle = c.light; g.strokeText(f.l2, CX, 1000);
  g.font = '800 28px "Bricolage Grotesque"'; g.fillText('ENERGY DRINK  ·  ZERO SUGAR  ·  160MG CAFFEINE', CX, 1310);
  g.textAlign = 'left';
  g.fillStyle = c.light; g.fillRect(W - 485, 300, 480, 190);
  backInfo(g, c, f);
}
const DRAW = [drawTropical, drawWatermelon, drawLime, drawGrape];

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
