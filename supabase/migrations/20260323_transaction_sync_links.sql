alter table public.expenses
  add column if not exists target_savings_bank text;

alter table public.savings
  add column if not exists source_expense_id uuid references public.expenses(id) on delete cascade;

alter table public.savings
  add column if not exists source_credit_card_transaction_id uuid references public.credit_card_transactions(id) on delete cascade;

alter table public.savings
  drop constraint if exists savings_single_source_check;

alter table public.savings
  add constraint savings_single_source_check
  check (num_nonnulls(source_expense_id, source_credit_card_transaction_id) <= 1);

create index if not exists idx_expenses_target_savings_bank on public.expenses (target_savings_bank);
create index if not exists idx_savings_source_expense_id on public.savings (source_expense_id);
create index if not exists idx_savings_source_credit_card_transaction_id on public.savings (source_credit_card_transaction_id);

comment on column public.expenses.target_savings_bank is 'Stores which savings bank received the transfer when an expense category moves money into savings.';
comment on column public.savings.source_expense_id is 'Links generated savings rows back to the source expense so deletes stay synchronized.';
comment on column public.savings.source_credit_card_transaction_id is 'Links generated savings rows back to the source credit-card payment so deletes stay synchronized.';
