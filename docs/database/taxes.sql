-- Additive schema. Financial workspaces remain unchanged.
create table public.app_tax_records (
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id text not null check (length(item_id) between 1 and 100),
 revision bigint not null default 1 check (revision>0),
 record jsonb not null check (jsonb_typeof(record)='object' and octet_length(record::text)<150000),
 updated_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
alter table public.app_tax_records enable row level security;
revoke all on public.app_tax_records from public,anon,authenticated;
grant select on public.app_tax_records to authenticated;
grant select,insert,update,delete on public.app_tax_records to service_role;
create policy tax_owner_read on public.app_tax_records for select to authenticated using ((select auth.uid())=user_id);
create table public.app_tax_rate_cache (
 cache_key text not null, valid_from date not null, valid_until date not null,
 version text not null, payload jsonb not null, checked_at timestamptz not null default now(),
 primary key(cache_key,version),check(valid_until>=valid_from)
);
alter table public.app_tax_rate_cache enable row level security;
revoke all on public.app_tax_rate_cache from public,anon,authenticated;
grant select,insert,update,delete on public.app_tax_rate_cache to service_role;
create table public.app_tax_activity_profiles (
 id uuid primary key default gen_random_uuid(),cnae text not null,uf text not null,
 valid_from date not null,valid_until date not null,effective_rate_ppm integer not null check(effective_rate_ppm between 0 and 1000000),
 methodology text not null,enabled boolean not null default false,
 check(valid_until>=valid_from),unique(cnae,uf,valid_from)
);
alter table public.app_tax_activity_profiles enable row level security;
revoke all on public.app_tax_activity_profiles from public,anon,authenticated;
grant select,insert,update,delete on public.app_tax_activity_profiles to service_role;
comment on table public.app_tax_records is 'Owner-readable tax evidence; only authenticated backend writes computed snapshots. No fiscal files or bank credentials.';
create table public.app_tax_request_budget (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null,requests integer not null
);
alter table public.app_tax_request_budget enable row level security;
revoke all on public.app_tax_request_budget from public,anon,authenticated;
grant select,insert,update,delete on public.app_tax_request_budget to service_role;
create function public.app_tax_take_budget(p_user_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;begin
 insert into public.app_tax_request_budget(user_id,window_start,requests) values(p_user_id,date_trunc('hour',now()),1)
 on conflict(user_id) do update set window_start=excluded.window_start,requests=case when public.app_tax_request_budget.window_start=excluded.window_start then public.app_tax_request_budget.requests+1 else 1 end returning requests into n;
 return n<=30;end;$$;
revoke all on function public.app_tax_take_budget(uuid) from public,anon,authenticated;
grant execute on function public.app_tax_take_budget(uuid) to service_role;
create table public.app_tax_record_history (
 user_id uuid not null,item_id text not null,revision bigint not null,record jsonb not null,
 created_at timestamptz not null default now(),primary key(user_id,item_id,revision),
 foreign key(user_id,item_id) references public.app_tax_records(user_id,item_id) on delete cascade
);
alter table public.app_tax_record_history enable row level security;
revoke all on public.app_tax_record_history from public,anon,authenticated;
grant select on public.app_tax_record_history to authenticated;
grant select,insert,delete on public.app_tax_record_history to service_role;
create policy tax_history_owner_read on public.app_tax_record_history for select to authenticated using ((select auth.uid())=user_id);
create function public.app_tax_snapshot_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin insert into public.app_tax_record_history(user_id,item_id,revision,record) values(new.user_id,new.item_id,new.revision,new.record);return new;end;$$;
revoke all on function public.app_tax_snapshot_revision() from public,anon,authenticated;
grant execute on function public.app_tax_snapshot_revision() to service_role;
create trigger tax_revision_history after insert or update on public.app_tax_records for each row execute function public.app_tax_snapshot_revision();
create index app_tax_record_date on public.app_tax_records(user_id,(record->>'date'));
