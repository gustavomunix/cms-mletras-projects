# Design System

Fonte da verdade: `src/app/(frontend)/styles.css`. Importado uma única
vez em `src/app/(frontend)/layout.tsx` — nunca importar de novo em
página/componente.

## Convenção CSS (Do / Do not)

| Do | Do not |
|---|---|
| `@layer` pra toda regra | Seletor fora de layer |
| `@scope (.classe-raiz)` por componente | Seletor de componente sem scope |
| `@scope (outer) to (inner)` quando o bloco hospeda HTML de terceiros/rich text | Deixar chrome do componente vazar pro conteúdo embutido |
| Nesting com `&` | Repetir o seletor pai |
| `:has()` pra relação de DOM | Classes `.has-*` |
| `:not()` e ranged queries | Override e depois desfazer (`:last-child { border: 0 }`) |
| `oklch()` | hex / rgb / hsl |
| `clamp(min rem, rem + cqi, max rem)` | `html { font-size: 62.5% }`, `px` puro pra tipografia |
| Propriedades lógicas (`padding-block`, `inline-size`, `inset-block-start`) | `padding-top`, `width`, `left` |
| `@container` + `cqi` | Só `@media (min-width: ...)` |
| `text-wrap: balance` / `pretty` | Wrap padrão em heading e corpo de texto |
| `@media (prefers-reduced-motion: no-preference)` | `* { transition: none }` global em `reduce` |
| `container-type` em `html` e containers de layout (`.feature-grid`, futuros) | Largura fixa em `px` pro conteúdo |

`clamp()` — o termo do meio sempre com `rem` (`1.076rem + 0.217cqi`),
nunca só `cqi`. Ranged queries não podem se sobrepor.

Duas linhas da tabela têm exceção deliberada **neste projeto** — ver
"Exceção documentada" abaixo: `oklch(from ...)`/`color-mix()` pra cor
relacionada, e `light-dark()`/dark mode. Todo o resto da tabela vale
sem exceção.

## Cascade layers

Ordem declarada no topo do arquivo — define quem ganha em caso de
empate de especificidade (layer posterior sempre vence, independente de
especificidade dentro dele):

```
@layer fonts, reset, tokens, base, layout, utilities, components, overrides;
```

- **fonts** — só `@font-face` (Satoshi, Cabinet Grotesk). Nenhuma regra
  visual aqui — layer isolado pra `@font-face` nunca ficar solto fora de
  `@layer`.
- **reset** — normalização mínima (`box-sizing`, margin zero em blocos
  de texto, `img`/`svg` display block). `html` ganha
  `container-type: inline-size` aqui — habilita `cqi` em qualquer token
  fluido do site sem precisar declarar container em cada wrapper;
  `hanging-punctuation` e `interpolate-size` também entram nesse bloco.
- **tokens** — só custom properties em `:root` (nada de regra visual
  aqui).
- **base** — comportamento e tipografia de elementos nativos
  (`body`, `h1`-`h6`, `p`, foco visível, scroll).
- **layout** — `section`/`.container`: padding, gap, flex-column
  default.
- **utilities** — classes reutilizáveis entre qualquer componente:
  `.btn` + variantes.
- **components** — display modifiers (`.hero`, `.lead`) e o CSS
  colocado de cada componente em `src/components/*` (cada um declara
  `@layer components { @scope (...) {...} }`).
- **overrides** — reservado para exceções pontuais; evitar usar salvo
  necessidade real.

## Tokens principais

| Grupo | Tokens | Uso |
|---|---|---|
| Espaçamento fluido | `--space-xs` … `--space-xxl`, `--space-section` | `gap`, `padding`, sempre fluido 360px→1280px |
| Tipografia (corpo) | `--text-xs` … `--text-xxl` | tamanho de texto fora de heading |
| Headings | `--h1` … `--h6`, `--heading-hero`, `--heading-lead` | `.hero`/`.lead` são modificadores de display, desacoplados de h1-h6 |
| Cor primária | `--primary`, `--primary-dark`, `--primary-light`, `--primary-ultra-*`, `--primary-trans-*`, `--primary-500/600/700` | azul, fixo (Key Visual 2026) |
| Cor accent | `--accent`, `--accent-dark`, `--accent-light`, `--accent-ultra-*` | coral/vermelho |
| Cor neutral | `--neutral`, `--neutral-dark`, `--neutral-light`, `--neutral-ultra-*` | cinza azulado |
| Cor base | `--base`, `--base-dark`, `--base-light`, `--base-ultra-*` | texto e fundos escuros |
| Surface aliases | `--surface-page`, `--surface-card`, `--surface-card2`, `--surface-deep`, `--bg`, `--bg-dark` | trocar tema sem caçar seletor |
| Radius | `--radius-s` … `--radius-xl`, `--radius-btn`, `--radius-pill`, `--radius-circle` | fluido |
| Grid | `--grid-1` … `--grid-12`, `--grid-1-2` … `--grid-4-3` | `grid-template-columns` |
| Tamanhos | `--max-width`, `--max-width-m`, `--max-width-s`, `--container-width` | containers |

Todas as cores são `oklch()` — sem hex/rgb/hsl (regra da skill
`modern-css`: lightness perceptualmente uniforme).

Espaçamento e tipografia usam `clamp()` em `cqi` (não `vw`) — a fórmula
de cada token é a mesma calculada a partir do range 360px→1280px, só a
unidade muda; funciona porque `html` vira container (`container-type:
inline-size`) no layer `reset`, então `cqi` no `:root` equivale ao
viewport hoje. Se um componente futuro definir seu próprio `container`
(como `FeatureGrid`), os tokens fluidos dentro dele passam a reagir ao
tamanho desse container, não mais da viewport inteira.

Exceção documentada à skill: **sem dark mode**. `:root` declara apenas
`color-scheme: light` — a paleta é fixa e institucional (Key Visual
2026), sem variante dark definida. `--primary-dark`/`--accent-light`/etc
são shades hand-tuned com contraste WCAG já verificado (ver comentário
ao lado de cada um em `styles.css`), não derivados via
`oklch(from ...)` — preserva o valor exato validado em vez de recalcular
relativo.

## Classes utilitárias

- `.btn` + tamanho opcional (`.btn-xs/.btn-s/.btn-l/.btn-xl`, default =
  `m`) + cor obrigatória (`.btn-pri`, `.btn-acc`, `.btn-dark`,
  `.btn-white`, `.btn-ghost`, `.btn-ghost-white`).
- `.hero` / `.lead` — aplicar em `<h1>`/`<h2>` pra escala de display
  maior, sem inflar o resto da hierarquia h1-h6.

## Fontes

Variáveis, locais, servidas de `src/app/fonts/`:

- **Satoshi** (`--font-body`) — peso 300-900, normal + italic.
- **Cabinet Grotesk** (`--font-heading`) — peso 100-900.

Arquivos: `Satoshi-Variable.woff2/.woff`,
`Satoshi-VariableItalic.woff2/.woff`,
`CabinetGrotesk-Variable.woff2/.woff`. Sem CDN externa — tudo local via
`@font-face` no topo de `styles.css`.

Ver também [`frontend-architecture.md`](./frontend-architecture.md) pra
como usar esses tokens ao criar um componente novo.
