# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

# CSS

Toda CSS neste projeto segue a skill `modern-css` à risca — `@layer`,
`@scope`, nesting com `&`, `:has()`, `clamp()`/`cqi` fluido, `oklch()`,
`color-scheme`/`light-dark()`, cores relativas (`oklch(from ...)`),
propriedades lógicas, `text-wrap`, `prefers-reduced-motion:
no-preference`. Ver `docs/design-system.md` e
`docs/frontend-architecture.md`.

## Componentes — CSS por componente

Todo componente em `src/components/<Nome>/` segue o padrão (ver
`Header.css`/`Hero.css` como referência canônica):

- Arquivo `<Nome>.css` importado direto no `.tsx` do componente
  (`import './Nome.css'`).
- Regras dentro de `@layer components { @scope (.raiz-do-componente) { ... } }`
  — nunca CSS solto fora de layer/scope.
- Nomenclatura de classe BEM-like: `.bloco` (raiz) + `.bloco__elemento`
  (ex.: `.site-header`/`.site-header__inner`/`.site-header__logo`,
  `.hero-section`/`.hero-section__subtitle`). Sem modificador `--` até
  surgir a necessidade real.
- Só `var(--*)` de `styles.css` (canônico) — nunca valor hardcoded de cor,
  espaçamento ou radius.

## Lint

`pnpm lint:css` roda `stylelint` (`stylelint-config-standard` +
`stylelint-config-modern`) sobre `src/**/*.css` — obrigatório passar antes
de considerar uma mudança de CSS pronta. Ver `docs/design-system.md#lint`.

# Git

Nunca rodar `git commit` sem o usuário pedir explicitamente naquele turno —
inclusive para fixups pequenos e óbvios (ex.: correção de `.gitignore`).
Fazer o trabalho (edits, staging) é ok; commitar não. Depois de terminar uma
mudança commit-worthy, parar e perguntar ou deixar a working tree suja
avisando o que está staged/mudado — esperar um "commita"/"faz o commit"
explícito.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
