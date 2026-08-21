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
- **O quê**: faixa interna no topo do `Header` (`site-header__announce`).
  Comunicação da operação — palestra, parceria, projeto de time,
  lembrete, número da semana. Sem tipos pré-definidos e **sem botão de
  CTA**: se o aviso tem destino, a linha inteira é o link.
- **Campos** (dentro do array `messages`): `enabled` (checkbox), `kicker`
  (text livre, max 32, opcional — `Palestra`, `Editorial`, `Parceria`),
  `metric` (text livre, max 16, opcional — `+18%`, `12 mil`, `14h`),
  `text` (obrigatório), `href` (opcional). Fora do array:
  `intervalSeconds` (2–30s, default 8, só aparece com mais de 1 aviso).
- **Loop no front**: `Header.tsx` guarda um índice (`announceIndex`) e
  avança de tempos em tempos (`setInterval`, respeitando
  `intervalSeconds`); troca de mensagem anima com `AnimatePresence`
  (`motion/react`). Roda só se houver mais de 1 aviso ativo. Pausa no
  hover/focus do bloco (`isAnnouncePausedRef`, transitório). Container
  tem `role="status"` pra leitor de tela anunciar a troca.
- ⚠️ **Lacuna de acessibilidade conhecida (WCAG 2.2.2)**: existia um
  botão explícito de Play/Pause (`aria-pressed`, sempre focável) e ele
  foi **removido a pedido**. O motivo original de existir continua
  válido: conteúdo que atualiza sozinho precisa poder ser pausado, e
  hover/focus não cobre isso — um aviso sem `href` não tem nenhum
  elemento focável dentro do bloco pra receber foco de teclado, então
  quem navega por teclado não tem como parar o carrossel. Enquanto o
  botão não voltar, as alternativas são: deixar todo aviso com `href`,
  ou dar `tabindex="0"` ao `.site-header__announce-slot` pra que o
  `onFocus` já existente seja alcançável.
- **Fluxo**: `src/app/(frontend)/(app)/layout.tsx` chama
  `payload.findGlobal({ slug: 'header-announcement' })`, filtra
  `messages` por `enabled && text`, mapeia pra
  `{ text, kicker, metric, href }` e passa como prop `announcements`
  (array) + `announcementIntervalSeconds` pro `Header`. Array vazio =
  a faixa de aviso some; relógio/clima continuam.
- **Editar conteúdo**: `/admin` → Globals → "Avisos do Header".
- **Schema**: `badge` / `ctaLabel` / `ctaHref` saíram. Em dev o push do
  SQLite recria colunas — avisos locais antigos perdem o select de tipo
  (era enum inútil). Mesma pendência de migração de produção já anotada
  abaixo.

### Role e setor do usuário (`Users.role` / `Users.setor`)

- **Onde**: `src/collections/Users.ts`, com as funções de acesso em
  `src/access/isAdmin.ts`.
- **Dois eixos independentes.** Antes existia só `setor`, e ele fazia
  dois trabalhos: departamento **e** flag de permissão
  (`setor === 'administrador'`). Isso forçava uma escolha falsa — pra ser
  admin a pessoa tinha que deixar de ter um setor real. Agora:
  - `role` — permissão: `Administrador` / `Colaborador`. É **o** flag de
    admin, checado em todo `access`. `required`, `saveToJWT: true`,
    `defaultValue: 'colaborador'`.
  - `setor` — departamento: `Equipe de TI`, `Marketing`, `Ecommerce`,
    `Relações com mercado`, `Editorial`. `Administrador` **saiu** da
    lista. `required`, `saveToJWT: true`, sem `defaultValue` de
    propósito: um default aqui rotularia gente nova silenciosamente.
  - Um administrador pode ser de **qualquer** setor. Promover alguém só
    toca `role`, nunca o `setor`.
- **Access** (`src/access/isAdmin.ts`, tipado com `Access`/`FieldAccess`):
  | Operação | Regra |
  |---|---|
  | `create` | `isAdmin` |
  | `read` | `isAuthenticated` |
  | `update` | `isAdminOrSelf` — cada um edita o próprio perfil |
  | `delete` | `isAdminNotSelf` |
  | campo `role` (create/update) | `isAdminFieldLevel` / `isAdminNotSelfFieldLevel` |
  | campo `setor` (create/update) | `isAdminFieldLevel` |
- **Guardas anti-lockout**: admin não muda o próprio `role` e não deleta
  a própria conta (`isAdminNotSelf*`, só comparação booleana, sem query).
  Isso mantém o invariante "sempre existe ≥1 admin" — sem elas, um
  clique errado exige script manual pra recuperar acesso (foi exatamente
  o que aconteceu antes deste refactor).
- **`/admin` segue aberto a todo usuário autenticado** — não existe
  `access.admin` na collection. Isso é **decisão consciente**, não
  descuido: um colaborador entra no painel com permissões reduzidas.
  Não "consertar" sem antes decidir o produto.
