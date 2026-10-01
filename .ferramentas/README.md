# .ferramentas

Cópia local (sem `.git`) dos repositórios de skills e ferramentas usados no projeto. Servem de consulta e backup; a instalação que o Claude Code usa fica em `~/.claude`.

Cada pasta foi enxugada: ficaram só as skills, comandos, hooks, README e licença (sem testes, benchmarks, imagens, docs e traduções). O `omniroute` tem apenas README e licença.

| Pasta | Origem | Para que serve |
|---|---|---|
| `ui-ux-pro-max-skill` | nextlevelbuilder/ui-ux-pro-max-skill | Base de design: estilos, paletas, fontes, guidelines de UX e gráficos. |
| `emil-skills` | emilkowalski/skills | Animação e polimento de interface: easing, mola, movimento fluido (`emil-design-eng`). |
| `impeccable` | pbakaus/impeccable | Comandos de design: layout, tipografia, espaçamento, acessibilidade, `audit`, `polish`. |
| `taste-skill` | Leonxlnx/taste-skill | `design-taste-frontend`: regras contra o visual "genérico de IA". |
| `ponytail` | dietrichgebert/ponytail | Faz o agente escolher a solução mais simples e escrever menos código. |
| `agent-skills` | addyosmani/agent-skills | 25 skills de engenharia e comandos `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`. |
| `graphify` | Graphify-Labs/graphify | Transforma o projeto num grafo de conhecimento consultável (`/graphify .`). |
| `omniroute` | diegosouzapw/OmniRoute | Gateway de IA (servidor proxy) para rotear por provedores gratuitos. **Só baixado, não instalado.** |

## Fora desta pasta

- **Chrome DevTools MCP**: instalado, controla e inspeciona o Chrome (console, rede, performance).
- **shadcn MCP**: registrado, mas não conectou ainda.