# Installation order

For a **fresh Supabase database**, apply: `social.sql`, `finance-sync.sql`, `friend-profiles.sql`, `../docs/database/taxes.sql`, `api-budget.sql`. These scripts are transactional and intentionally fail on duplicate tables rather than silently changing an existing deployment.

For existing databases: inventory tables, grants, policies, functions and applied SQL first; take a backup; reconcile missing objects with an additive migration. Do not run the fresh baseline over existing tables. `account-deletion.sql` is an upgrade for older social schemas; the fresh social baseline already uses cascading foreign keys.

Run `finance-sync-security-test.sql` against a disposable Supabase database after installation. A local plain PostgreSQL instance lacks Supabase Auth roles/functions and is not equivalent. The SQL has not been executed against the user's cloud database in this session.

Set `SUPABASE_SECRET_KEY` (or existing service-role alternative) only on the server. Shopping quotas use one allowance per user per 15-second window; investments remain public, with a shared global budget of 60 upstream requests/minute. Cached investment responses do not spend new allowances. Missing quota configuration fails closed with 503; exhausted allowance returns 429 with Retry-After. Never put the server key in public config or VITE variables.

`friend-profiles.sql` adds only an accepted-friend identity lookup: a public SECURITY INVOKER wrapper and a guarded helper in its own non-exposed schema. It does not change tables, policies or user rows and needs no server secret. Existing installations can apply this additive script after the social/workspace baseline.
