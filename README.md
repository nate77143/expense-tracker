# expense-tracker

Personal finance tracker. Vue 3 + TypeScript + Vite, Supabase (Postgres) for
auth and data, ApexCharts for reporting, deployed on Cloudflare Workers.

## Why it exists
Built to keep hands on a modern TypeScript/Vue stack alongside my day job,
which is .NET and Azure. Accounts, categories, recurring entries, and
per-period reporting with charts.

## Run locally
1. `cp .env.example .env` and add your Supabase URL and anon key
2. `npm install`
3. `npm run dev`

## Architecture
- `src/` — Vue 3 components and stores
- `supabase/migrations/` — versioned SQL schema, applied in order
- `functions/` — Cloudflare Worker endpoints
- `docs/` — screenshots and notes

## Data model
`accounts` → `entries` → `categories`, all scoped by user via RLS policies
in the migrations. Reporting aggregates per account and period.

## Status
Working. **[Screenshot in docs/]** — demo URL: **[link]**