- **Primeiro admin — hook explícito**: `hooks.beforeChange` da collection
  força `role = 'administrador'` quando `payload.count` da collection
  retorna 0 no `create`. O fluxo nativo do Payload (tabela vazia ignora
  `access.create`) continua sendo o que libera a operação — o hook só
  define o papel, e access control roda **antes** dos hooks, então isso
  não abre brecha nenhuma. Antes esse comportamento era só um efeito
  colateral implícito, invisível no código.
  - Limitação conhecida: dois `create` simultâneos com a tabela vazia
    poderiam ambos virar admin. Irrelevante aqui — não há signup público.
- **Promover alguém depois**: script one-off via Local API
  (`pnpm payload run <arquivo>`), `payload.update` com
  `where: { email: ... }` e `data: { role: 'administrador' }`. Nunca
  relaxar o `access` pra abrir brecha. ⚠️ `role` tem `saveToJWT: true`,
  então **a pessoa precisa deslogar e logar de novo** — o cookie de
  sessão antigo carrega o papel velho.
- **Indicação visual**: `admin.defaultColumns: ['email', 'role', 'setor']`
  coloca os dois na lista de usuários do painel, e cada campo tem
  `admin.description` + `admin.width: '50%'` pra ler como dois eixos
  distintos. Nada de componente React customizado — o projeto não tem
  nenhum `admin.components`, e um `Cell` custom só pra colorir um badge
  adicionaria `generate:importmap` permanente ao fluxo sem ganho.
  No frontend, o `Header` mostra um badge "Admin" ao lado do setor
  (`site-header__account-badge` no desktop, `nav-offcanvas__badge` no
  offcanvas).
- **Tipos, não duplicação**: `Header.tsx` importa
  `User['setor']` / `User['role']` de `@/payload-types` em vez de
  redeclarar os unions à mão. Foi a duplicação antiga que espalhou
  `'administrador'` como se fosse um setor também no frontend — agora
  mexer no schema quebra o `SETOR_LABELS` em tempo de compilação.

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
- Nav principal: a prop `nav`/`DEFAULT_NAV` (placeholder vazio pra
  Sobre/Catálogo/Blog) foi removida do `Header` — ficava presa num
  container `@container (width >= 48rem)` que também escondia o
  dropdown Redes abaixo de 768px. Se voltar a existir navegação
  principal via CMS, criar como elemento próprio dentro do
  `.site-header__nav-cluster` (sempre visível, ao lado do toggle do
  offcanvas), não reintroduzir a prop vazia. Links sociais
  (LinkedIn/Instagram) ainda hardcoded em `DEFAULT_SOCIAL`. Contato /
  "Fale conosco" saíram: o site só existe na área logada; a conta
  (e-mail + setor + badge "Admin" quando `role === 'administrador'` +
  Sair) ocupa o eixo direito da top-bar.
- Collection `Pages`/blocks pra home — ver
  [`frontend-architecture.md`](./frontend-architecture.md), ainda não
  existe.
- **Access da collection `Media`** — `src/collections/Media.ts` só define
  `read: () => true`. Sem `create`/`update`/`delete`, o default do Payload
  libera pra qualquer autenticado; combinado com `/admin` aberto a todos,
  qualquer colaborador sobe e apaga mídia. Não é regressão (sempre foi
  assim), mas agora que existe `src/access/isAdmin.ts` a correção é
  barata — decidir o produto e aplicar `isAdmin`/`isAuthenticated`.

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
- **Resolvido**: `src/migrations/20260821_170618_add_users_role.ts` zerou
  a fila de pendências — como o diff é contra o último schema
  *commitado*, ela traz de uma vez `payload_kv`, as tabelas de
  `header-announcement` **e** as colunas `role`/`setor` de `users`.
- ⚠️ **Risco latente nessa migração**: a linha
  `ALTER TABLE users ADD setor text NOT NULL` **não tem `DEFAULT`**.
  Comportamento do SQLite, verificado na prática (3.51):
  - tabela **vazia** → o `ADD ... NOT NULL` sem default **passa**;
  - tabela **com linhas** → falha com
    `Cannot add a NOT NULL column with default value NULL`.

  Hoje isso é inofensivo: `wrangler.jsonc` ainda tem
  `"database_id": "DATABASE_ID"` (placeholder), então produção nunca
  rodou e o D1 remoto vai receber a migração 1 (cria `users` vazia) antes
  desta. Foi decisão **deixar sem default**: se algum dia existir usuário
  em produção antes dessa migração, é melhor ela falhar alto e forçar
  alguém a decidir o setor dessas pessoas do que rotular todas como TI
  em silêncio. O `role`, esse sim, tem `DEFAULT 'colaborador'` no SQL.
- Nota de leitura do D1 local: o miniflare usa WAL. Ler o `.sqlite` com
  `?immutable=1` **ignora o WAL** e devolve dado velho — atrapalhou a
  conferência da promoção. Pra inspecionar o estado real, copiar
  `.sqlite` + `-wal` + `-shm` juntos e consultar a cópia.
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
