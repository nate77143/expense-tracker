alter table public.expenses
  add column if not exists created_by_name text;

alter table public.expenses
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.expenses
  add column if not exists created_by_email text;

alter table public.incomes
  add column if not exists created_by_name text;

alter table public.incomes
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.incomes
  add column if not exists created_by_email text;

alter table public.savings
  add column if not exists created_by_name text;

alter table public.savings
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.savings
  add column if not exists created_by_email text;

alter table public.credit_card_transactions
  add column if not exists created_by_name text;

alter table public.credit_card_transactions
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.credit_card_transactions
  add column if not exists created_by_email text;

update public.expenses expense
set
  created_by_name = coalesce(
    nullif(trim(concat_ws(' ', user_profile.raw_user_meta_data ->> 'first_name', user_profile.raw_user_meta_data ->> 'last_name')), ''),
    expense.created_by_name,
    audit.actor_email
  ),
  created_by_user_id = coalesce(expense.created_by_user_id, audit.actor_user_id),
  created_by_email = coalesce(expense.created_by_email, audit.actor_email)
from (
  select distinct on (record_id)
    record_id,
    actor_user_id,
    actor_email
  from public.budget_audit_logs
  where entity_type = 'expenses'
    and action = 'insert'
  order by record_id, occurred_at asc
) audit
left join auth.users user_profile on user_profile.id = audit.actor_user_id
where expense.id = audit.record_id;

update public.incomes income
set
  created_by_name = coalesce(
    nullif(trim(concat_ws(' ', user_profile.raw_user_meta_data ->> 'first_name', user_profile.raw_user_meta_data ->> 'last_name')), ''),
    income.created_by_name,
    audit.actor_email
  ),
  created_by_user_id = coalesce(income.created_by_user_id, audit.actor_user_id),
  created_by_email = coalesce(income.created_by_email, audit.actor_email)
from (
  select distinct on (record_id)
    record_id,
    actor_user_id,
    actor_email
  from public.budget_audit_logs
  where entity_type = 'incomes'
    and action = 'insert'
  order by record_id, occurred_at asc
) audit
left join auth.users user_profile on user_profile.id = audit.actor_user_id
where income.id = audit.record_id;

update public.savings saving
set
  created_by_name = coalesce(
    nullif(trim(concat_ws(' ', user_profile.raw_user_meta_data ->> 'first_name', user_profile.raw_user_meta_data ->> 'last_name')), ''),
    saving.created_by_name,
    audit.actor_email
  ),
  created_by_user_id = coalesce(saving.created_by_user_id, audit.actor_user_id),
  created_by_email = coalesce(saving.created_by_email, audit.actor_email)
from (
  select distinct on (record_id)
    record_id,
    actor_user_id,
    actor_email
  from public.budget_audit_logs
  where entity_type = 'savings'
    and action = 'insert'
  order by record_id, occurred_at asc
) audit
left join auth.users user_profile on user_profile.id = audit.actor_user_id
where saving.id = audit.record_id;

update public.credit_card_transactions card_tx
set
  created_by_name = coalesce(
    nullif(trim(concat_ws(' ', user_profile.raw_user_meta_data ->> 'first_name', user_profile.raw_user_meta_data ->> 'last_name')), ''),
    card_tx.created_by_name,
    audit.actor_email
  ),
  created_by_user_id = coalesce(card_tx.created_by_user_id, audit.actor_user_id),
  created_by_email = coalesce(card_tx.created_by_email, audit.actor_email)
from (
  select distinct on (record_id)
    record_id,
    actor_user_id,
    actor_email
  from public.budget_audit_logs
  where entity_type = 'credit_card_transactions'
    and action = 'insert'
  order by record_id, occurred_at asc
) audit
left join auth.users user_profile on user_profile.id = audit.actor_user_id
where card_tx.id = audit.record_id;

comment on column public.expenses.created_by_name is 'Stores the creator full name captured at insert time for shared tracker display.';
comment on column public.expenses.created_by_user_id is 'Stores which authenticated user created the expense record.';
comment on column public.expenses.created_by_email is 'Stores the creator email captured at insert time as a fallback display value.';
comment on column public.incomes.created_by_name is 'Stores the creator full name captured at insert time for shared tracker display.';
comment on column public.incomes.created_by_user_id is 'Stores which authenticated user created the income record.';
comment on column public.incomes.created_by_email is 'Stores the creator email captured at insert time as a fallback display value.';
comment on column public.savings.created_by_name is 'Stores the creator full name captured at insert time for shared tracker display.';
comment on column public.savings.created_by_user_id is 'Stores which authenticated user created the savings record.';
comment on column public.savings.created_by_email is 'Stores the creator email captured at insert time as a fallback display value.';
comment on column public.credit_card_transactions.created_by_name is 'Stores the creator full name captured at insert time for shared tracker display.';
comment on column public.credit_card_transactions.created_by_user_id is 'Stores which authenticated user created the credit card transaction.';
comment on column public.credit_card_transactions.created_by_email is 'Stores the creator email captured at insert time as a fallback display value.';
