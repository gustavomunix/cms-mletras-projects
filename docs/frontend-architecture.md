# Arquitetura de Frontend

Vanilla CSS, sem Tailwind. Duas camadas:

1. **`src/app/(frontend)/styles.css`** — global, importado 1x em
   `layout.tsx`. Design system: reset, tokens, base, layout, utilities.
   Ver [`design-system.md`](./design-system.md). Nunca colocar estilo
   específico de uma página/componente aqui.
2. **`src/components/<Nome>/`** — 1 pasta por componente reutilizável,
   `.tsx` + `.css` colocado, CSS dentro de `@layer components { @scope
   (.classe-raiz) { ... } }`. `@scope` isola o seletor sem precisar de
   BEM ou CSS Modules — Baseline widely available, Next.js não precisa
   de config nenhuma (é CSS puro).

### ⚠️ Ordem de import em `layout.tsx` importa

`styles.css` declara a ordem das layers uma única vez
(`@layer fonts, reset, tokens, base, layout, utilities, components,
overrides;`). Ordem de layer no CSS é definida pela **primeira
aparição de cada nome no bundle inteiro** — não pela ordem em que os
arquivos são escritos dentro de cada `@layer` block.

Import de CSS de componente (`Header.css`, `Footer.css`, etc.) em
`layout.tsx` **tem que vir depois** do `import './styles.css'`. Se
vier antes, o `@layer components` do componente é a primeira layer
declarada no documento inteiro (prioridade mais baixa), e `reset`/
`base`/`utilities` passam a sobrescrever estilo de componente — quebra
visual silenciosa, sem erro de build.

```tsx
// errado — components declara layer antes de styles.css existir
import { Header } from '@/components/Header/Header'
import './styles.css'

// certo
import './styles.css'
import { Header } from '@/components/Header/Header'
```

## Por que essa divisão

Payload hoje só tem as collections `Users` e `Media`
(`src/payload.config.ts`) — ainda não existe `Pages`/page builder. Mas o
site é CMS-driven e a expectativa é ganhar uma collection `Pages` com
campo `blocks`, onde cada bloco populado no admin renderiza um
componente React (Hero, Features, CTA, etc.). Escrever a home hoje como
componentes pequenos e isolados (`Header`, `Hero`, `FeatureGrid` +
`FeatureCard`, `Footer`) já deixa a base pronta pra virar blocks depois
— quando a collection existir, é só trocar os dados hardcoded de
`page.tsx` por props vindas do Payload, sem reescrever CSS.

## Checklist — criar um componente novo

1. Pasta em `src/components/NomeDoComponente/`.
2. `NomeDoComponente.tsx` — recebe dados via props (nunca busca dados
   Payload direto dentro do componente de apresentação; isso fica no
   `page.tsx`/futuro resolver de block).
3. `NomeDoComponente.css` colocado, import relativo no `.tsx`:
   ```css
   @layer components {
     @scope (.nome-do-componente) {
       :scope { /* estilos do container */ }
       /* seletores filhos aqui dentro já ficam escopados */
     }
   }
   ```
4. Usar tokens do global (`var(--space-m)`, `var(--primary)`, etc.) e
   classes utilitárias existentes (`.btn-pri`, `.hero`, `.lead`) antes de
   inventar valor novo.
5. Se o componente pode hospedar conteúdo de terceiros/slot (ex.: rich
   text vindo do Payload), usar `@scope (...) to (...)` (donut scoping)
   pra não vazar estilo pro conteúdo embutido.
6. Nomenclatura de classe é BEM-like: `.bloco` na raiz (mesmo nome do
   `@scope`) + `.bloco__elemento` pros filhos — ex.:
   `.site-header`/`.site-header__inner`/`.site-header__logo`,
   `.hero-section`/`.hero-section__subtitle`. Sem modificador `--` até
   surgir necessidade real.
7. Importar sempre pelo alias `@/...` (`@/components/NomeDoComponente/NomeDoComponente`),
   nunca caminho relativo `../../` entre pastas de nível diferente —
   `@/*` mapeia pra `./src/*` no `tsconfig.json`.

