create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  name text not null,
  account_type text not null check (
    account_type in (
      'cash',
      'checking',
      'savings',
      'ewallet',
      'credit_card',
      'other_asset',
      'other_liability'
    )
  ),
  account_group text not null check (account_group in ('asset', 'liability')),
  institution text not null default '',
  currency_code text not null default 'PHP',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by_name text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_email text
);

create unique index if not exists idx_accounts_tracker_name_unique
on public.accounts (tracker_id, lower(name));

create index if not exists idx_accounts_tracker_id on public.accounts (tracker_id);
create index if not exists idx_accounts_tracker_group on public.accounts (tracker_id, account_group);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  source_recurring_rule_id uuid,
  source_recurring_run_date date,
  date date not null,
  from_account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric not null check (amount > 0),
  transfer_type text not null default 'general' check (
    transfer_type in ('general', 'cash_withdrawal', 'savings_transfer', 'credit_card_payment')
  ),
  remarks text not null default '',
  created_by_name text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  constraint transfers_accounts_different check (from_account_id <> to_account_id)
);

create index if not exists idx_transfers_tracker_id on public.transfers (tracker_id);
create index if not exists idx_transfers_date on public.transfers (tracker_id, date desc);
create index if not exists idx_transfers_from_account on public.transfers (from_account_id);
create index if not exists idx_transfers_to_account on public.transfers (to_account_id);

