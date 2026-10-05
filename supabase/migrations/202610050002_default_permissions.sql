-- Run after 001, as postgres. Existing domain tables remain deny-by-default.
begin;

-- Limit future objects created by this migration owner too.
alter default privileges in schema app, private
    revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema app, private
    revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema app, private
    revoke execute on functions from public, anon, authenticated, service_role;

comment on schema app is 'AutoGuardian domain data. Backend only; do not expose via Data API.';
comment on schema private is 'AutoGuardian protected identity and internal functions. Backend only.';
comment on table app.users is 'Tenant profiles linked to Supabase Auth; no client-editable role claims.';
comment on table app.role_assignments is 'Business roles, not PostgreSQL roles. Backend must check validity and scope.';
comment on table app.ownerships is 'Ownership history. Current means end_at IS NULL and deleted_at IS NULL.';

commit;
