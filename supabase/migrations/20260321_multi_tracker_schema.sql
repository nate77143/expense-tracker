create extension if not exists pgcrypto;

create table if not exists public.trackers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
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

alter table public.expenses
  add column if not exists tracker_id uuid references public.trackers(id) on delete cascade;

alter table public.incomes
  add column if not exists tracker_id uuid references public.trackers(id) on delete cascade;

create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  date date not null,
  bank text not null,
  amount numeric not null,
  remarks text
);

create index if not exists idx_tracker_members_tracker_id on public.tracker_members (tracker_id);
create index if not exists idx_tracker_members_user_id on public.tracker_members (user_id);
create index if not exists idx_tracker_members_email on public.tracker_members (lower(email));
create index if not exists idx_expenses_tracker_id on public.expenses (tracker_id);
create index if not exists idx_incomes_tracker_id on public.incomes (tracker_id);
create index if not exists idx_savings_tracker_id on public.savings (tracker_id);

alter table public.trackers enable row level security;
alter table public.tracker_members enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.savings enable row level security;

drop policy if exists "trackers_select_member" on public.trackers;
create policy "trackers_select_member"
on public.trackers
for select
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = trackers.id
      and member.user_id = auth.uid()
      and member.status = 'active'
  )
);

drop policy if exists "trackers_insert_authenticated" on public.trackers;
create policy "trackers_insert_authenticated"
on public.trackers
for insert
to authenticated
with check (true);

drop policy if exists "trackers_update_owner_admin" on public.trackers;
create policy "trackers_update_owner_admin"
on public.trackers
for update
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = trackers.id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = trackers.id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
);

drop policy if exists "trackers_delete_owner" on public.trackers;
create policy "trackers_delete_owner"
on public.trackers
for delete
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = trackers.id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role = 'owner'
  )
);

drop policy if exists "tracker_members_select_member" on public.tracker_members;
create policy "tracker_members_select_member"
on public.tracker_members
for select
to authenticated
using (
  exists (
    select 1
    from public.tracker_members current_member
    where current_member.tracker_id = tracker_members.tracker_id
      and current_member.user_id = auth.uid()
      and current_member.status = 'active'
  )
);

drop policy if exists "tracker_members_insert_owner_or_admin" on public.tracker_members;
create policy "tracker_members_insert_owner_or_admin"
on public.tracker_members
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and role = 'owner'
    and status = 'active'
  )
  or exists (
    select 1
    from public.tracker_members current_member
    where current_member.tracker_id = tracker_members.tracker_id
      and current_member.user_id = auth.uid()
      and current_member.status = 'active'
      and current_member.role in ('owner', 'admin')
  )
);

drop policy if exists "tracker_members_update_owner_or_admin" on public.tracker_members;
create policy "tracker_members_update_owner_or_admin"
on public.tracker_members
for update
to authenticated
using (
  exists (
    select 1
    from public.tracker_members current_member
    where current_member.tracker_id = tracker_members.tracker_id
      and current_member.user_id = auth.uid()
      and current_member.status = 'active'
      and current_member.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members current_member
    where current_member.tracker_id = tracker_members.tracker_id
      and current_member.user_id = auth.uid()
      and current_member.status = 'active'
      and current_member.role in ('owner', 'admin')
  )
);

drop policy if exists "tracker_members_delete_owner_or_admin" on public.tracker_members;
create policy "tracker_members_delete_owner_or_admin"
on public.tracker_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.tracker_members current_member
    where current_member.tracker_id = tracker_members.tracker_id
      and current_member.user_id = auth.uid()
      and current_member.status = 'active'
      and current_member.role in ('owner', 'admin')
  )
);

drop policy if exists "expenses_select_member" on public.expenses;
create policy "expenses_select_member"
on public.expenses
for select
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = expenses.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  )
);

drop policy if exists "expenses_write_contributor" on public.expenses;
create policy "expenses_write_contributor"
on public.expenses
for all
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = expenses.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = expenses.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
);

drop policy if exists "incomes_select_member" on public.incomes;
create policy "incomes_select_member"
on public.incomes
for select
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = incomes.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  )
);

drop policy if exists "incomes_write_contributor" on public.incomes;
create policy "incomes_write_contributor"
on public.incomes
for all
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = incomes.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = incomes.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
);

drop policy if exists "savings_select_member" on public.savings;
create policy "savings_select_member"
on public.savings
for select
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = savings.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  )
);

drop policy if exists "savings_write_contributor" on public.savings;
create policy "savings_write_contributor"
on public.savings
for all
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = savings.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = savings.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
);

comment on table public.trackers is 'Workspace table for personal and shared budget trackers.';
comment on table public.tracker_members is 'Membership table that links users and emails to tracker workspaces.';
comment on table public.savings is 'Tracker-scoped savings records.';
