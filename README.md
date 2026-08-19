# CMS Multiverso das Letras — Payload CMS

Payload CMS 3.x nativo em Next.js App Router, gerenciado com pnpm. Admin
vanilla (sem reskin), deploy Cloudflare Workers nativo.

## Contrato de portabilidade

- **Banco**: D1 (SQLite) via binding `D1` (`@payloadcms/db-d1-sqlite`) —
  banco serverless do Cloudflare, sem connection string; Wrangler cuida do
  binding local e remoto.
- **Storage de mídia**: sempre R2 via binding `R2` (`@payloadcms/storage-r2`)
  — sem fallback pra disco local, é parte fixa do stack.
- **Destino de deploy**: Cloudflare Workers, via `@opennextjs/cloudflare` +
  Wrangler. Decidido, não é mais genérico.

## Requisitos

- Node >= 20.9
- pnpm >= 10 (`packageManager` já fixado no `package.json`)
- Conta Cloudflare + `pnpm wrangler login` (sem Docker, sem Postgres local —
  Wrangler cria bindings locais mockados de D1/R2 automaticamente)

## Desenvolvimento local

```bash
cp .env.example .env   # ajustar se necessário
pnpm install
pnpm wrangler login    # autenticar com Cloudflare (uma vez)
pnpm dev                # http://localhost:3000/admin
```

Primeiro acesso cria o admin em `/admin/create-first-user`.

`pnpm dev` já sobe com bindings locais de D1/R2 via Wrangler — não precisa
subir nenhum container.

## Migrations

Em dev, o Payload sincroniza o schema automaticamente ("push"). Antes de
qualquer deploy, gerar e versionar migrations:

```bash
pnpm payload migrate:create
pnpm payload migrate
```

## Deploy

```bash
pnpm run deploy
```

Roda `deploy:database` (aplica migrations + `PRAGMA optimize` no D1 remoto)
seguido de `deploy:app` (build com `opennextjs-cloudflare` + deploy do
Worker). Pra ambiente não-default, setar `CLOUDFLARE_ENV` (ver
`wrangler.jsonc`).

## Collections

- `Users` — auth nativa do Payload.
- `Media` — upload, sempre via R2.

Novas collections entram conforme o modelo de conteúdo for definido.

## Logs

Logs da API não vêm habilitados por padrão (consome quota) — habilitar no
painel Cloudflare ([docs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#enable-workers-logs)).

O `payload.config.ts` usa um logger customizado em produção porque o
default do Payload (`pino-pretty`) depende de APIs Node ausentes em Workers
(`fs.write is not implemented`). Em dev continua `pino-pretty` normal.
Controla nível via `PAYLOAD_LOG_LEVEL` (`debug`, `info`, `warn`, `error`).

Se aparecer "Failed to publish diagnostic channel message" nos logs, vem da
lib `undici`. `Media` já usa `skipSafeFetch: true` pra usar fetch nativo em
vez de undici nos uploads — seguro porque Workers já bloqueia acesso a IPs
privados por padrão (proteção SSRF nativa).

## Problemas conhecidos

- **Resize de imagem**: Workers não suporta `sharp` — `crop`/`focalPoint`
  desabilitados em `Media`, `imageSizes` não funciona.
- **GraphQL**: suporte completo não garantido em Workers, aguardando fix
  upstream ([workerd#5175](https://github.com/cloudflare/workerd/issues/5175)).
- **Tamanho do Worker**: limite de 3mb no plano free
  ([docs](https://developers.cloudflare.com/workers/platform/limits/#worker-size));
  recomendado plano pago se o bundle crescer.
