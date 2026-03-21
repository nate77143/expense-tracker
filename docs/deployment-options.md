# Deployment Options

Reviewed on March 21, 2026.

This app is a Vite + Vue frontend that connects directly to Supabase, so it is a good fit for static hosting with environment variables.

## Recommended Choice

Use Cloudflare Pages first.

Why:

- Good fit for static Vite deployments.
- Generous free tier for personal projects.
- Global CDN and preview deployments are included.
- Easy to connect to GitHub and redeploy on each push.

Official references reviewed:

- Cloudflare Pages overview: https://developers.cloudflare.com/pages/
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Netlify free plan: https://www.netlify.com/blog/introducing-netlify-free-plan/
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- GitHub Pages limits: https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/github-pages-limits

## Short Comparison

### 1. Cloudflare Pages

Best overall free option for this app.

- Strong choice for static Vue/Vite apps.
- Free tier currently includes 500 builds/month.
- Supports custom domains and preview deployments.
- Good default CDN performance.

## 2. Netlify

Best fallback if we want a clearly commercial-friendly free option.

- Free plan is free forever.
- Current published free plan includes 100 GB bandwidth and 300 build minutes/month.
- Easy Git-based deployment.

## 3. Vercel

Best for convenience, but less ideal if this becomes more than a personal project.

- Excellent deploy experience.
- Current Hobby plan is positioned for personal, non-commercial use.

## 4. GitHub Pages

Lowest-complexity option, but not my recommendation for this app.

- Works for static sites.
- Has soft usage limits.
- Not intended for commercial/SaaS use.

## Why Cloudflare Pages Fits This Repo

- The app builds to static assets with `npm run build`.
- No custom backend server is required for the frontend.
- Supabase can be reached directly from the browser.
- We can store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting platform.

## Important Security Note

Before public deployment, verify Supabase Row Level Security is enabled for any table that should not be publicly writable/readable.

Notes:

- Exposing `VITE_SUPABASE_URL` in the frontend is normal.
- Exposing the anon key in the frontend is also normal.
- Safety depends on database policies, not secrecy of the anon key.

## Planned Next Step

If we proceed with Cloudflare Pages, the deployment flow should be:

1. Push this repo to GitHub.
2. Create a Cloudflare Pages project connected to the repo.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Add required environment variables.
6. Deploy and test the live site.

## Decision Log

Current recommendation: Cloudflare Pages.

Reason: best free-tier balance for this static finance app, with fewer free-plan concerns than Vercel Hobby and better fit than GitHub Pages.