create table if not exists public.account_adjustments (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  source_recurring_rule_id uuid,
  source_recurring_run_date date,
  account_id uuid not null references public.accounts(id) on delete restrict,
  date date not null,
  amount numeric not null,
  reason text not null default 'manual_adjustment' check (
    reason in ('opening_balance', 'manual_adjustment', 'reconciliation_fix')
  ),
  remarks text not null default '',
  created_by_name text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_account_adjustments_tracker_id on public.account_adjustments (tracker_id);
create index if not exists idx_account_adjustments_account_id on public.account_adjustments (account_id);
create index if not exists idx_account_adjustments_date on public.account_adjustments (tracker_id, date desc);

alter table public.incomes
  add column if not exists to_account_id uuid references public.accounts(id) on delete restrict;

alter table public.incomes
  add column if not exists source_recurring_rule_id uuid;

alter table public.incomes
  add column if not exists source_recurring_run_date date;

alter table public.expenses
  add column if not exists from_account_id uuid references public.accounts(id) on delete restrict;

alter table public.expenses
  add column if not exists source_recurring_rule_id uuid;

alter table public.expenses
  add column if not exists source_recurring_run_date date;

alter table public.expenses
  add column if not exists merchant text;

alter table public.credit_cards
  add column if not exists account_id uuid references public.accounts(id) on delete restrict;

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  rule_type text not null check (rule_type in ('income', 'expense', 'transfer')),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  interval_count integer not null default 1 check (interval_count > 0),
  start_date date not null,
  next_run_date date not null,
  end_date date,
  is_active boolean not null default true,
  amount numeric not null check (amount > 0),
  description text not null default '',
  remarks text,
  income_source text,
  income_to_account_id uuid references public.accounts(id) on delete set null,
  expense_category text,
  expense_merchant text,
  expense_from_account_id uuid references public.accounts(id) on delete set null,
  transfer_from_account_id uuid references public.accounts(id) on delete set null,
  transfer_to_account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recurring_rules_tracker_id on public.recurring_rules (tracker_id);
create index if not exists idx_recurring_rules_next_run_date on public.recurring_rules (next_run_date);
create unique index if not exists idx_accounts_id_tracker_id_unique on public.accounts (id, tracker_id);

create unique index if not exists idx_incomes_source_recurring_rule_run_date
on public.incomes (source_recurring_rule_id, source_recurring_run_date)
where source_recurring_rule_id is not null;

create unique index if not exists idx_expenses_source_recurring_rule_run_date
on public.expenses (source_recurring_rule_id, source_recurring_run_date)
where source_recurring_rule_id is not null;

create unique index if not exists idx_transfers_source_recurring_rule_run_date
on public.transfers (source_recurring_rule_id, source_recurring_run_date)
where source_recurring_rule_id is not null;

create unique index if not exists idx_account_adjustments_source_recurring_rule_run_date
on public.account_adjustments (source_recurring_rule_id, source_recurring_run_date)
where source_recurring_rule_id is not null;

alter table public.transfers
  drop constraint if exists transfers_source_recurring_rule_id_fkey;

alter table public.transfers
  add constraint transfers_source_recurring_rule_id_fkey
  foreign key (source_recurring_rule_id) references public.recurring_rules(id) on delete set null;

alter table public.account_adjustments
  drop constraint if exists account_adjustments_source_recurring_rule_id_fkey;

alter table public.account_adjustments
  add constraint account_adjustments_source_recurring_rule_id_fkey
  foreign key (source_recurring_rule_id) references public.recurring_rules(id) on delete set null;

alter table public.incomes
  drop constraint if exists incomes_source_recurring_rule_id_fkey;

alter table public.incomes
  add constraint incomes_source_recurring_rule_id_fkey
  foreign key (source_recurring_rule_id) references public.recurring_rules(id) on delete set null;

alter table public.expenses
  drop constraint if exists expenses_source_recurring_rule_id_fkey;

alter table public.expenses
  add constraint expenses_source_recurring_rule_id_fkey
  foreign key (source_recurring_rule_id) references public.recurring_rules(id) on delete set null;

alter table public.incomes
  drop constraint if exists incomes_to_account_tracker_fkey;

alter table public.incomes
  add constraint incomes_to_account_tracker_fkey
  foreign key (to_account_id, tracker_id) references public.accounts(id, tracker_id) on delete restrict;

alter table public.expenses
  drop constraint if exists expenses_from_account_tracker_fkey;

alter table public.expenses
  add constraint expenses_from_account_tracker_fkey
  foreign key (from_account_id, tracker_id) references public.accounts(id, tracker_id) on delete restrict;

alter table public.transfers
  drop constraint if exists transfers_from_account_tracker_fkey;

alter table public.transfers
  add constraint transfers_from_account_tracker_fkey
  foreign key (from_account_id, tracker_id) references public.accounts(id, tracker_id) on delete restrict;

alter table public.transfers
  drop constraint if exists transfers_to_account_tracker_fkey;

alter table public.transfers
  add constraint transfers_to_account_tracker_fkey
  foreign key (to_account_id, tracker_id) references public.accounts(id, tracker_id) on delete restrict;

alter table public.account_adjustments
  drop constraint if exists account_adjustments_account_tracker_fkey;

alter table public.account_adjustments
  add constraint account_adjustments_account_tracker_fkey
  foreign key (account_id, tracker_id) references public.accounts(id, tracker_id) on delete restrict;

alter table public.credit_cards
  drop constraint if exists credit_cards_account_tracker_fkey;

alter table public.credit_cards
  add constraint credit_cards_account_tracker_fkey
  foreign key (account_id, tracker_id) references public.accounts(id, tracker_id) on delete restrict;

create unique index if not exists idx_credit_cards_account_id_unique
on public.credit_cards (account_id);

alter table public.recurring_rules
  drop constraint if exists recurring_rules_income_to_account_tracker_fkey;

alter table public.recurring_rules
  add constraint recurring_rules_income_to_account_tracker_fkey
  foreign key (income_to_account_id, tracker_id) references public.accounts(id, tracker_id) on delete set null;

alter table public.recurring_rules
  drop constraint if exists recurring_rules_expense_from_account_tracker_fkey;

alter table public.recurring_rules
  add constraint recurring_rules_expense_from_account_tracker_fkey
  foreign key (expense_from_account_id, tracker_id) references public.accounts(id, tracker_id) on delete set null;

alter table public.recurring_rules
  drop constraint if exists recurring_rules_transfer_from_account_tracker_fkey;

alter table public.recurring_rules
  add constraint recurring_rules_transfer_from_account_tracker_fkey
  foreign key (transfer_from_account_id, tracker_id) references public.accounts(id, tracker_id) on delete set null;

alter table public.recurring_rules
  drop constraint if exists recurring_rules_transfer_to_account_tracker_fkey;

alter table public.recurring_rules
  add constraint recurring_rules_transfer_to_account_tracker_fkey
  foreign key (transfer_to_account_id, tracker_id) references public.accounts(id, tracker_id) on delete set null;

alter table public.accounts enable row level security;
alter table public.transfers enable row level security;
alter table public.account_adjustments enable row level security;
alter table public.recurring_rules enable row level security;

drop policy if exists "accounts_select_member" on public.accounts;
create policy "accounts_select_member"
on public.accounts
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "accounts_write_contributor" on public.accounts;
create policy "accounts_write_contributor"
on public.accounts
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));

