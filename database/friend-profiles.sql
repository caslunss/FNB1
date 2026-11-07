-- Additive profile lookup. No tables, policies or existing rows are changed.
-- Returns display identity only, after verifying an accepted friendship.
begin;
create schema if not exists friend_profiles_private;
revoke all on schema friend_profiles_private from public,anon;
create or replace function friend_profiles_private.app_friend_profile(p_username text)
returns table(user_id uuid,username text,display_name text,photo text)
language plpgsql security definer set search_path='' as $$
declare me uuid := auth.uid(); target uuid;
begin
 if me is null or p_username !~ '^[a-z0-9_]{3,40}$' or not exists(
  select 1 from auth.users u where u.id=me and not coalesce(u.is_anonymous,false)
 ) then return; end if;
 select n.user_id into target from public.app_usernames n where n.username=p_username;
 if target is null or target=me or not exists(
  select 1 from public.app_friends f where f.status='accepted'
   and ((f.sender=me and f.recipient=target) or (f.sender=target and f.recipient=me))
 ) then return; end if;
 return query select u.id,n.username,
  left(coalesce(nullif(w.record#>>'{data,profile,name}',''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'@'||n.username),80),
  coalesce(nullif(w.record#>>'{data,profile,friendPhoto}',''),nullif(u.raw_user_meta_data->>'avatar_url',''),u.raw_user_meta_data->>'picture')
 from auth.users u join public.app_usernames n on n.user_id=u.id
 left join public.app_finance_workspaces w on w.user_id=u.id where u.id=target;
end;
$$;
revoke all on function friend_profiles_private.app_friend_profile(text) from public,anon,authenticated;
grant usage on schema friend_profiles_private to authenticated;
grant execute on function friend_profiles_private.app_friend_profile(text) to authenticated;
create or replace function public.app_friend_profile(p_username text)
returns table(user_id uuid,username text,display_name text,photo text)
language sql security invoker set search_path='' as $$
 select * from friend_profiles_private.app_friend_profile(p_username);
$$;
revoke all on function public.app_friend_profile(text) from public,anon,authenticated;
grant execute on function public.app_friend_profile(text) to authenticated;
commit;
