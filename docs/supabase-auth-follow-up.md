# Supabase Auth Follow-up

Reviewed on March 21, 2026.

## Current State

The frontend now supports Supabase email/password authentication.

Important limitation:

- The current `expenses` and `incomes` tables in Supabase appear to contain these columns only:
  - `expenses`: `id`, `date`, `category`, `amount`, `remarks`
  - `incomes`: `id`, `date`, `amount`, `remarks`, `source`
- There is no `user_id` column yet.
- Because of that, signing in does not automatically isolate each user's records.

In other words:

- Authentication is working at the account level.
- Data ownership is not fully implemented at the table level yet.

## What Needs To Be Added

To make each account see only its own data, add:

1. A `user_id` column on each user-owned table.
2. A foreign key or UUID reference that matches `auth.users.id`.
3. Row Level Security policies that restrict read/write access to the authenticated owner.
4. Frontend inserts that save the authenticated user's id to the table.

## Example SQL Direction

This is a starting point and should be reviewed in your Supabase SQL editor before running:

```sql
alter table public.expenses
add column if not exists user_id uuid references auth.users(id);

alter table public.incomes
add column if not exists user_id uuid references auth.users(id);

alter table public.expenses enable row level security;
alter table public.incomes enable row level security;

create policy "Users can read their own expenses"
on public.expenses
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
on public.expenses
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own expenses"
on public.expenses
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can read their own incomes"
on public.incomes
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own incomes"
on public.incomes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own incomes"
on public.incomes
for delete
to authenticated
using (auth.uid() = user_id);
```

## Frontend Follow-up

After the database is updated, the app should be adjusted so inserts include the current user id and queries only return authenticated-user rows.

## Recommendation

Do not treat the app as production-ready multi-user software until the database ownership model and RLS policies are added.
