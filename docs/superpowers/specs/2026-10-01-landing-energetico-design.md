# Landing page de energético 3D: especificação de design

**Data:** 2026-10-01
**Status:** aguardando revisão

## 1. Objetivo

Landing page de uma marca **fictícia** de energético, feita como peça de portfólio de UX/animação. O destaque é a **lata 3D**, que acompanha o scroll e troca de sabor.

**Sucesso significa:**
- A pessoa entende a marca e os 4 sabores só rolando a página
- A lata 3D parece real (metal, verniz, relevo), e não um "3D de computador"
- Roda fluido (meta de 60fps no desktop) e funciona bem no celular
- Respeita quem desativa animações no sistema

**Fora do escopo:** loja, carrinho e checkout (o CTA é só visual), loader de carregamento, seções extras (manifesto, depoimentos, FAQ).

## 2. Marca

### 2.1 Nome
O nome é **ZOD**. O logo usa o símbolo do lacre como o "O", no cabeçalho e no rodapé. O nome fica em um lugar só (`flavors.js`) e é desenhado em código na lata.

### 2.2 Tipografia
| Uso | Fonte |
|---|---|
| Títulos grandes da página (hero, números, CTA) e nome nas latas | **Unbounded** 900 |
| Todo o resto (menu, textos, botões, subtítulos) | **Bricolage Grotesque** 400/600/800 |
| Exceção: nome da Watermelon Wave na lata | **Shrikhand** |

### 2.3 Símbolo (logo)
O **lacre da lata**: silhueta arredondada com um furo, de uma cor só. É minimalista e deve ser reconhecível pequeno.

```
M50 6 C72 6 82 20 82 38 V62 C82 82 70 94 50 94 C30 94 18 82 18 62 V38 C18 20 28 6 50 6Z
M50 20 C40.6 20 33 26.3 33 34 C33 41.7 40.6 48 50 48 C59.4 48 67 41.7 67 34 C67 26.3 59.4 20 50 20Z
```
(viewBox 0 0 100 100, fill-rule evenodd)

O mesmo símbolo é extrudado em 3D como o lacre de verdade na tampa da lata.

### 2.4 Cores base
- Creme (fundo neutro): `#F4F1EA`
- Tinta (texto): `#111111`

## 3. Os sabores

Nomes em inglês. Cada sabor tem **duas cores** e **um rótulo com composição própria**.

| Sabor | Cor A | Cor B | Rótulo |
|---|---|---|---|
| **Tropical Passion** | `#FFB800` | `#FF5A1F` | Pôr do sol |
| **Watermelon Wave** | `#FF4D6D` | `#1FA35B` | Estratos |
| **Lime Volt** | `#B6F500` | `#0E7C3A` | Onda |
| **Grape Midnight** | `#A57CFF` | `#24135F` | Meia-noite |

### 3.1 Regras da família (iguais em todas as latas)
- Faixa preta no topo com `ZOD` em relevo, e faixa preta na base com `ENERGY DRINK · 473 ML`
- Linha `ENERGY DRINK · ZERO SUGAR` acima do nome
- Primeira palavra do nome gigante e a segunda vazada (só contorno) logo abaixo
- Lacre presente em todas
- Verso igual em todas: tabela nutricional, ingredientes, código de barras e selo de reciclagem, tudo atrás da emenda e sem invadir a frente

### 3.2 Composição de cada rótulo
- **Tropical Passion:** céu em degradê forte (amarelo claro → amarelo → laranja → vermelho-laranja). Sol creme com listras afundando no horizonte e reflexos no mar. Uma silhueta escura de baía, **simétrica**, descendo dos dois lados e se encontrando no centro, com 6 palmeiras enraizadas nela. Lacre prateado no mar.
- **Watermelon Wave:** paisagem de mar ao amanhecer que é, em segredo, um corte de melancia. O céu rosa em degradê é a polpa, a linha creme do horizonte é o filete branco, o mar em 5 camadas de verde (do claro ao fundo ao escuro na frente, com cristas pontudas) é a casca, e um bando de sementes voando em V são os pássaros. Título em Shrikhand. **Lacre na cor rosa** (`#FF4D6D`) sobre o verde.
- **Lime Volt:** uma onda senoidal (3 ondas na volta completa, fechando certinho na emenda) divide o verde-limão em cima do verde-escuro embaixo, com filete creme e retícula de pontos na parte de baixo. LIME preto em cima, VOLT creme embaixo, ao lado do lacre prateado.
- **Grape Midnight:** céu em degradê da meia-noite, estrelas, uma lua de alumínio com brilho e **o lacre dentro da lua**, e duas camadas de colinas no horizonte. Texto em creme.

**Referência visual aprovada:** `referencias/latas-prototipo.html` (o código de desenho dos rótulos sai daqui).

