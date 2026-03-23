create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  name text not null,
  issuer text not null default '',
  limit_amount numeric not null check (limit_amount > 0),
  statement_day integer not null check (statement_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table if not exists public.credit_card_transactions (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete cascade,
  date date not null,
  type text not null check (type in ('charge', 'payment')),
  amount numeric not null check (amount > 0),
  merchant text,
  category text,
  payment_source text check (payment_source in ('income', 'savings')),
  payment_source_bank text,
  remarks text,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'saving', 'credit_card_charge')),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  interval_count integer not null default 1 check (interval_count > 0),
  start_date date not null,
  next_run_date date not null,
  end_date date,
  is_active boolean not null default true,
  amount numeric not null check (amount > 0),
  description text not null default '',
  remarks text,
  expense_category text,
  expense_funding_source text check (expense_funding_source in ('income', 'savings', 'credit_card')),
  expense_funding_source_bank text,
  expense_target_savings_bank text,
  income_source text,
  savings_bank text,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  merchant text,
  created_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists payment_source_card_id uuid references public.credit_cards(id) on delete set null;

alter table public.expenses
  drop constraint if exists expenses_payment_source_check;

alter table public.expenses
  add constraint expenses_payment_source_check
  check (payment_source in ('income', 'savings', 'credit_card'));

create index if not exists idx_credit_cards_tracker_id on public.credit_cards (tracker_id);
create index if not exists idx_credit_card_transactions_tracker_id on public.credit_card_transactions (tracker_id);
create index if not exists idx_credit_card_transactions_card_id on public.credit_card_transactions (credit_card_id);
create index if not exists idx_credit_card_transactions_expense_id on public.credit_card_transactions (expense_id);
create index if not exists idx_recurring_transactions_tracker_id on public.recurring_transactions (tracker_id);
create index if not exists idx_recurring_transactions_next_run_date on public.recurring_transactions (next_run_date);
create index if not exists idx_expenses_payment_source_card_id on public.expenses (payment_source_card_id);

alter table public.credit_cards enable row level security;
alter table public.credit_card_transactions enable row level security;
alter table public.recurring_transactions enable row level security;

drop policy if exists "credit_cards_select_member" on public.credit_cards;
create policy "credit_cards_select_member"
on public.credit_cards
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "credit_cards_write_contributor" on public.credit_cards;
create policy "credit_cards_write_contributor"
on public.credit_cards
for all
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = credit_cards.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = credit_cards.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
);

drop policy if exists "credit_card_transactions_select_member" on public.credit_card_transactions;
create policy "credit_card_transactions_select_member"
on public.credit_card_transactions
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "credit_card_transactions_write_contributor" on public.credit_card_transactions;
create policy "credit_card_transactions_write_contributor"
on public.credit_card_transactions
for all
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = credit_card_transactions.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = credit_card_transactions.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
);

drop policy if exists "recurring_transactions_select_member" on public.recurring_transactions;
create policy "recurring_transactions_select_member"
on public.recurring_transactions
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "recurring_transactions_write_contributor" on public.recurring_transactions;
create policy "recurring_transactions_write_contributor"
on public.recurring_transactions
for all
to authenticated
using (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = recurring_transactions.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = recurring_transactions.tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  )
);

alter table public.budget_audit_logs
  drop constraint if exists budget_audit_logs_entity_type_check;

alter table public.budget_audit_logs
  add constraint budget_audit_logs_entity_type_check
  check (
    entity_type in (
      'trackers',
      'tracker_members',
      'expenses',
      'incomes',
      'savings',
      'credit_cards',
      'credit_card_transactions',
      'recurring_transactions'
    )
  );

drop trigger if exists budget_audit_credit_cards on public.credit_cards;
create trigger budget_audit_credit_cards
after insert or update or delete on public.credit_cards
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_credit_card_transactions on public.credit_card_transactions;
create trigger budget_audit_credit_card_transactions
after insert or update or delete on public.credit_card_transactions
for each row execute function public.log_budget_change();

drop trigger if exists budget_audit_recurring_transactions on public.recurring_transactions;
create trigger budget_audit_recurring_transactions
after insert or update or delete on public.recurring_transactions
for each row execute function public.log_budget_change();

comment on table public.credit_cards is 'Tracker-scoped credit cards used for monitoring balances, limits, and due dates.';
comment on table public.credit_card_transactions is 'Tracker-scoped credit card charges and payments.';
comment on table public.recurring_transactions is 'Templates for automatically generating recurring finance entries.';
comment on column public.expenses.payment_source is 'Stores whether the expense was funded by income, savings, or a credit card.';
comment on column public.expenses.payment_source_card_id is 'Stores which credit card funded the expense when payment_source is credit_card.';
