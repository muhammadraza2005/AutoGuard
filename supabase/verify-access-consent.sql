-- Read-only check after 018. Every boolean should be true; no PII is returned.
select
  to_regclass('private.registration_consent_documents') is not null as documents_installed,
  to_regclass('private.registration_consent_events') is not null as events_installed,
  to_regprocedure('private.access_session_valid(boolean)') is not null as session_check_installed,
  to_regprocedure('private.owner_consent_change(uuid,uuid,uuid,text,text,integer,integer,integer)') is not null as consent_workflow_installed,
  to_regprocedure('private.save_production_enrollment_draft(uuid,uuid,uuid,uuid,jsonb,integer)') is not null as production_entrypoint_installed,
  (select count(*)=4 and bool_and(relrowsecurity and relforcerowsecurity) from pg_class where oid in
    (to_regclass('private.registration_consent_documents'),to_regclass('private.registration_access_configuration'),
     to_regclass('private.registration_consent_events'),to_regclass('private.production_enrollment_owners'))) as forced_rls,
  not pg_has_role('autoguardian_identity_login','autoguardian_access_executor','MEMBER') as runtime_cannot_be_executor,
  not pg_has_role('autoguardian_identity_login','autoguardian_consent_publisher','MEMBER') as runtime_cannot_publish,
  not has_table_privilege('autoguardian_enrollment_api','private.registration_consent_events','SELECT,INSERT,UPDATE,DELETE') as no_runtime_table_access,
  not has_table_privilege('autoguardian_access_executor','private.registration_consent_events','UPDATE,DELETE,TRUNCATE') as append_only_history,
  not has_column_privilege('autoguardian_access_executor','auth.sessions','id','SELECT') as no_direct_session_rows,
  not has_function_privilege('autoguardian_enrollment_api','private.managed_auth_session_valid(boolean)','EXECUTE') as no_direct_managed_gateway,
  not has_column_privilege('autoguardian_access_executor','auth.mfa_factors','secret','SELECT') as factor_secrets_private;
