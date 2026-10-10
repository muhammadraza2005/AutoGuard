-- Read-only. All columns should be true after migration 019.
select
  to_regprocedure('private.production_seal_issue(uuid,jsonb,jsonb)') is not null as issuance_installed,
  to_regprocedure('private.production_seal_inspect(uuid,uuid,jsonb)') is not null as inspection_installed,
  to_regprocedure('private.production_seal_revoke(uuid,text,text)') is not null as revocation_installed,
  to_regprocedure('private.production_seals_current(uuid)') is not null as live_guard_installed,
  (select count(*)=6 and bool_and(c.relrowsecurity and c.relforcerowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='private' and c.relname in ('production_seal_batches','production_seal_identifiers','production_seal_inspections','production_seal_locations','production_seal_revocations','production_seal_read_events')) as seal_tables_force_rls,
  not exists(select 1 from unnest(array['anon','authenticated','service_role','autoguardian_enrollment_api']) r
   cross join unnest(array['private.production_seal_batches','private.production_seal_identifiers','private.production_seal_inspections','private.production_seal_locations','private.production_seal_revocations','private.production_seal_read_events']) t
   where has_table_privilege(r,t,'SELECT,INSERT,UPDATE,DELETE')) as no_direct_client_access,
  not exists(select 1 from unnest(array['anon','authenticated','service_role']) r where
   has_function_privilege(r,'private.production_seal_issue(uuid,jsonb,jsonb)','EXECUTE') or has_function_privilege(r,'private.production_seal_inspect(uuid,uuid,jsonb)','EXECUTE')
   or has_function_privilege(r,'private.production_seal_revoke(uuid,text,text)','EXECUTE')) as no_direct_client_writers,
  (select not rolcanlogin and not rolsuper and not rolbypassrls from pg_roles where rolname='autoguardian_seal_executor') as executor_restricted,
  (select count(*)=5 from pg_trigger where not tgisinternal and tgname in ('production_batch_immutable','production_identifier_immutable','production_inspection_immutable','production_revocation_immutable','production_seal_read_immutable')) as history_immutable,
  exists(select 1 from pg_trigger where not tgisinternal and tgname='production_seal_activation') as atomic_stock_activation;
