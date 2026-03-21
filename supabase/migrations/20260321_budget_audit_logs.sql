create extension if not exists pgcrypto;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_tracker_member(target_tracker_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = target_tracker_id
      and member.status = 'active'
      and (
        member.user_id = auth.uid()
        or lower(member.email) = public.current_user_email()
      )
  );
$$;

create table if not exists public.budget_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null,
  entity_type text not null check (entity_type in ('trackers', 'tracker_members', 'expenses', 'incomes', 'savings')),
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_user_id uuid,
  actor_email text,
  old_data jsonb,
  new_data jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_budget_audit_logs_tracker_id on public.budget_audit_logs (tracker_id);
create index if not exists idx_budget_audit_logs_occurred_at on public.budget_audit_logs (occurred_at desc);
create index if not exists idx_budget_audit_logs_entity_type on public.budget_audit_logs (entity_type);

alter table public.budget_audit_logs enable row level security;

drop policy if exists "budget_audit_logs_select_member" on public.budget_audit_logs;
create policy "budget_audit_logs_select_member"
on public.budget_audit_logs
for select
to authenticated
using (public.is_tracker_member(tracker_id));

create or replace function public.log_budget_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tracker_id uuid;
  target_record_id uuid;
begin
  if tg_table_name = 'trackers' then
    target_tracker_id := coalesce(new.id, old.id);
  else
    target_tracker_id := coalesce(new.tracker_id, old.tracker_id);
  end if;

  target_record_id := coalesce(new.id, old.id);

  insert into public.budget_audit_logs (
    tracker_id,
    entity_type,
    record_id,
    action,
    actor_user_id,
    actor_email,
    old_data,
    new_data
  )
  values (
    target_tracker_id,
    tg_table_name,
    target_record_id,
    lower(tg_op),
    auth.uid(),
    public.current_user_email(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists budget_audit_trackers on public.trackers;
create trigger budget_audit_trackers
after insert or update or delete on public.trackers
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_tracker_members on public.tracker_members;
create trigger budget_audit_tracker_members
after insert or update or delete on public.tracker_members
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_expenses on public.expenses;
create trigger budget_audit_expenses
after insert or update or delete on public.expenses
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_incomes on public.incomes;
create trigger budget_audit_incomes
after insert or update or delete on public.incomes
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_savings on public.savings;
create trigger budget_audit_savings
after insert or update or delete on public.savings
for each row execute function public.log_budget_change();

comment on table public.budget_audit_logs is 'Audit trail for tracker, membership, expense, income, and savings changes.';
