# CMS Multiverso das Letras — Payload CMS

Payload CMS 3.x nativo em Next.js App Router, gerenciado com pnpm. Admin
vanilla (sem reskin), banco Postgres, storage S3-compatible opcional.

## Contrato de portabilidade

- **Banco**: Postgres via `DATABASE_URL` (`@payloadcms/db-postgres`) —
  qualquer Postgres (local, Neon, RDS, Supabase) funciona sem mudar código.
- **Storage de mídia**: disco local por padrão. Se `S3_BUCKET` estiver
  definido no `.env`, o plugin `storage-s3` ativa e passa a usar o endpoint
  S3-compatible configurado (R2, S3 real, etc.) — troca é só env var, sem
  tocar em `payload.config.ts`.
- **Destino de deploy**: deliberadamente não decidido ainda. O código não tem
  binding específico de nenhuma plataforma (Vercel/AWS/Cloudflare).

## Requisitos

- Node >= 20.9
- pnpm >= 10 (`packageManager` já fixado no `package.json`)
- Docker (só para o Postgres local — a aplicação roda nativa via `pnpm dev`,
  não em container)

## Desenvolvimento local

```bash
cp .env.example .env   # ajustar se necessário
docker compose up -d   # sobe Postgres em localhost:5433
pnpm install
pnpm dev                # http://localhost:3000/admin
```

Primeiro acesso cria o admin em `/admin/create-first-user`.

Porta do Postgres é `5433` (não `5432`) no host, para não conflitar com
outros Postgres locais já rodando. Ver `docker-compose.yml`.

## Migrations

Em dev, o Payload sincroniza o schema automaticamente ("push"). Antes de
qualquer deploy, gerar e versionar migrations:

```bash
pnpm payload migrate:create
pnpm payload migrate
```

## Storage S3 (opcional, staging/produção)

Preencher no `.env`:

```
S3_BUCKET=...
S3_ENDPOINT=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=true   # necessário para MinIO/endpoints self-hosted; false para S3/R2 nativos
```

Sem essas variáveis, uploads ficam em disco local (`./media`).

## Collections

- `Users` — auth nativa do Payload.
- `Media` — upload, storage local ou S3 conforme acima.

Novas collections entram conforme o modelo de conteúdo for definido.
