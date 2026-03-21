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

Until this schema exists in Supabase:

- the app falls back to local sample trackers
- tracker creation/member management can still work locally in-session
- shared live data is not fully enabled yet