## Lint de CSS (Stylelint)

Setup padrão recomendado pela skill `modern-css` (moderncss.ai), com um
ajuste específico deste projeto (BEM). Já instalado e configurado —
isto documenta como reproduzir/manter.

- Pacotes (devDependencies): `stylelint`, `stylelint-config-standard`,
  `stylelint-config-modern`.
- Config: `stylelint.config.mjs` na raiz (projeto é `"type": "module"`,
  por isso `export default` em vez de `module.exports`):
  ```js
  export default {
    extends: ['stylelint-config-standard', 'stylelint-config-modern'],
    referenceFiles: ['src/app/**/styles.css'],
    rules: {
      'no-unknown-custom-properties': true,
      'no-unknown-custom-media': true,
      'selector-class-pattern':
        '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$',
    },
  }
  ```
- Script: `"lint:css": "cross-env NODE_OPTIONS=--no-deprecation stylelint \"src/**/*.css\""`
  — separado do `lint` (ESLint), não roda junto.

### Por que os overrides acima do padrão da skill

- `referenceFiles` + `no-unknown-custom-properties`/`no-unknown-custom-media`
  (opt-in, não vem ligado por padrão em nenhum dos dois configs): os
  tokens do projeto vivem centralizados em `styles.css` (`@layer
  tokens`) — ligar essas regras pega `var(--typo-de-nome)` em qualquer
  componente, cruzando contra a fonte única.
- `selector-class-pattern`: o `stylelint-config-standard` cobra
  kebab-case puro por padrão e rejeita `_`. Esse projeto exige BEM-like
  com `__`/`--` (ver [`design-system.md`](./design-system.md) e
  checklist de componente acima) — sem esse override, todo `.bloco__elemento`
  do projeto inteiro quebra o lint. O regex permite bloco kebab-case +
  `__elemento` opcional + `--modificador` opcional, sempre kebab-case
  dentro de cada parte.
- Glob de `referenceFiles` usa `src/app/**/styles.css` (não o caminho
  literal `src/app/(frontend)/styles.css`) porque `fast-glob` trata `(` `)`
  como sintaxe de grupo — o caminho literal quebra a resolução.

### Rodando

```
pnpm run lint:css          # só checa
pnpm run lint:css --fix    # corrige o que dá (sintaxe, notação, ordem)
```

`--fix` resolve normalização de sintaxe (`display: flex` →
`display: block flex`, `oklch(0.5 ...)` → `oklch(50% ...deg)`,
`overflow-x` → `overflow-inline`, etc.) mas **não** resolve
`no-descending-specificity` nem `no-duplicate-selectors` — esses pedem
reescrita manual (reordenar blocos por especificidade crescente, ou
mesclar seletores duplicados) preservando o comportamento visual.

Ao criar um componente novo, `pnpm run lint:css` tem que passar sem
erro antes do PR — é a rede de segurança automática pras regras da
tabela Do/Do not em
[`design-system.md`](./design-system.md#convenção-css-do--do-not).

## Estado atual

- `layout.tsx` renderiza `Header` e `Footer` fora do `<main>` — são
  landmarks fixos do site (não conteúdo de página), então vivem no
  layout raiz: `<Header /> <main>{children}</main> <Footer />`. Busca
  de dados do Payload pro `Header` (usuário autenticado, aviso da
  topbar) também mora no `layout.tsx`, não em `page.tsx`.
- `page.tsx` só compõe o conteúdo da página: `Hero` → `FeatureGrid`.
- `Footer` já aceita `footerLinks`/`social` via props (pronto pra virar
  CMS-driven), mas `layout.tsx` hoje renderiza `<Footer />` sem passar
  nada — usa os defaults hardcoded no próprio componente.
- Payload já alimenta o usuário autenticado (`payload.auth`) e o aviso
  da topbar do `Header` (global `header-announcement`) — ver
  [`payload-cms.md`](./payload-cms.md) pro que é CMS-driven e o que
  ainda é hardcoded (nav, redes/UFs, resto da home), esperando a
  collection `Pages`/blocks.