drop policy if exists "transfers_select_member" on public.transfers;
create policy "transfers_select_member"
on public.transfers
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "transfers_write_contributor" on public.transfers;
create policy "transfers_write_contributor"
on public.transfers
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));

drop policy if exists "account_adjustments_select_member" on public.account_adjustments;
create policy "account_adjustments_select_member"
on public.account_adjustments
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "account_adjustments_write_contributor" on public.account_adjustments;
create policy "account_adjustments_write_contributor"
on public.account_adjustments
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));

drop policy if exists "recurring_rules_select_member" on public.recurring_rules;
create policy "recurring_rules_select_member"
on public.recurring_rules
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "recurring_rules_write_contributor" on public.recurring_rules;
create policy "recurring_rules_write_contributor"
on public.recurring_rules
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));

drop view if exists public.account_balances_view;
drop view if exists public.account_activity_view;
create view public.account_activity_view as
select
  income.id,
  income.tracker_id,
  income.date,
  'income'::text as activity_type,
  income.to_account_id as primary_account_id,
  null::uuid as secondary_account_id,
  income.amount as delta,
  income.source as label,
  income.remarks,
  income.created_by_name,
  income.created_by_user_id,
  income.created_by_email,
  null::timestamptz as created_at
from public.incomes income
where income.to_account_id is not null

union all

select
  expense.id,
  expense.tracker_id,
  expense.date,
  'expense'::text as activity_type,
  expense.from_account_id as primary_account_id,
  null::uuid as secondary_account_id,
  -expense.amount as delta,
  expense.category as label,
  expense.remarks,
  expense.created_by_name,
  expense.created_by_user_id,
  expense.created_by_email,
  null::timestamptz as created_at
from public.expenses expense
where expense.from_account_id is not null

union all

select
  transfer.id,
  transfer.tracker_id,
  transfer.date,
  'transfer_out'::text as activity_type,
  transfer.from_account_id as primary_account_id,
  transfer.to_account_id as secondary_account_id,
  -transfer.amount as delta,
  transfer.transfer_type as label,
  transfer.remarks,
  transfer.created_by_name,
  transfer.created_by_user_id,
  transfer.created_by_email,
  transfer.created_at
from public.transfers transfer

union all

select
  transfer.id,
  transfer.tracker_id,
  transfer.date,
  'transfer_in'::text as activity_type,
  transfer.to_account_id as primary_account_id,
  transfer.from_account_id as secondary_account_id,
  transfer.amount as delta,
  transfer.transfer_type as label,
  transfer.remarks,
  transfer.created_by_name,
  transfer.created_by_user_id,
  transfer.created_by_email,
  transfer.created_at
from public.transfers transfer

union all

select
  adjustment.id,
  adjustment.tracker_id,
  adjustment.date,
  'adjustment'::text as activity_type,
  adjustment.account_id as primary_account_id,
  null::uuid as secondary_account_id,
  adjustment.amount as delta,
  adjustment.reason as label,
  adjustment.remarks,
  adjustment.created_by_name,
  adjustment.created_by_user_id,
  adjustment.created_by_email,
  adjustment.created_at
from public.account_adjustments adjustment;

create view public.account_balances_view as
with account_deltas as (
  select
    activity.primary_account_id as account_id,
    sum(activity.delta) as current_balance
  from public.account_activity_view activity
  group by activity.primary_account_id
)
select
  account.id,
  account.tracker_id,
  account.name,
  account.account_type,
  account.account_group,
  account.institution,
  account.currency_code,
  account.is_active,
  account.sort_order,
  account.created_at,
  coalesce(delta.current_balance, 0) as current_balance
from public.accounts account
left join account_deltas delta on delta.account_id = account.id;

create or replace function public.record_income(
  p_tracker_id uuid,
  p_date date,
  p_amount numeric,
  p_source text default null,
  p_remarks text default '',
  p_to_account_id uuid default null,
  p_source_recurring_rule_id uuid default null,
  p_source_recurring_run_date date default null
)
returns public.incomes
language plpgsql
security definer
set search_path = public
as $$
declare
  target_account public.accounts;
  inserted_income public.incomes;
