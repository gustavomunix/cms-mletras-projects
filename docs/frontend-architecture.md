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
