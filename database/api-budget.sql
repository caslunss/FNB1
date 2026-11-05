-- Apply once through a versioned migration before enabling API quotas.
begin;
create table public.app_api_budgets (
 subject text not null, operation text not null, window_start timestamptz not null,
 requests integer not null check(requests>0), primary key(subject,operation)
);
alter table public.app_api_budgets enable row level security;
revoke all on public.app_api_budgets from public,anon,authenticated;
grant select,insert,update,delete on public.app_api_budgets to service_role;
create function public.app_api_take_budget(p_subject text,p_operation text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer; t timestamptz; begin
 if p_limit<1 or p_seconds<1 or p_seconds>3600 or length(p_subject)>200 or length(p_operation)>40 then raise exception 'Invalid budget'; end if;
 t:=to_timestamp(floor(extract(epoch from now())/p_seconds)*p_seconds);
 insert into public.app_api_budgets(subject,operation,window_start,requests) values(p_subject,p_operation,t,1)
 on conflict(subject,operation) do update set window_start=excluded.window_start,
 requests=case when app_api_budgets.window_start=excluded.window_start then app_api_budgets.requests+1 else 1 end returning requests into n;
 return n<=p_limit;
end;$$;
revoke all on function public.app_api_take_budget(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.app_api_take_budget(text,text,integer,integer) to service_role;
commit;
