# Sistema de Movimento

Vocabulário único de animação pro projeto. Toda animação sai de
`src/lib/motion.ts` — nenhum componente inventa spring, duração ou distância
própria. Igual ao que `styles.css` é pra cor e espaçamento.

Stack: [Motion](https://motion.dev) (pacote `motion`, sucessor do
`framer-motion`), importado de `motion/react` em Client Components e de
`motion/react-client` em Server Components.

## Quem é dono do quê

A regra que decide onde a animação mora:

| Situação | Dono | Por quê |
| --- | --- | --- |
| `:hover`, `:focus-visible`, `:active` | CSS | Não depende de estado React. `transition` no CSS é mais barato e não re-renderiza. |
| Revelação de 1 propriedade em 1 elemento, sem orquestração (ex.: `inline-size` do campo de busca) | CSS | Motion aqui só adicionaria peso. |
| Entrada em mount (`initial` → `animate`) | Motion | Precisa de estado inicial no HTML do SSR. |
| Saída em unmount (`exit`) | Motion | CSS não consegue animar antes de remover do DOM. |
| Orquestração — vários elementos em cascata | Motion | `staggerChildren` escala com qualquer quantidade de itens. |
| Painel/drawer/dropdown dirigido por estado React | Motion | Estado já está no React; espelhar em classe CSS duplica a verdade. |
| Movimento ligado a scroll ou gesto | Motion | `useScroll`/`useSpring` sem re-render. |

Regra curta: **CSS reage ao ponteiro, Motion reage ao estado.**

## Vocabulário — `src/lib/motion.ts`

### Springs

Springs são declarados por `visualDuration` + `bounce`, nunca por
`stiffness`/`damping` — `visualDuration` é o tempo até o elemento *parecer*
que chegou, que é o que se ajusta no olho.

| Preset | `visualDuration` | `bounce` | Usar em |
| --- | --- | --- | --- |
| `springs.snappy` | 0.4 | 0.1 | Item de lista, campo de form, entrada em scroll. Padrão. |
| `springs.soft` | 0.55 | 0.2 | Container que carrega filhos (card, modal). |
| `springs.bouncy` | 0.6 | 0.5 | Um único elemento de destaque por tela (símbolo da marca). |
| `springs.panel` | 0.45 | 0 | Drawer/offcanvas. `bounce: 0` — painel de borda não quica. |

### Tweens

Tween só onde spring não faz sentido: troca de conteúdo e colapso de altura.

| Preset | Duração | Usar em |
| --- | --- | --- |
| `fades.swap` | 0.18s | Troca de ícone (menu ↔ fechar). |
| `fades.crossfade` | 0.25s | Troca de conteúdo (carrossel de avisos), scrim. |
| `fades.collapse` | 0.2s | `height: 0` ↔ `height: auto`. |

### Escalas

| Token | Valores | Nota |
| --- | --- | --- |
| `stagger.tight` / `normal` / `loose` | 0.06 / 0.07 / 0.1 | Intervalo entre filhos. `tight` é o padrão; `loose` só com ≤3 filhos. |
| `travel.nudge` / `short` / `long` | 4 / 12 / 24 px | Distância de deslocamento. Entrada nunca viaja mais que `long`. |
| `inViewOnce` | `{ once: true, amount: 0.25 }` | Viewport padrão do `whileInView`. |

### Variants

| Variant | Estados | Usar em |
| --- | --- | --- |
| `containerVariants` | `hidden` / `visible` | Pai que só orquestra, sem estilo próprio. |
| `fadeUp` | `hidden` / `visible` | Item genérico. O cavalo de batalha. |
| `popIn` | `hidden` / `visible` | Elemento de destaque único (marca, ícone-herói). |
| `cardIn` | `hidden` / `visible` | Card/modal que também orquestra os filhos. |
| `collapseIn` | `hidden` / `visible` | Bloco que abre altura (mensagem de erro). |
| `panelInlineEnd` | `closed` / `open` | Drawer entrando pela borda `inline-end`. |
| `panelItemInlineEnd` | `closed` / `open` | Filho do drawer. |
| `scrimVariants` | `closed` / `open` | Fundo escuro sob o drawer. |
| `dropdownVariants` | `hidden` / `visible` / `exit` | Menu suspenso ancorado. |

Nomes de estado não são decorativos:

- `hidden`/`visible` — entrada que acontece **uma vez** (mount, scroll).
- `closed`/`open` — estado que **alterna** e volta.

Precisa de um variant novo? Só se nenhum acima descreve o movimento.
Composição vem primeiro: `{ ...springs.soft, staggerChildren: stagger.tight }`.

## Orquestração

Motion propaga variants por **contexto React**, não por DOM. Elementos comuns
no meio da árvore (`<nav>`, `<ul>`) não quebram a cascata — o próximo
componente `motion` abaixo é considerado filho direto.

```tsx
<motion.div variants={cardIn} initial="hidden" animate="visible">
  <motion.span variants={popIn} />          {/* stagger 1 */}
  <motion.p variants={fadeUp} />            {/* stagger 2 */}

  <motion.form variants={containerVariants}> {/* stagger 3 — e abre nova cascata */}
    <motion.label variants={fadeUp} />       {/*   sub-stagger 1 */}
    <motion.label variants={fadeUp} />       {/*   sub-stagger 2 */}
  </motion.form>
</motion.div>
```

O filho só declara `variants` — `initial`/`animate` vêm herdados. Repetir
`initial="hidden"` no filho quebra a herança.

Cascatas aninhadas: cada nível soma seu `delayChildren`. Dois níveis é o
limite prático; três e o último item chega tarde demais.

## `prefers-reduced-motion`

