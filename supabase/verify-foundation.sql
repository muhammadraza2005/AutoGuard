-- Read-only: run after both migrations. Expected: 8 tables, 14 roles,
-- all rls_enabled/rls_forced true, and no client_access rows.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where (n.nspname, c.relname) in (
    ('app', 'tenants'), ('app', 'roles'), ('app', 'users'), ('app', 'organizations'),
    ('app', 'role_assignments'), ('private', 'owners'), ('app', 'vehicles'), ('app', 'ownerships'))
order by 1, 2;

select count(*) as business_role_count from app.roles;

select r.role_name, t.schema_name, t.table_name, p.privilege as client_access
from (values ('anon'), ('authenticated'), ('service_role')) r(role_name)
cross join (values ('app', 'tenants'), ('app', 'roles'), ('app', 'users'), ('app', 'organizations'),
    ('app', 'role_assignments'), ('private', 'owners'), ('app', 'vehicles'), ('app', 'ownerships')) t(schema_name, table_name)
cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(privilege)
where has_table_privilege(r.role_name, format('%I.%I', t.schema_name, t.table_name), p.privilege);