begin
  if not public.can_contribute_tracker(p_tracker_id) then
    raise exception 'Not allowed to record income in this tracker.';
  end if;

  if p_to_account_id is null then
    raise exception 'Income requires a destination account.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Income amount must be greater than zero.';
  end if;

  select *
  into target_account
  from public.accounts account
  where account.id = p_to_account_id
    and account.tracker_id = p_tracker_id
  for update;

  if target_account.id is null then
    raise exception 'The selected destination account could not be found in this tracker.';
  end if;

  if not target_account.is_active then
    raise exception 'Income can only be recorded into an active account.';
  end if;

  if target_account.account_group <> 'asset' then
    raise exception 'Income destination accounts must be asset accounts.';
  end if;

  insert into public.incomes (
    tracker_id,
    source_recurring_rule_id,
    source_recurring_run_date,
    created_by_name,
    created_by_user_id,
    created_by_email,
    date,
    amount,
    source,
    remarks,
    to_account_id
  )
  values (
    p_tracker_id,
    p_source_recurring_rule_id,
    p_source_recurring_run_date,
    public.current_user_name(),
    auth.uid(),
    public.current_user_email(),
    p_date,
    p_amount,
    nullif(trim(coalesce(p_source, '')), ''),
    coalesce(p_remarks, ''),
    p_to_account_id
  )
  returning * into inserted_income;

  return inserted_income;
end;
$$;

grant execute on function public.record_income(uuid, date, numeric, text, text, uuid, uuid, date) to authenticated;

create or replace function public.record_expense(
  p_tracker_id uuid,
  p_date date,
  p_amount numeric,
  p_category text,
  p_merchant text default null,
  p_remarks text default '',
  p_from_account_id uuid default null,
  p_source_recurring_rule_id uuid default null,
  p_source_recurring_run_date date default null
)
returns public.expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  source_account public.accounts;
  linked_card public.credit_cards;
  current_balance numeric := 0;
  available_credit numeric := 0;
  inserted_expense public.expenses;
begin
  if not public.can_contribute_tracker(p_tracker_id) then
    raise exception 'Not allowed to record an expense in this tracker.';
  end if;

  if p_from_account_id is null then
    raise exception 'Expense requires a source account.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Expense amount must be greater than zero.';
  end if;

  if nullif(trim(coalesce(p_category, '')), '') is null then
    raise exception 'Expense category is required.';
  end if;

  select *
  into source_account
  from public.accounts account
  where account.id = p_from_account_id
    and account.tracker_id = p_tracker_id
  for update;

  if source_account.id is null then
    raise exception 'The selected expense account could not be found in this tracker.';
  end if;

  if not source_account.is_active then
    raise exception 'Expenses can only be recorded from an active account.';
  end if;

  if source_account.account_group = 'asset' then
    select coalesce(balance.current_balance, 0)
    into current_balance
    from public.account_balances_view balance
    where balance.id = source_account.id;

    if p_amount > current_balance then
      raise exception 'The selected account does not have enough balance for this expense.';
    end if;
  elsif source_account.account_type = 'credit_card' then
    select *
    into linked_card
    from public.credit_cards card
    where card.account_id = source_account.id
      and card.tracker_id = p_tracker_id;

    if linked_card.id is null then
      raise exception 'The selected credit card account is missing its card metadata.';
    end if;

    select coalesce(balance.current_balance, 0)
    into current_balance
    from public.account_balances_view balance
    where balance.id = source_account.id;

    available_credit := linked_card.limit_amount - abs(least(current_balance, 0));
    if p_amount > available_credit then
      raise exception 'This expense is larger than the available credit on the selected card.';
    end if;
  else
    raise exception 'Expenses can only be recorded from asset accounts or credit card accounts.';
  end if;

  insert into public.expenses (
    tracker_id,
    source_recurring_rule_id,
    source_recurring_run_date,
    created_by_name,
    created_by_user_id,
    created_by_email,
    date,
    category,
    merchant,
    amount,
    remarks,
    from_account_id
  )
  values (
    p_tracker_id,
    p_source_recurring_rule_id,
    p_source_recurring_run_date,
    public.current_user_name(),
    auth.uid(),
    public.current_user_email(),
    p_date,
    trim(p_category),
    nullif(trim(coalesce(p_merchant, '')), ''),
    p_amount,
    coalesce(p_remarks, ''),
    p_from_account_id
  )
  returning * into inserted_expense;

  return inserted_expense;
