create or replace function public.current_user_name()
returns text
language sql
stable
as $$
  select nullif(
    trim(
      concat_ws(
        ' ',
        coalesce(auth.jwt() -> 'user_metadata' ->> 'first_name', ''),
        coalesce(auth.jwt() -> 'user_metadata' ->> 'last_name', '')
      )
    ),
    ''
  );
$$;

alter table public.budget_audit_logs
  add column if not exists actor_name text;

update public.budget_audit_logs audit
set actor_name = coalesce(
  nullif(trim(concat_ws(' ', profile.raw_user_meta_data ->> 'first_name', profile.raw_user_meta_data ->> 'last_name')), ''),
  profile.raw_user_meta_data ->> 'full_name',
  audit.actor_email
)
from auth.users profile
where audit.actor_user_id = profile.id
  and audit.actor_name is null;

update public.budget_audit_logs
set actor_name = actor_email
where actor_name is null
  and actor_email is not null;

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
    actor_name,
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
    coalesce(public.current_user_name(), public.current_user_email()),
    auth.uid(),
    public.current_user_email(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

comment on column public.budget_audit_logs.actor_name is 'Display name captured from auth metadata when the audit event was written.';
