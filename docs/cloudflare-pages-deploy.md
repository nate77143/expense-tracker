# Cloudflare Pages Deploy

This repo should be deployed as a Cloudflare Pages project, not through Wrangler's Vite auto-configuration flow.

## Why

- The frontend is a Vite SPA built into `dist`.
- The admin APIs live in the root `functions/` directory as Cloudflare Pages Functions.
- Letting `wrangler deploy` auto-detect the project can try to install `@cloudflare/vite-plugin`, which conflicts with this app's current Vite 4 setup.
- For this repo's Git-based Pages deploys, the Cloudflare Pages dashboard build settings are the safest source of truth.

## Repo config

- Build command: `npm run build`
- Pages output directory: `dist`
- Functions directory: `functions`
- Pages Functions compatibility flag: enable `nodejs_compat` in the Cloudflare dashboard if needed

## Deploy

### If this project uses Cloudflare Pages Git integration

Use Cloudflare's normal Pages build settings and do not set a custom deploy command.

Dashboard settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank unless your repo structure changes
- Deploy command: leave blank
- Non-production deploy command: leave blank

If your deploy log says `No build command specified. Skipping build step.`, the Pages project build command is still blank and Cloudflare will skip dependency installation before trying to bundle `functions/`.

When Cloudflare Pages is connected to Git, it automatically builds and deploys after the build finishes. Adding `npx wrangler deploy` as a deploy command makes Pages try to run the Worker deploy flow, which is the wrong product path for this repo.

### If you deploy manually with Wrangler

1. Make sure you are using Node 20 or newer locally.
2. Install dependencies: `npm install`
3. Build the app: `npm run build`
4. Log in to Cloudflare: `npx wrangler login`
5. Deploy to Pages: `npx wrangler pages deploy dist --project-name=<YOUR_PAGES_PROJECT_NAME>`

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
- Do not set `npx wrangler deploy` as a custom deploy command in a Git-integrated Pages project.
- Do not keep a Pages Wrangler config file in the repo unless you intentionally want that file to become the source of truth for the Pages project configuration.
