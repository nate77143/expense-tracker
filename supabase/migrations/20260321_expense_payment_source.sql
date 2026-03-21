alter table public.expenses
  add column if not exists payment_source text not null default 'income';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_payment_source_check'
  ) then
    alter table public.expenses
      add constraint expenses_payment_source_check
      check (payment_source in ('income', 'savings'));
  end if;
end $$;

update public.expenses
set payment_source = 'income'
where payment_source is null;

comment on column public.expenses.payment_source
is 'Tracks whether an expense was funded from income or savings.';
