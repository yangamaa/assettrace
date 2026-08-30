# AssetTrace

Cloud ITAM para pequenas e médias empresas: inventário de ativos, responsáveis, movimentações e AuditorIA Preditiva.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (banco, autenticação e RLS)
- Zod nas Server Actions
- Lucide React + Recharts

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

A aplicação sobe em `http://127.0.0.1:43123`.

Sem variáveis do Supabase, o app usa persistência local em `.data/store.json` (servidor, não localStorage) e entra automaticamente como Marina Costa, da empresa NovaTech Sistemas. Isso existe só para desenvolvimento e preview.

## Conectar o Supabase

1. Crie um projeto no Supabase.
2. Preencha `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

A service role nunca é enviada ao navegador. Use-a apenas em Server Actions.

3. Rode a migração `supabase/migrations/0001_init.sql` no SQL Editor.
4. Crie a primeira conta em `/login` (ou `/cadastro`). O trigger cria `companies` + `profiles` e as políticas RLS restringem tudo por `company_id`.

## Telas

- `/dashboard` — patrimônio, status, movimentações
- `/inventario` — busca, filtros, cadastro e edição
- `/auditoria-preditiva` — análise preditiva e alertas

## Regras principais

- Ativo sempre pertence a uma empresa
- Número de série único por empresa
- Equipamento em manutenção não pode ser reatribuído
- Baixado não entra no estoque disponível
- Toda alteração relevante gera movimentação
- Auditoria considera idade, histórico de manutenção, categoria e status
