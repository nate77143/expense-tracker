alter table public.expenses
  add column if not exists payment_source_bank text;

comment on column public.expenses.payment_source_bank
is 'Stores which savings bank funded the expense when payment_source is savings.';
