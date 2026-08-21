# Payload CMS — o que é dinâmico e como foi feito

Wiki viva: atualizar esta página a cada novo campo/collection/global que
passe a controlar conteúdo do frontend. Objetivo: qualquer pessoa olhar
aqui e saber, sem ler código, **o que vem do CMS** e **como reproduzir o
padrão** pra um novo pedaço de conteúdo.

## Padrão geral

1. Campo dinâmico vive num **global** (conteúdo singleton, ex.: header,
   footer, configurações do site) ou numa **collection** (lista de itens,
   ex.: posts, projetos regionais). Definição em `src/globals/*.ts` ou
   `src/collections/*.ts`.
2. Registrar em `src/payload.config.ts` (`globals: [...]` /
   `collections: [...]`).
3. Buscar o dado em **Server Component** (`page.tsx` ou futuro layout),
   nunca dentro do componente de apresentação — componentes em
   `src/components/*` só recebem props (ver
   [`frontend-architecture.md`](./frontend-architecture.md)).
4. Rodar `pnpm run generate:types:payload` depois de qualquer mudança de
   schema — sem isso o TypeScript do Local API fica desatualizado
   (`src/payload-types.ts`, arquivo gerado, nunca editar à mão).
5. Banco é D1/SQLite (`@payloadcms/db-d1-sqlite`), não Mongo — schema novo
   precisa de migração pra produção (ver seção "Migrações" abaixo). Em
   dev o Payload faz *push* automático do schema, sem precisar gerar
   migração pra testar localmente.

## O que já é CMS-driven

### Avisos do header (`header-announcement`)

- **Onde**: `src/globals/HeaderAnnouncement.ts`.
- **O quê**: lista de mensagens em loop na topbar do `Header`
  (`site-header__announce`), cada uma com tipo/badge (`novidade` /
  `mensagem` / `aviso` / `alerta`), texto, e um **CTA opcional** (texto de
  botão + link). Sem CTA, a mensagem é só texto informativo — não força
  link nenhum.
- **Campos** (dentro do array `messages`): `enabled` (checkbox, entra ou
  não no loop), `badge` (select), `text` (obrigatório), `ctaLabel` +
  `ctaHref` (opcionais — `ctaHref` só aparece no admin quando `ctaLabel`
  está preenchido, e é obrigatório nesse caso via `validate`). Fora do
  array: `intervalSeconds` (2–30s, só aparece com mais de 1 mensagem).
- **Loop no front**: `Header.tsx` guarda um índice (`announceIndex`) e
  avança de tempos em tempos (`setInterval`, respeitando
  `intervalSeconds`); troca de mensagem anima com `AnimatePresence`
  (`motion/react`). Roda só se houver mais de 1 mensagem ativa. Pausa
  sozinho no hover/focus do bloco (`isAnnouncePausedRef`) — acessibilidade
  (WCAG 2.2.2, conteúdo que atualiza automaticamente precisa dar pra
  pausar). Container tem `role="status"` pra leitor de tela anunciar a
  troca.
- **Fluxo**: `src/app/(frontend)/(app)/layout.tsx` chama
  `payload.findGlobal({ slug: 'header-announcement' })`, filtra
  `messages` por `enabled && text`, mapeia pra
  `{ label, badge, ctaLabel, ctaHref }` e passa como prop `announcements`
  (array) + `announcementIntervalSeconds` pro `Header`. Array vazio =
  nada renderiza.
- **Editar conteúdo**: `/admin` → Globals → "Avisos do Header".

### Setor do usuário (`Users.setor`)

- **Onde**: `src/collections/Users.ts`.
- **O quê**: campo `select` obrigatório — `Administrador`, `Equipe de
  TI`, `Marketing`, `Ecommerce`, `Relações com mercado`, `Editorial`.
  Sem sistema de role: `setor === 'administrador'` É o flag de admin,
  usado direto no `access` da collection e do próprio campo.
