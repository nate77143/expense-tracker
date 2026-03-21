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

create or replace function public.can_manage_tracker(target_tracker_id uuid)
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
      and member.role in ('owner', 'admin')
      and (
        member.user_id = auth.uid()
        or lower(member.email) = public.current_user_email()
      )
  );
$$;

create or replace function public.is_tracker_owner(target_tracker_id uuid)
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
      and member.role = 'owner'
      and (
        member.user_id = auth.uid()
        or lower(member.email) = public.current_user_email()
      )
  );
$$;

create or replace function public.can_contribute_tracker(target_tracker_id uuid)
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
      and member.role in ('owner', 'admin', 'member')
      and (
        member.user_id = auth.uid()
        or lower(member.email) = public.current_user_email()
      )
  );
$$;

drop policy if exists "trackers_select_member" on public.trackers;
create policy "trackers_select_member"
on public.trackers
for select
to authenticated
using (public.is_tracker_member(id));

drop policy if exists "trackers_update_owner_admin" on public.trackers;
create policy "trackers_update_owner_admin"
on public.trackers
for update
to authenticated
using (public.can_manage_tracker(id))
with check (public.can_manage_tracker(id));

drop policy if exists "trackers_delete_owner" on public.trackers;
create policy "trackers_delete_owner"
on public.trackers
for delete
to authenticated
using (public.is_tracker_owner(id));

drop policy if exists "tracker_members_select_member" on public.tracker_members;
create policy "tracker_members_select_member"
on public.tracker_members
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "tracker_members_insert_owner_or_admin" on public.tracker_members;
create policy "tracker_members_insert_owner_or_admin"
on public.tracker_members
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and role = 'owner'
    and status = 'active'
  )
  or public.can_manage_tracker(tracker_id)
);

drop policy if exists "tracker_members_update_owner_or_admin" on public.tracker_members;
create policy "tracker_members_update_owner_or_admin"
on public.tracker_members
for update
to authenticated
using (public.can_manage_tracker(tracker_id))
with check (public.can_manage_tracker(tracker_id));

drop policy if exists "tracker_members_delete_owner_or_admin" on public.tracker_members;
create policy "tracker_members_delete_owner_or_admin"
on public.tracker_members
for delete
to authenticated
using (public.can_manage_tracker(tracker_id));

drop policy if exists "expenses_select_member" on public.expenses;
create policy "expenses_select_member"
on public.expenses
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "expenses_write_contributor" on public.expenses;
create policy "expenses_write_contributor"
on public.expenses
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));

drop policy if exists "incomes_select_member" on public.incomes;
create policy "incomes_select_member"
on public.incomes
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "incomes_write_contributor" on public.incomes;
create policy "incomes_write_contributor"
on public.incomes
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));

drop policy if exists "savings_select_member" on public.savings;
create policy "savings_select_member"
on public.savings
for select
to authenticated
using (public.is_tracker_member(tracker_id));

drop policy if exists "savings_write_contributor" on public.savings;
create policy "savings_write_contributor"
on public.savings
for all
to authenticated
using (public.can_contribute_tracker(tracker_id))
with check (public.can_contribute_tracker(tracker_id));