end;
$$;

grant execute on function public.record_expense(uuid, date, numeric, text, text, text, uuid, uuid, date) to authenticated;

create or replace function public.record_transfer(
  p_tracker_id uuid,
  p_date date,
  p_amount numeric,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_transfer_type text default 'general',
  p_remarks text default '',
  p_source_recurring_rule_id uuid default null,
  p_source_recurring_run_date date default null
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  source_account public.accounts;
  destination_account public.accounts;
  current_balance numeric := 0;
  inserted_transfer public.transfers;
begin
  if not public.can_contribute_tracker(p_tracker_id) then
    raise exception 'Not allowed to record a transfer in this tracker.';
  end if;

  if p_from_account_id is null or p_to_account_id is null then
    raise exception 'Transfers require both a source and destination account.';
  end if;

  if p_from_account_id = p_to_account_id then
    raise exception 'Transfer source and destination must be different accounts.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;

  if p_transfer_type not in ('general', 'cash_withdrawal', 'savings_transfer', 'credit_card_payment') then
    raise exception 'Unsupported transfer type.';
  end if;

  if p_from_account_id::text < p_to_account_id::text then
    select *
    into source_account
    from public.accounts account
    where account.id = p_from_account_id
      and account.tracker_id = p_tracker_id
    for update;

    select *
    into destination_account
    from public.accounts account
    where account.id = p_to_account_id
      and account.tracker_id = p_tracker_id
    for update;
  else
    select *
    into destination_account
    from public.accounts account
    where account.id = p_to_account_id
      and account.tracker_id = p_tracker_id
    for update;

    select *
    into source_account
    from public.accounts account
    where account.id = p_from_account_id
      and account.tracker_id = p_tracker_id
    for update;
  end if;

  if source_account.id is null then
    raise exception 'The selected source account could not be found in this tracker.';
  end if;

  if destination_account.id is null then
    raise exception 'The selected destination account could not be found in this tracker.';
  end if;

  if not source_account.is_active or not destination_account.is_active then
    raise exception 'Transfers require active source and destination accounts.';
  end if;

  if source_account.account_group <> 'asset' then
    raise exception 'Transfers can only be sent from asset accounts.';
  end if;

  select coalesce(balance.current_balance, 0)
  into current_balance
  from public.account_balances_view balance
  where balance.id = source_account.id;

  if p_amount > current_balance then
    raise exception 'The selected source account does not have enough balance for this transfer.';
  end if;

  insert into public.transfers (
    tracker_id,
    source_recurring_rule_id,
    source_recurring_run_date,
    created_by_name,
    created_by_user_id,
    created_by_email,
    date,
    from_account_id,
    to_account_id,
    amount,
    transfer_type,
    remarks
  )
  values (
    p_tracker_id,
    p_source_recurring_rule_id,
    p_source_recurring_run_date,
    public.current_user_name(),
    auth.uid(),
    public.current_user_email(),
    p_date,
    p_from_account_id,
    p_to_account_id,
    p_amount,
    p_transfer_type,
    coalesce(p_remarks, '')
  )
  returning * into inserted_transfer;

  return inserted_transfer;
end;
$$;

grant execute on function public.record_transfer(uuid, date, numeric, uuid, uuid, text, text, uuid, date) to authenticated;

create or replace function public.record_account_adjustment(
  p_tracker_id uuid,
  p_account_id uuid,
  p_date date,
  p_amount numeric,
  p_reason text default 'manual_adjustment',
  p_remarks text default '',
  p_source_recurring_rule_id uuid default null,
  p_source_recurring_run_date date default null
)
returns public.account_adjustments
language plpgsql
security definer
set search_path = public
as $$
declare
  target_account public.accounts;
  inserted_adjustment public.account_adjustments;
begin
  if not public.can_contribute_tracker(p_tracker_id) then
    raise exception 'Not allowed to record an account adjustment in this tracker.';
  end if;

  if p_account_id is null then
    raise exception 'Account adjustments require an account.';
  end if;

  if p_amount is null or p_amount = 0 then
    raise exception 'Account adjustment amount must be non-zero.';
  end if;

  if p_reason not in ('opening_balance', 'manual_adjustment', 'reconciliation_fix') then
    raise exception 'Unsupported account adjustment reason.';
  end if;

  select *
  into target_account
  from public.accounts account
  where account.id = p_account_id
    and account.tracker_id = p_tracker_id
  for update;

  if target_account.id is null then
    raise exception 'The selected adjustment account could not be found in this tracker.';
  end if;

  insert into public.account_adjustments (
    tracker_id,
    source_recurring_rule_id,
    source_recurring_run_date,
    created_by_name,
    created_by_user_id,
    created_by_email,
    account_id,
    date,
    amount,
    reason,
    remarks
  )
  values (
    p_tracker_id,
    p_source_recurring_rule_id,
    p_source_recurring_run_date,
    public.current_user_name(),
    auth.uid(),
    public.current_user_email(),
    p_account_id,
    p_date,
    p_amount,
    p_reason,
    coalesce(p_remarks, '')
  )
  returning * into inserted_adjustment;

  return inserted_adjustment;
end;
$$;

grant execute on function public.record_account_adjustment(uuid, uuid, date, numeric, text, text, uuid, date) to authenticated;

create or replace function public.create_account_with_opening_balance(
  p_tracker_id uuid,
  p_name text,
  p_account_type text,
  p_account_group text,
  p_institution text default '',
  p_currency_code text default 'PHP',
  p_is_active boolean default true,
  p_sort_order integer default 0,
  p_opening_balance numeric default 0,
  p_opening_balance_date date default current_date,
  p_opening_balance_remarks text default 'Opening balance'
)
returns public.accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  created_account public.accounts;
  normalized_opening_balance numeric := coalesce(p_opening_balance, 0);
begin
  if not public.can_contribute_tracker(p_tracker_id) then
    raise exception 'Not allowed to create an account in this tracker.';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Account name is required.';
  end if;

  if p_account_type not in ('cash', 'checking', 'savings', 'ewallet', 'credit_card', 'other_asset', 'other_liability') then
    raise exception 'Unsupported account type.';
  end if;

  if p_account_group not in ('asset', 'liability') then
    raise exception 'Unsupported account group.';
  end if;

  if p_account_type in ('credit_card', 'other_liability') and p_account_group <> 'liability' then
    raise exception 'Liability account types must use the liability group.';
  end if;

  if p_account_type in ('cash', 'checking', 'savings', 'ewallet', 'other_asset') and p_account_group <> 'asset' then
    raise exception 'Asset account types must use the asset group.';
  end if;

  insert into public.accounts (
    tracker_id,
    name,
    account_type,
    account_group,
    institution,
    currency_code,
    is_active,
    sort_order,
    created_by_name,
    created_by_user_id,
    created_by_email
  )
  values (
    p_tracker_id,
    trim(p_name),
    p_account_type,
    p_account_group,
    coalesce(p_institution, ''),
    coalesce(nullif(trim(coalesce(p_currency_code, '')), ''), 'PHP'),
    coalesce(p_is_active, true),
    coalesce(p_sort_order, 0),
    public.current_user_name(),
    auth.uid(),
    public.current_user_email()
  )
  returning * into created_account;

  if normalized_opening_balance <> 0 then
    insert into public.account_adjustments (
      tracker_id,
      account_id,
      date,
      amount,
      reason,
      remarks,
      created_by_name,
      created_by_user_id,
      created_by_email
    )
    values (
      p_tracker_id,
      created_account.id,
      coalesce(p_opening_balance_date, current_date),
      case
        when p_account_group = 'liability' then -abs(normalized_opening_balance)
        else normalized_opening_balance
      end,
      'opening_balance',
      coalesce(p_opening_balance_remarks, 'Opening balance'),
      public.current_user_name(),
      auth.uid(),
      public.current_user_email()
    );
  end if;

  return created_account;
end;
$$;

grant execute on function public.create_account_with_opening_balance(uuid, text, text, text, text, text, boolean, integer, numeric, date, text) to authenticated;

alter table public.budget_audit_logs
  drop constraint if exists budget_audit_logs_entity_type_check;

alter table public.budget_audit_logs
  add constraint budget_audit_logs_entity_type_check
  check (
    entity_type in (
      'trackers',
      'tracker_members',
      'accounts',
      'expenses',
      'incomes',
      'transfers',
      'account_adjustments',
      'credit_cards',
      'credit_card_transactions',
      'recurring_transactions',
      'recurring_rules',
      'savings'
    )
  );

drop trigger if exists budget_audit_accounts on public.accounts;
create trigger budget_audit_accounts
after insert or update or delete on public.accounts
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_transfers on public.transfers;
create trigger budget_audit_transfers
after insert or update or delete on public.transfers
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_account_adjustments on public.account_adjustments;
create trigger budget_audit_account_adjustments
after insert or update or delete on public.account_adjustments
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_recurring_rules on public.recurring_rules;
create trigger budget_audit_recurring_rules
after insert or update or delete on public.recurring_rules
for each row execute function public.log_budget_change();

create or replace function public.create_credit_card_with_account(
  p_tracker_id uuid,
  p_name text,
  p_issuer text,
  p_limit_amount numeric,
  p_statement_day integer,
  p_due_day integer,
  p_opening_balance numeric default 0
)
returns public.credit_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  created_account public.accounts;
  created_card public.credit_cards;
begin
  if not public.can_contribute_tracker(p_tracker_id) then
    raise exception 'Not allowed to create a credit card in this tracker.';
  end if;

  insert into public.accounts (
    tracker_id,
    name,
    account_type,
    account_group,
    institution,
    currency_code,
    is_active,
    sort_order,
    created_by_name,
    created_by_user_id,
    created_by_email
  )
  values (
    p_tracker_id,
    p_name,
    'credit_card',
    'liability',
    coalesce(p_issuer, ''),
    'PHP',
    true,
    0,
    public.current_user_name(),
    auth.uid(),
    public.current_user_email()
  )
  returning * into created_account;

  insert into public.credit_cards (
    tracker_id,
    account_id,
    name,
    issuer,
    limit_amount,
    statement_day,
    due_day
  )
  values (
    p_tracker_id,
    created_account.id,
    p_name,
    coalesce(p_issuer, ''),
    p_limit_amount,
    p_statement_day,
    p_due_day
  )
  returning * into created_card;

  if coalesce(p_opening_balance, 0) > 0 then
    insert into public.account_adjustments (
      tracker_id,
      account_id,
      date,
      amount,
      reason,
      remarks,
      created_by_name,
      created_by_user_id,
      created_by_email
    )
    values (
      p_tracker_id,
      created_account.id,
      current_date,
      -abs(p_opening_balance),
      'opening_balance',
      'Opening card balance',
      public.current_user_name(),
      auth.uid(),
      public.current_user_email()
    );
  end if;

  return created_card;
end;
$$;

grant execute on function public.create_credit_card_with_account(uuid, text, text, numeric, integer, integer, numeric) to authenticated;

create or replace function public.delete_credit_card_with_account(target_credit_card_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_card public.credit_cards;
begin
  select *
  into target_card
  from public.credit_cards
  where id = target_credit_card_id;

  if target_card.id is null then
    return;
  end if;

  if not public.can_contribute_tracker(target_card.tracker_id) then
    raise exception 'Not allowed to delete this credit card.';
  end if;

  if exists (
    select 1
    from public.expenses expense
    where expense.from_account_id = target_card.account_id
  ) then
    raise exception 'This card still has recorded charges tied to its account.';
  end if;

  if exists (
    select 1
    from public.transfers transfer
    where transfer.from_account_id = target_card.account_id
       or transfer.to_account_id = target_card.account_id
  ) then
    raise exception 'This card still has recorded payments or transfers tied to its account.';
  end if;

  if exists (
    select 1
    from public.recurring_rules rule
    where rule.expense_from_account_id = target_card.account_id
       or rule.transfer_from_account_id = target_card.account_id
       or rule.transfer_to_account_id = target_card.account_id
  ) then
    raise exception 'This card is still referenced by recurring rules.';
  end if;

  delete from public.account_adjustments
  where account_id = target_card.account_id;

  delete from public.credit_cards
  where id = target_credit_card_id;

  delete from public.accounts
  where id = target_card.account_id;
end;
$$;

grant execute on function public.delete_credit_card_with_account(uuid) to authenticated;

comment on table public.accounts is 'Tracker-scoped asset and liability accounts used as the source of truth for balances.';
comment on table public.transfers is 'Tracker-scoped transfers between accounts, including withdrawals and credit card payments.';
comment on table public.account_adjustments is 'Tracker-scoped opening balances and manual balance corrections.';
comment on table public.recurring_rules is 'Account-aware recurring income, expense, and transfer templates.';
