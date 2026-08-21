# design-sync notes

## Escopo desta sync

Package shape, sem `dist/`: `.design-sync/synth-entry.mjs` re-exporta os 5
componentes reais (`Header`, `Hero`, `FeatureGrid`, `FeatureCard`, `Footer`)
direto de `src/components/*`. `cfg.componentSrcMap` pina os 5 nomes pros
paths reais (necessário — sem isso o converter não descobre nada porque não
há `dist/`.d.ts e o entry não veio do fallback NO_DIST automático).
`cfg.tsconfig` aponta pro `tsconfig.json` do projeto pra resolver o alias
`@/*` que `FeatureGrid.tsx` usa.

**Correção**: a primeira rodada desta sync tratou os componentes como
"placeholder" e fez sync tokens-only. Isso veio de uma leitura truncada
(`head -30` via wrapper `rtk`, que cortou o corpo da função e pareceu vazio).
Os componentes são reais — corrigido nesta rodada.

## Preview: floor card em todos, com 1 exceção autorada

Escopo escolhido pelo usuário: floor card (sem autoria) pros 5. Só
`FeatureCard` precisou de preview autorado (`.design-sync/previews/FeatureCard.tsx`)
porque suas props são só strings — o floor card gera `title`/`description`
como string vazia, colapsando o card pra ~2px de altura (`[RENDER_BLANK]`).
Componentes com props mais ricas (array, objeto) geram o floor card
typográfico normal (`Hero`, `FeatureGrid` mostram esse floor card — não é
falha).

`Header` (2026-08-20): chrome de homepage interna. Sem os dois CTAs
(nav “Fale conosco” e pill do ticker). `<nav>` vazio (sem Sobre/
Catálogo/Blog); só Redes na barra. Preview autorado em
`.design-sync/previews/Header.tsx` com sessão + um aviso
`Palestra`/`16h` — o default vazio some a faixa de aviso e o floor
card não mostra o ticker. Relógio/clima no centro (Open-Meteo no
escritório no SSR; GPS + reverse geocode no client). Chip de conta no
eixo direito. Busca ícone que expande o campo, sem backend.

## Known render warns

- Nenhum `[FONT_MISSING]` pendente em 2026-08-19: JetBrains Mono
  (`--font-mono`) e Inter Tight (fallback de `--font-body`) viraram fontes
  reais (`@font-face` local, variable) — ver `docs/design-system.md`.

## Re-sync risks

- `pkg`/`globalName` (`mletras`/`Mletras`) foram escolhidos arbitrariamente —
  ajustar se o projeto adotar um nome de design system oficial.
- **Ordem de `@layer` quebrada no bundle do converter**: `_ds_bundle.css`
  concatena o CSS colocado dos componentes (via esbuild, bundling do JS
  entry) ANTES do conteúdo de `styles.css` (`cfg.cssEntry`, appended depois).
  Como a ordem de prioridade de `@layer` é definida pela primeira aparição de
  cada nome no documento (não pela declaração `@layer a, b, c;` em si, se o
  nome já apareceu antes), o layer `components` acaba registrado ANTES de
  `base` no `_ds_bundle.css` final — invertendo a prioridade pretendida
  (`components` deveria vencer `base`, mas nesse bundle `base` vence).
  Sintoma visível: `Header` floor card renderiza o `<h1>` com
  `color: var(--heading-color)` (do layer `base`) em vez de `color: inherit`
  (do layer `components`, que deveria ganhar) — texto escuro ilegível sobre
  fundo navy.
  **Isso é um artefato da ordem de concatenação do converter, não um bug do
  app real** (no Next.js, `layout.tsx` importa `styles.css` primeiro,
  estabelecendo a ordem de layers antes de qualquer CSS de componente).
  Não tentei corrigir (exigiria fork de `lib/bundle.mjs`, que a skill
  recomenda não forkar). Se isso voltar a aparecer em renders futuros do
  design system, considerar pedir upstream fix ou reordenar manualmente o
  `_ds_bundle.css` pós-build.
- `--logo-width`/`--logo-height`/`--width-10..90` (`styles.css`) não são
  usados por nenhum dos 5 componentes — preparação futura, não removidos.
