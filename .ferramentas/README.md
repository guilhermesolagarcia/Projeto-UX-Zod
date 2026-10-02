# .ferramentas

Cópia local (sem `.git`) dos repositórios de skills e ferramentas usados no projeto, organizados por categoria. Servem de consulta e backup; a instalação que o Claude Code usa fica em `~/.claude`.

Cada pasta foi enxugada: ficaram só as skills, comandos, hooks, README e licença (sem testes, benchmarks, imagens, docs e traduções).

## 1-design-ui: identidade visual e interface

| Pasta | Origem | Para que serve |
|---|---|---|
| `ui-ux-pro-max-skill` | nextlevelbuilder/ui-ux-pro-max-skill | Base de design: estilos, paletas, fontes, guidelines de UX e gráficos. |
| `impeccable` | pbakaus/impeccable | Comandos de design: layout, tipografia, espaçamento, acessibilidade, `audit`, `polish`. |
| `taste-skill` | Leonxlnx/taste-skill | `design-taste-frontend`: regras contra o visual "genérico de IA". |
| `design-dna` | zanwei/design-dna | Extrai tokens, estilo e efeitos de uma referência (print/URL) em JSON e gera design a partir dele. |
| `awesome-design-md` | voltagent/awesome-design-md | 74 `DESIGN.md` de sites conhecidos. Copie um para o projeto e peça "faça uma página nesse estilo". Não é skill, é referência. |

## 2-animacao-3d: movimento e 3D

| Pasta | Origem | Para que serve |
|---|---|---|
| `emil-skills` | emilkowalski/skills | Polimento e animação de interface: easing, mola, movimento fluido (`emil-design-eng`). |
| `motion-design-skill` | lottiefiles/motion-design-skill | Princípios de movimento: timing, easing, coreografia (CSS, Framer Motion, GSAP, Lottie). |
| `gsap-skills` | greensock/gsap-skills | Skills oficiais do GSAP: core, timeline, ScrollTrigger, React, plugins, performance. |
| `threejs-skills` | CloudAI-X/threejs-skills | 10 skills de Three.js: cena, câmera, geometria, materiais, luz, shaders, texturas, pós-processamento. |
| `genjutsu` | AThevon/genjutsu | Skills `bunshin`, `cast`, `paint` e técnicas de motion/design (GSAP, Framer Motion, CSS nativo, auditoria). |
| `img2threejs` | img2threejs/img2threejs | Recria o objeto de uma imagem de referência como modelo Three.js feito só em código (Python 3.10+, sem dependências). |

## 3-engenharia: processo de desenvolvimento

| Pasta | Origem | Para que serve |
|---|---|---|
| `agent-skills` | addyosmani/agent-skills | 25 skills de engenharia e comandos `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`. |
| `ponytail` | dietrichgebert/ponytail | Faz o agente escolher a solução mais simples e escrever menos código. |

## 4-infra: infraestrutura e contexto

| Pasta | Origem | Para que serve |
|---|---|---|
| `graphify` | Graphify-Labs/graphify | Transforma o projeto num grafo de conhecimento consultável (`/graphify .`). |
| `omniroute` | diegosouzapw/OmniRoute | Gateway de IA (servidor proxy) para rotear por provedores gratuitos. Só README e licença; **não instalado**. |

## Fora desta pasta

- **Chrome DevTools MCP**: instalado, controla e inspeciona o Chrome (console, rede, performance).
- **shadcn MCP**: registrado, mas não conectou ainda.
- **Magic MCP (21st.dev)**: não instalado, precisa de API key.
