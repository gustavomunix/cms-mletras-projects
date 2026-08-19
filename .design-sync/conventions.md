# MLetras Design System — conventions

Vanilla CSS design system (sem Tailwind), consumido via `styles.css` (cascade
layers) + 5 componentes React que já colocam seu próprio CSS. Nenhum
provider/wrapper é necessário — nem os tokens nem os componentes dependem de
contexto React.

## Setup

Só link `styles.css` — ele `@import`a tudo (tokens, fontes, layout,
utilities, CSS de cada componente) via cascade layers, nesta ordem de
precedência: `fonts, reset, tokens, base, layout, utilities, components,
overrides`. Componentes não precisam de wrapper: são funções puras que
recebem props e retornam JSX com classes do design system.

## Padrão de CSS por componente

Todo componente (`Header`, `Hero`, `FeatureGrid`, `FeatureCard`, `Footer`)
segue a mesma receita — reproduzir isso em qualquer composição nova:

```css
@layer components {
  @scope (.bloco-raiz) {
    :scope { /* estilos do container */ }
    .bloco-raiz__elemento { /* filho, nomenclatura BEM-like */ }
  }
}
```

Nomenclatura de classe é sempre `.bloco` (raiz, casa com o nome de
`@scope`) + `.bloco__elemento` — nunca BEM completo com modificador `--`,
nunca CSS Modules, nunca classe fora de `@scope`.

## O vocabulário de tokens (`var(--*)`)

Tudo em `oklch()`, custom properties em `:root`:

- **Cores**: `--primary`, `--accent`, `--neutral`, `--base` — cada uma com
  `-dark`, `-ultra-dark`, `-light`, `-ultra-light` e `-trans-{10..90}`.
  Shades WCAG-checked só em primary: `--primary-500/600/700`.
- **Surface aliases** (`--surface-page`, `--surface-deep`, `--surface-card`,
  `--surface-card2`, `--bg`, `--border`) existem, mas a prática real hoje é
  mista: a maioria dos componentes usa a cor raw diretamente
  (`--primary-ultra-dark` em vez de `--surface-deep`, `--border-color` em vez
  de `--border`) — os aliases são o padrão recomendado, não o predominante.
- **Spacing** (fluido 360px→1280px): `--space-xs` … `--space-xxl`,
  `--space-section`. Gaps derivados: `--grid-gap`, `--card-gap`,
  `--content-gap`.
- **Type scale**: corpo `--text-xs` … `--text-xxl`; headings `--h1` … `--h6`
  (auto no `h1`-`h6`) + `--heading-hero` (`.hero`) / `--heading-lead`
  (`.lead`) pra display fora da hierarquia h1-h6.
- **Radius**: `--radius-s/m/l/xl`, mais `--radius-btn`/`--radius-pill`/
  `--radius-circle`.
- **Grid**: `--grid-1` … `--grid-12`, assimétricos `--grid-{1..4}-{1..4}`.

## Fontes

Todas reais, locais, variable weight: `Satoshi` (`--font-body`), `Inter
Tight` (fallback de `--font-body`), `Cabinet Grotesk` (`--font-heading`),
`JetBrains Mono` (`--font-mono`).

## `.btn` — a classe utilitária de botão

`.btn` + cor obrigatória + tamanho opcional: `<a class="btn btn-pri btn-l">`.
Cores: `btn-pri`, `btn-acc`, `btn-dark`, `btn-white`, `btn-ghost`,
`btn-ghost-white`. Tamanhos: `btn-xs`, `btn-s`, (`btn-m` = default, 44px),
`btn-l`, `btn-xl`.

## Componentes hoje

Só 5 componentes de página existem: `Header`, `Hero`, `FeatureGrid` (recebe
`FeatureCard[]`, define seu próprio `container`), `FeatureCard`, `Footer`.
São montados linearmente em `page.tsx` (`Header → Hero → FeatureGrid →
Footer`) — ainda sem CMS/Payload por trás, dados hardcoded esperando uma
collection `Pages`/blocks futura.

## Onde a verdade mora

`styles.css` na raiz deste bundle é o entry point único — seu `@import` é
tudo que um design renderizado recebe (inclusive `_ds_bundle.css`, o CSS
colocado dos componentes). `guidelines/design-system.md` e
`guidelines/frontend-architecture.md` têm a fundamentação completa (matemática
dos tokens, checklist de componente novo).

## Exemplo

```tsx
import { Header, Hero, FeatureGrid, Footer } from 'mletras'

<Header userEmail="user@example.com" />
<Hero
  title="Bem-vindo"
  lead="Texto usando a escala fluida padrão."
  actions={[{ href: '/comecar', label: 'Começar', variant: 'pri' }]}
/>
<FeatureGrid features={[{ title: 'Recurso', description: 'Descrição.' }]} />
<Footer />
```
