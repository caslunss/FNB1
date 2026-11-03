-- Deletes no existing rows. Makes Admin deleteUser remove social records along
-- with the account in the same database transaction. RLS remains unchanged.
begin;
alter table public.app_friends drop constraint app_friends_sender_fkey,
  add constraint app_friends_sender_fkey foreign key (sender) references auth.users(id) on delete cascade;
alter table public.app_friends drop constraint app_friends_recipient_fkey,
  add constraint app_friends_recipient_fkey foreign key (recipient) references auth.users(id) on delete cascade;
alter table public.app_shared_expenses drop constraint app_shared_expenses_sender_fkey,
  add constraint app_shared_expenses_sender_fkey foreign key (sender) references auth.users(id) on delete cascade;
alter table public.app_shared_expenses drop constraint app_shared_expenses_recipient_fkey,
  add constraint app_shared_expenses_recipient_fkey foreign key (recipient) references auth.users(id) on delete cascade;
commit;
