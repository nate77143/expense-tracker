# Admin Settings

Reviewed on March 21, 2026.

## What This Adds

The app now supports an admin-only Settings page for managing users.

Admin capabilities:

- View registered users
- Create a user with email and password
- Mark a created user as admin
- Delete a user

## How Admin Access Is Determined

A signed-in user is treated as admin when either of these is true:

- Their Supabase `app_metadata.role` is `admin`
- Their email is listed in the configured admin email list

## Required Environment Variables

### Frontend build variable

Set this in the app build environment:

- `VITE_ADMIN_EMAILS`

Example:

```env
VITE_ADMIN_EMAILS=owner@example.com,admin@example.com
```

### Cloudflare Pages Functions runtime variables

Set these in Cloudflare Pages for Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`

Example:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=owner@example.com,admin@example.com
```

## Security Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- User management runs through Cloudflare Pages Functions so the service role key stays server-side.
- The frontend calls `/api/admin/users` with the signed-in user's bearer token.
- The server validates that token and checks whether the current user is admin before performing any action.

## Local Development Note

If you run only the Vite dev server, `/api/admin/users` will not exist.

That means:

- The admin Settings UI will render
- User-management requests may show an "Admin API not configured yet" message locally

For the full admin flow in a Cloudflare-style local environment, use a Pages Functions-compatible local workflow.