### 3.3 Acabamento da lata
- Formato **tallboy 473 ml**: corpo reto, pescoço afunilado, tampa e fundo em alumínio, lacre 3D na tampa
- Cada rótulo é desenhado em 4 passes do mesmo layout: **cor**, **rugosidade**, **metalicidade** e **relevo**
- Áreas de alumínio sem tinta são metálicas e brilhantes. O resto é tinta acetinada, com uma camada de verniz (clearcoat) por cima.
- O lacre e a marca têm relevo

## 4. A página

Ideia central: **a mesma lata 3D do começo ao fim.** Ela nunca some, só muda de lugar e de papel.

### 4.1 Hero
- A lata cai do alto girando, assenta à direita com um quique e então **abre**: o lacre estala e sai um spray de gás e gotas. O som "tssss" só toca se a pessoa ativar o som.
- Título "Energia que tem cor." entra palavra por palavra
- Parada, a lata flutua de leve e inclina seguindo o mouse

### 4.2 Sabores (o coração da página)
- A seção trava na tela (pin) e o scroll controla a lata
- A lata vai pro centro e gira passando pelos 4 sabores: Tropical Passion → Watermelon Wave → Lime Volt → Grape Midnight
- **Troca líquida:** o rótulo novo sobe pela lata como líquido enchendo, com uma ondinha na borda, e o fundo da página troca **com a mesma onda, sincronizado**
- A cada troca: o nome do sabor anima e os ingredientes daquele sabor explodem em volta
- Bolinhas de navegação mostram o sabor atual e permitem pular direto

### 4.3 Ingredientes
- A lata encolhe e vai pro canto
- 3 cards entram em sequência (`160mg` cafeína · `0g` açúcar · `B12` vitaminas), com os números contando do zero

### 4.4 CTA e rodapé
- Fundo quase preto, e a lata volta pro centro grandona, com as 4 versões lado a lado girando
- "Peça o seu" com botão que reage ao mouse

### 4.5 Detalhes que valem pra página toda
- **Lata gelada:** gotas de condensação escorrendo e um reflexo de luz passando pelo metal enquanto ela gira
- **Cursor com sabor:** bolinha na cor do sabor atual, que cresce em cima de botões (só no desktop)
- Textos da página em **português**. Nomes dos sabores e textos da lata em **inglês**.

## 5. Arquitetura

**Ferramentas:** Vite, Three.js e GSAP (com ScrollTrigger e ScrollSmoother). Sem framework.

```
index.html     → as 4 seções em HTML de verdade (legível mesmo sem o 3D)
src/
  main.js      → liga tudo e detecta capacidades (WebGL, animação reduzida, celular)
  scene.js     → renderer, câmera, luzes, ambiente, partículas
  can.js       → geometria da tallboy, lacre 3D, material, condensação
  labels.js    → os 4 rótulos (desenho em canvas, 4 passes)
  flavors.js   → nome da marca, sabores, cores, textos
  scroll.js    → o roteiro do GSAP: hero → sabores → ingredientes → CTA
  cursor.js    → cursor com sabor
  style.css    → layout, fontes, tokens de cor
public/sfx/    → som de abertura da lata
```

**Como as partes conversam:**
- O canvas 3D fica fixo atrás da página e o HTML rola por cima
- O `scroll.js` é o único que lê o scroll. Ele traduz a posição em um estado (`posição`, `rotação`, `sabor atual`, `progresso da troca 0→1`), e o `scene.js`/`can.js` só leem esse estado.
- A troca líquida é um shader no material do rótulo, que mistura o rótulo atual com o próximo usando o `progresso da troca`. O fundo da página usa o mesmo valor, e é isso que garante a sincronia.
- A lógica "posição do scroll → sabor + progresso" é uma função pura, separada do resto, pra poder ser testada sozinha

## 6. Proteções

- **Sem WebGL:** aparece uma imagem estática da lata e a página funciona normalmente
- **Animação reduzida no sistema:** nada se mexe, a lata fica parada e os conteúdos aparecem prontos
- **Celular:** menos partículas, resolução limitada (pixel ratio máximo 1.5) e sem cursor customizado
- **Som:** desligado por padrão, nunca toca sem a pessoa pedir

## 7. Testes e verificação

- Teste automatizado pequeno da função "posição do scroll → sabor + progresso" (limites, início, fim e trocas)
- Verificação no navegador de cada seção, no desktop e em largura de celular
- Medir fps durante a seção de sabores (meta de 60 no desktop)
- Conferir com animação reduzida ligada e com WebGL desligado

## 8. Pendências

- **img2threejs:** opcional, já que a lata procedural atende. Pode entrar depois pra mais detalhe no metal.
