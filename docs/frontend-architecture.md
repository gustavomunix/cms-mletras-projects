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
3. **`src/lib/motion.ts`** — vocabulário de animação (springs, tweens,
   variants). Toda animação de estado sai daqui; CSS cuida só de hover/focus.
   Ver [`motion-system.md`](./motion-system.md).

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

## Rotas — login como gate, `(app)` pra tudo autenticado

`/` é a tela de login (`LoginForm`, client component, sem `Header`/
`Footer`) — só usuário já cadastrado pelo admin entra, sem self-signup,
sem SSO ainda. Tudo que precisa de sessão vive dentro do route group
`(app)` (não aparece na URL):

```
src/app/(frontend)/
  layout.tsx        — só <html><body>, importa styles.css. Sem fetch, sem chrome.
  page.tsx           — "/" = LoginForm. Se já tem user, redirect('/inicio').
  (app)/
    layout.tsx        — guard: sem user → redirect('/'). Busca payload.auth +
                         header-announcement, renderiza <Header/><main/><Footer/>.
    inicio/
      page.tsx          — conteúdo da home (Hero + FeatureGrid).
```

Página nova que precisa de login: criar pasta dentro de `(app)/` — o
guard e o chrome (`Header`/`Footer`) já vêm de graça do layout do
grupo, não duplicar a checagem de `payload.auth` em cada `page.tsx`.
Página pública nova (sem login): criar direto em `(frontend)/`, fora do
grupo `(app)`.

`LoginForm` (`src/components/LoginForm/`) mostra `logo-color.svg`
(`public/assets/icons/`, mesmo arquivo do `Header`/`Footer` em fundo
claro) + form de e-mail/senha. Faz POST pra `/api/users/login` (REST
nativo do Payload pra collection `users`) — a resposta já seta o cookie
de auth, não precisa de lógica extra de sessão no front. Erro de
credencial mostra a mensagem que o Payload devolve
(`data.errors[0].message`, já em pt-BR), sem `alert()`.

**Logout**: botão "Sair" no `Header` (só renderiza quando `userEmail`
existe) — `onClick` faz POST pra `/api/users/logout` (REST nativo,
limpa o cookie/sessão no Payload) e depois `router.push('/')` +
`router.refresh()`. `/admin` (painel do Payload) já tem logout próprio
embutido, não precisa de nada custom lá.

## Lint de JS/TS (ESLint) — Next 16 usa flat config nativo

`eslint.config.mjs` importa `eslint-config-next/core-web-vitals` e
`eslint-config-next/typescript` **direto**, sem `FlatCompat`:

```js
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, /* ... */]
```

A partir do Next 16, `eslint-config-next` exporta flat config nativo
(array de objetos com plugins já instanciados), não mais o formato
legado `extends: ['next/core-web-vitals']` resolvido via
`FlatCompat.extends(...)`. Usar `FlatCompat` aqui quebra: ele tenta
envelopar um pacote que já é flat config, duplica a instância do
plugin `react` e trava o ESLint inteiro com `TypeError: Converting
circular structure to JSON` ao tentar reportar o erro de validação —
sem stack trace útil apontando pra causa real. Se `pnpm lint` travar
assim de novo após upgrade do Next/`eslint-config-next`, é essa
incompatibilidade — checar
`node_modules/next/dist/docs/*/eslint.md` pro formato atual esperado
antes de tocar no config.

## Estado atual

- `page.tsx` da home (`(app)/inicio/page.tsx`) só compõe: `Hero` →
  `FeatureGrid`.
- `Footer` já aceita `footerLinks`/`social` via props (pronto pra virar
  CMS-driven), mas `(app)/layout.tsx` hoje renderiza `<Footer />` sem
  passar nada — usa os defaults hardcoded no próprio componente.
- Payload já alimenta o usuário autenticado (`payload.auth`) e o aviso
  da topbar do `Header` (global `header-announcement`) — ver
  [`payload-cms.md`](./payload-cms.md) pro que é CMS-driven e o que
  ainda é hardcoded (nav, redes/UFs, resto da home), esperando a
  collection `Pages`/blocks.
- SSO Microsoft: não implementado ainda — avaliar quando virar
  requisito concreto (Payload aceita auth strategy customizada/OIDC).
