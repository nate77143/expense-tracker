# Cloudflare Pages Deploy

This repo should be deployed as a Cloudflare Pages project, not through Wrangler's Vite auto-configuration flow.

## Why

- The frontend is a Vite SPA built into `dist`.
- The admin APIs live in the root `functions/` directory as Cloudflare Pages Functions.
- Letting `wrangler deploy` auto-detect the project can try to install `@cloudflare/vite-plugin`, which conflicts with this app's current Vite 4 setup.

## Repo config

- Pages config: [`wrangler.jsonc`](/d:/code/expense-tracker/wrangler.jsonc)
- Build command: `npm run build`
- Pages output directory: `dist`
- Functions directory: `functions`

## Deploy

1. Make sure you are using Node 20 or newer locally.
2. Install dependencies: `npm install`
3. Build the app: `npm run build`
4. Log in to Cloudflare: `npx wrangler login`
5. Deploy to Pages: `npm run pages:deploy`

For local Pages-style preview, use:

```bash
npm run pages:dev
```

## Required Cloudflare env vars

Set these in the Cloudflare Pages project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`

## What to avoid

- Do not use `wrangler deploy` for this repo's current setup.
- Do not let Wrangler auto-add `@cloudflare/vite-plugin` unless you intentionally upgrade the app to a Vite 6+ setup and refactor deployment around that.