Três frentes, cada uma com seu mecanismo:

1. **Componentes Motion** — `<MotionConfig reducedMotion="user">` na raiz do
   componente. Motion corta transform/layout e mantém opacidade, que é o
   comportamento acessível correto. Nunca escrever override manual por
   animação.
2. **Motion values** (`useScroll`, `useSpring`, `useTransform`) — **não** são
   cobertos por `MotionConfig`. Precisa de `useReducedMotion()` na mão. É o
   caso do progresso de scroll do `Header`, que endurece o spring
   (`stiffness: 1000, damping: 100`) pra virar salto instantâneo.
3. **CSS** — sempre `@media (prefers-reduced-motion: no-preference)`, nunca
   `reduce`. Movimento é opt-in; assim não existe animação sem fallback.

## SSR e Server Components

`initial="closed"` (nome de variant, não `false`) faz o Motion serializar os
estilos iniciais no HTML do SSR. Consequências práticas:

- Não existe flash do estado final antes de hidratar.
- Se o JS falhar, o elemento fica **no estado inicial**. Por isso o painel
  offcanvas não precisa mais de `transform: translateX(100%)` no CSS: o SSR já
  entrega `transform: translateX(100%)` inline.
- Um card com `initial="hidden"` fica invisível se a hidratação falhar. Vale
  pra decoração, não pra conteúdo crítico.

Server Component que precisa animar não vira Client Component — importa
`motion/react-client`:

```tsx
import * as motion from 'motion/react-client'
import { containerVariants, fadeUp, inViewOnce } from '@/lib/motion'

// Footer segue Server Component
<motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={inViewOnce}>
```

Restrição: props atravessam a fronteira RSC, então tudo tem que ser
serializável. Variants são objetos puros — passam. Função em `variants` ou
`transition` (ex.: `delay: (i) => i * 0.1`) não passa.

## Painéis com foco preso

Drawer, modal e qualquer coisa com focus trap ficam **montados**, alternando
`animate={isOpen ? 'open' : 'closed'}`. Não usar `AnimatePresence` pra
desmontar:

- refs (`panelRef`) continuam válidos, o `useEffect` do focus trap não corre
  atrás de nó que ainda não existe;
- sem corrida entre desmonte e restauração de foco.

Painel fechado recebe `inert`. Isso resolve de uma vez o que `opacity: 0` não
resolve: links fora da tela param de receber Tab, o scrim transparente para de
comer clique, e leitor de tela ignora a subárvore. `AnimatePresence` fica pro
que realmente entra e sai do DOM: dropdown, mensagem de erro, item de
carrossel.

## Anti-padrões

**Motion e CSS disputando `transform` no mesmo elemento.** Motion deixa
`transform` inline; inline vence regra de folha de estilo. Um
`motion.button` com `.btn:hover { transform: translateY(-2px) }` perde o
hover. Solução: envolver o botão num `motion.div` e animar o wrapper.

**Stagger por `nth-child`.** Era o que o offcanvas fazia — delays fixos até o
5º item, e o 6º entrava sem delay. `staggerChildren` não tem teto.

**`AnimatePresence` dentro da condição.** `{open && <AnimatePresence>…}`
desmonta o próprio `AnimatePresence` e a saída nunca roda. A condição vai
**dentro**.

**`height: 'auto'` sem `overflow: hidden`** no elemento que colapsa — o
conteúdo escapa durante a transição.

**Testar screenshot sem esperar assentar.** Spring com `visualDuration 0.55`
não terminou em 1.8s de espera; o print sai no meio e parece bug de layout.
Esperar condição, não tempo:

```js
await page.waitForFunction(() => getComputedStyle(document.querySelector('.card')).opacity === '1')
```

## Checklist — componente novo

1. Existe estado React envolvido? Não → CSS, fim.
2. Importar variant de `@/lib/motion`. Nenhum serve? Compor com `springs`/
   `travel`/`stagger` existentes antes de criar preset novo.
3. Nomear estados: `hidden`/`visible` pra entrada única, `closed`/`open` pra
   alternância.
4. Pai orquestra (`containerVariants` ou `cardIn`), filho só declara
   `variants`.
5. `<MotionConfig reducedMotion="user">` na raiz. Usa motion value? Somar
   `useReducedMotion()`.
6. Server Component → `motion/react-client`.
7. Tem foco preso? Manter montado + `inert` quando fechado.
8. Conferir que nenhuma regra CSS anima `transform` no mesmo elemento.

## Aplicação atual

| Componente | Movimento | Presets |
| --- | --- | --- |
| `LoginForm` | Card entra, marca dá pop, campos em cascata, erro colapsa + shake | `cardIn`, `popIn`, `fadeUp`, `containerVariants`, `collapseIn` |
| `Header` — avisos | Crossfade em rotação automática | `fades.crossfade`, `travel.nudge` |
| `Header` — menu Redes | Dropdown com entrada e saída | `dropdownVariants` |
| `Header` — botão do menu | Troca de ícone com rotação | `fades.swap` |
| `Header` — offcanvas | Painel desliza, itens em cascata, scrim em fade | `panelInlineEnd`, `panelItemInlineEnd`, `scrimVariants` |
| `Header` — barra fixa | Encolhe/esconde por progresso de scroll | `useScroll` + `useSpring` + `useReducedMotion` |
| `Header` — busca | Campo expande | CSS (`transition: inline-size`) |
| `Footer` | Colunas entram em cascata ao entrar na viewport | `containerVariants`, `fadeUp`, `inViewOnce` |

Micro-interações (hover de link, underline da nav, seta do offcanvas, lift do
botão) seguem em CSS por decisão, não por omissão.