- **Access**: só quem já é `administrador` cria/edita usuário ou muda o
  `setor` de alguém; qualquer usuário autenticado lê `setor` de
  qualquer outro; cada usuário pode editar seu próprio perfil (fora o
  campo `setor`). `saveToJWT: true` — não bate no banco pra checar
  `setor` em todo access control.
- **Primeiro admin**: collection com `auth:true` e zero documentos cai
  no fluxo nativo do Payload de "criar primeiro usuário", que ignora
  `access.create`. Se isso não disparar, criar via Local API
  (script one-off), nunca relaxando o `access` pra abrir brecha.

## O que ainda NÃO é CMS-driven (pendências conhecidas)

- **Redes/projetos regionais do nav (`Header` → dropdown "Redes")** —
  lista de UFs/cidades (Santa Catarina, Mato Grosso, Cuiabá-MT, Natal-RN,
  Tocantins, Amazonas, Araguaína-TO, Pará, João Pessoa-PB, Rondônia,
  Iaçu-BA, Brasília-DF etc.) hoje é um array estático `DEFAULT_REDES` em
  `src/components/Header/Header.tsx`, com hrefs placeholder
  (`/projetos/<slug>`). **Falta**: uma collection (ex.: `regional-projects`
  ou `redes`) com campos `label`, `href`/`slug`, `order`, pra alimentar
  esse dropdown via `layout.tsx` do mesmo jeito que o aviso do header
  (também buscado em `layout.tsx`, não em `page.tsx`).
- Nav principal (`Sobre`, `Catálogo`, `Blog`, `Contato`, CTA) e links
  sociais (LinkedIn/Instagram) — ainda hardcoded em `DEFAULT_NAV` /
  `DEFAULT_SOCIAL` no mesmo arquivo.
- Collection `Pages`/blocks pra home — ver
  [`frontend-architecture.md`](./frontend-architecture.md), ainda não
  existe.

## Migrações (D1/SQLite)

Diferente de Mongo, o adapter SQLite/D1 precisa de migração explícita pra
produção — schema novo não "aparece" sozinho no banco remoto.

- **Dev**: `pnpm dev` faz push automático do schema pro D1 local
  (`.wrangler/state`). Não precisa gerar migração pra testar.
- **Antes de deploy**: gerar a migração do que mudou desde a última —
  `pnpm payload migrate:create <nome-da-mudanca>` — e commitar o arquivo
  gerado em `src/migrations/`. O array `migrations` (`src/migrations/index.ts`)
  é passado como `prodMigrations` pro `sqliteD1Adapter` em
  `payload.config.ts`; `pnpm run deploy:database` roda `payload migrate`
  usando esse array contra o D1 remoto.
- **Pendência**: a migração para a tabela `header-announcement` ainda
  não foi gerada/commitada. Rodar `pnpm payload migrate:create
  add-header-announcement` antes do primeiro deploy que inclui esse
  global. Mesma pendência pro campo `setor` em `Users` — gerar
  `pnpm payload migrate:create add-users-setor` antes do deploy que
  inclui essa mudança.
- **Cuidado — campo `required: true` novo em collection com linhas
  existentes**: se não tiver `defaultValue`, o push automático do dev
  pede confirmação (`Warnings detected during schema push... DATA LOSS
  WARNING`) e, se aceito, o SQLite recria a tabela e **apaga as linhas
  que não conseguem satisfazer o NOT NULL** (aconteceu com `setor`:
  o usuário local existente foi apagado ao aceitar o push). Antes de
  aceitar esse prompt em dev com dado que importa, ou dar
  `defaultValue` ao campo, ou anotar quem precisa ser recriado depois
  via Local API.

## Fix incidental

Ao integrar o global acima, corrigi um import quebrado em
`payload.config.ts`: `import migrations from './db/migrations'` (pasta
inexistente, `default export` que não existe) virou `import {
migrations } from './migrations'`, e o array passou a ser efetivamente
usado como `prodMigrations` do adapter — antes disso a variável nem era
consumida.
