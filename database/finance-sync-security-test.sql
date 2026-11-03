begin;
do $test$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
begin
 insert into auth.users(id,aud,role) values(a,'authenticated','authenticated'),(b,'authenticated','authenticated');
 perform set_config('app.sync_test_a',a::text,true);
 perform set_config('app.sync_test_b',b::text,true);
end $test$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('app.sync_test_a'),true);
do $test$
declare n int; r bigint; u uuid; data jsonb:='{"schemaVersion":3,"moneyUnit":"centavos","data":{"items":[],"receipts":[],"debts":[],"splits":[],"cart":[],"reports":{}}}'::jsonb;
begin
 insert into public.app_finance_workspaces(record) values(data) returning revision,user_id into r,u;
 if r<>1 or u<>auth.uid() then raise exception 'initial ownership/revision failed';end if;
 update public.app_finance_workspaces set record=data where user_id=auth.uid() and revision=1 returning revision into r;
 if r<>2 then raise exception 'revision increment failed';end if;
 update public.app_finance_workspaces set record=data where user_id=auth.uid() and revision=1;
 get diagnostics n=row_count;if n<>0 then raise exception 'stale revision accepted';end if;
 begin update public.app_finance_workspaces set revision=999 where user_id=auth.uid();raise exception 'revision is writable';exception when insufficient_privilege then null;end;
 begin insert into public.app_finance_workspaces(user_id,record) values(current_setting('app.sync_test_b')::uuid,data);raise exception 'owner column writable';exception when insufficient_privilege then null;end;
 begin update public.app_finance_workspaces set record='{}'::jsonb where user_id=auth.uid();raise exception 'incomplete record accepted';exception when check_violation then null;end;
 begin delete from public.app_finance_workspaces where user_id=auth.uid();raise exception 'delete allowed';exception when insufficient_privilege then null;end;
end $test$;
select set_config('request.jwt.claim.sub',current_setting('app.sync_test_b'),true);
do $test$
declare n int;
begin
 select count(*) into n from public.app_finance_workspaces where user_id=current_setting('app.sync_test_a')::uuid;
 if n<>0 then raise exception 'cross account read';end if;
 update public.app_finance_workspaces set record=record where user_id=current_setting('app.sync_test_a')::uuid;
 get diagnostics n=row_count;if n<>0 then raise exception 'cross account write';end if;
end $test$;
set local role anon;
do $test$ begin
 begin perform 1 from public.app_finance_workspaces;raise exception 'anonymous read allowed';exception when insufficient_privilege then null;end;
end $test$;
reset role;
rollback;
select '{"owner_only":true,"anonymous_denied":true,"stale_revision_rejected":true,"server_revision_protected":true,"invalid_record_rejected":true,"tests_rolled_back":true}'::jsonb as validation;
