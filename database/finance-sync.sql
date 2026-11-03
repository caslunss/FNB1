create table public.app_finance_workspaces (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 record jsonb not null,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint app_finance_record_format check (
  coalesce((jsonb_typeof(record)='object' and record->'schemaVersion'='3'::jsonb and record->>'moneyUnit'='centavos'
  and jsonb_typeof(record->'data')='object'
  and jsonb_typeof(record#>'{data,items}')='array'
  and jsonb_typeof(record#>'{data,receipts}')='array'
  and jsonb_typeof(record#>'{data,debts}')='array'
  and jsonb_typeof(record#>'{data,splits}')='array'
  and jsonb_typeof(record#>'{data,cart}')='array'
  and jsonb_typeof(record#>'{data,reports}')='object'
  and octet_length(record::text)<=8000000),false)
 )
);
alter table public.app_finance_workspaces enable row level security;
create policy finance_select_owner on public.app_finance_workspaces for select to authenticated using ((select auth.uid())=user_id);
create policy finance_insert_owner on public.app_finance_workspaces for insert to authenticated with check ((select auth.uid())=user_id);
create policy finance_update_owner on public.app_finance_workspaces for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.app_finance_workspaces from public,anon,authenticated;
grant select on public.app_finance_workspaces to authenticated;
grant insert(record),update(record) on public.app_finance_workspaces to authenticated;
create function private.app_finance_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 new.user_id:=old.user_id;
 new.revision:=old.revision+1;
 new.updated_at:=statement_timestamp();
 return new;
end;
$$;
revoke all on function private.app_finance_revision() from public,anon,authenticated;
create trigger app_finance_revision before update on public.app_finance_workspaces for each row execute function private.app_finance_revision();
comment on table public.app_finance_workspaces is 'Account-owned v3 app snapshot. Clients update only after matching the previously read revision. RLS and column grants prevent changing ownership or server revision.';
