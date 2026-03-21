# Multi-Tracker Schema

Reviewed on March 21, 2026.

## Goal

The app now assumes a workspace model:

- Users sign in with Supabase Auth
- Each financial workspace is a `tracker`
- A user can belong to multiple trackers
- Expenses, incomes, and savings belong to a `tracker_id`

This supports:

- one personal tracker per user
- shared family trackers
- separate private trackers for different friends using the same app

## Required Tables

### `trackers`

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `description text`
- `is_personal boolean default false`
- `created_at timestamptz default now()`

### `tracker_members`

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `tracker_id uuid not null references public.trackers(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade`
- `email text not null`
- `role text not null check (role in ('owner', 'admin', 'member', 'viewer'))`
- `status text not null default 'active' check (status in ('active', 'invited'))`
- `joined_at timestamptz default now()`

### `expenses`

Add:

- `tracker_id uuid not null references public.trackers(id) on delete cascade`

### `incomes`

Add:

- `tracker_id uuid not null references public.trackers(id) on delete cascade`

### `savings`

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `tracker_id uuid not null references public.trackers(id) on delete cascade`
- `date date not null`
- `bank text not null`
- `amount numeric not null`
- `remarks text`

## RLS Direction

Each authenticated user should only access trackers where they have a membership row.

Core idea:

- a user can read a tracker if they belong to it
- a user can create records only in trackers where they are `owner`, `admin`, or `member`
- viewers should be read-only
- only owners/admins can manage memberships

## Example SQL Starting Point

```sql
create table if not exists public.trackers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  is_personal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tracker_members (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited')),
  joined_at timestamptz not null default now()
);

alter table public.expenses add column if not exists tracker_id uuid references public.trackers(id) on delete cascade;
alter table public.incomes add column if not exists tracker_id uuid references public.trackers(id) on delete cascade;

create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  date date not null,
  bank text not null,
  amount numeric not null,
  remarks text
);

alter table public.trackers enable row level security;
alter table public.tracker_members enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.savings enable row level security;
```

## Policy Shape

Implement policies that check membership through `tracker_members`.

Examples to adapt:

- users can select trackers they belong to
- owners/admins can insert tracker members
- owners/admins/members can insert expenses/incomes/savings
- viewers can only select

## Current Frontend Behavior

The app now only shows real Supabase-backed tracker data.

If the schema or policies are wrong:

- tracker lists stay empty instead of falling back to fake local sample data
- tracker and finance actions show the underlying Supabase error
- the follow-up policy fix in [`supabase/migrations/20260321_fix_tracker_rls_recursion.sql`](/d:/code/expense-tracker/supabase/migrations/20260321_fix_tracker_rls_recursion.sql) should also be applied

## Important Follow-up

The first tracker migration used self-referential `tracker_members` RLS checks. In practice, that can cause 500 errors when selecting from `tracker_members`.

Run this follow-up migration too:

- [`supabase/migrations/20260321_fix_tracker_rls_recursion.sql`](/d:/code/expense-tracker/supabase/migrations/20260321_fix_tracker_rls_recursion.sql)

It replaces those policies with security-definer helper functions so membership checks do not recurse through the same table policy.

## Audit Log Retention

Audit logs can grow much faster than the tracker tables themselves, so the repo now includes a cleanup helper:

- [`supabase/migrations/20260321_budget_audit_retention_90_days.sql`](/d:/code/expense-tracker/supabase/migrations/20260321_budget_audit_retention_90_days.sql)

After running it, you can purge old logs with:

```sql
select public.cleanup_budget_audit_logs();
```

That keeps the last 90 days by default.

If you later want 60 days instead, use:

```sql
select public.cleanup_budget_audit_logs(60);
```
