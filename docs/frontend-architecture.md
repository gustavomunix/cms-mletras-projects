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

## Estado atual

- `page.tsx` só compõe: `Header` → `Hero` → `FeatureGrid` → `Footer`.
- Nenhum dado ainda vem do Payload além do usuário autenticado
  (`payload.auth`) — o resto é hardcoded em `page.tsx`, esperando a
  collection `Pages`/blocks.
