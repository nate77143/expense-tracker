create or replace function public.cleanup_budget_audit_logs(retention_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.budget_audit_logs
  where occurred_at < now() - make_interval(days => retention_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.cleanup_budget_audit_logs(integer)
is 'Deletes budget audit logs older than the provided retention window in days. Default is 90 days.';
