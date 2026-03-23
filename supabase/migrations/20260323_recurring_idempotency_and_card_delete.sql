alter table public.expenses
  add column if not exists source_recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null;

alter table public.expenses
  add column if not exists source_recurring_run_date date;

alter table public.incomes
  add column if not exists source_recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null;

alter table public.incomes
  add column if not exists source_recurring_run_date date;

alter table public.savings
  add column if not exists source_recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null;

alter table public.savings
  add column if not exists source_recurring_run_date date;

alter table public.credit_card_transactions
  add column if not exists source_recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null;

alter table public.credit_card_transactions
  add column if not exists source_recurring_run_date date;

create unique index if not exists idx_expenses_recurring_occurrence
  on public.expenses (source_recurring_transaction_id, source_recurring_run_date)
  where source_recurring_transaction_id is not null;

create unique index if not exists idx_incomes_recurring_occurrence
  on public.incomes (source_recurring_transaction_id, source_recurring_run_date)
  where source_recurring_transaction_id is not null;

create unique index if not exists idx_savings_recurring_occurrence
  on public.savings (source_recurring_transaction_id, source_recurring_run_date)
  where source_recurring_transaction_id is not null;

create unique index if not exists idx_credit_card_transactions_recurring_occurrence
  on public.credit_card_transactions (source_recurring_transaction_id, source_recurring_run_date)
  where source_recurring_transaction_id is not null;

create or replace function public.delete_credit_card_with_related(target_credit_card_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tracker_id uuid;
begin
  select tracker_id
  into target_tracker_id
  from public.credit_cards
  where id = target_credit_card_id;

  if target_tracker_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.tracker_members member
    where member.tracker_id = target_tracker_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'member')
  ) then
    raise exception 'Not allowed to delete this credit card.';
  end if;

  delete from public.expenses
  where payment_source = 'credit_card'
    and payment_source_card_id = target_credit_card_id;

  delete from public.credit_card_transactions
  where credit_card_id = target_credit_card_id
    and expense_id is null;

  delete from public.credit_cards
  where id = target_credit_card_id;
end;
$$;

grant execute on function public.delete_credit_card_with_related(uuid) to authenticated;

comment on column public.expenses.source_recurring_transaction_id is 'Links a generated expense back to the recurring template that created it.';
comment on column public.expenses.source_recurring_run_date is 'Stores which scheduled run date produced this generated expense.';
comment on column public.incomes.source_recurring_transaction_id is 'Links a generated income record back to the recurring template that created it.';
comment on column public.incomes.source_recurring_run_date is 'Stores which scheduled run date produced this generated income.';
comment on column public.savings.source_recurring_transaction_id is 'Links a generated savings record back to the recurring template that created it.';
comment on column public.savings.source_recurring_run_date is 'Stores which scheduled run date produced this generated savings entry.';
comment on column public.credit_card_transactions.source_recurring_transaction_id is 'Links a generated credit card transaction back to the recurring template that created it.';
comment on column public.credit_card_transactions.source_recurring_run_date is 'Stores which scheduled run date produced this generated credit card transaction.';
