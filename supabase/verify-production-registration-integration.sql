-- Read-only. Run after 020; each result should be true.
select
  to_regprocedure('private.registration_metadata_mode(uuid,jsonb)') is not null as mode_contract_installed,
  to_regprocedure('private.production_seal_stock_page(uuid,integer,uuid)') is not null as production_stock_installed,
  position('DIRECT_OWNER_CONSENT_REQUIRED' in pg_get_functiondef('private.draft_owner_consent(uuid,uuid,integer,integer,text,text,text,boolean)'::regprocedure))>0 as agent_cannot_accept_owner_consent,
  position('production_owner_eligible' in pg_get_functiondef('private.enrollment_attachment_reserve(uuid,uuid,text,text,integer,text)'::regprocedure))>0 as production_evidence_eligibility,
  position('production_owner_eligible' in pg_get_functiondef('private.draft_owner_snapshot(uuid)'::regprocedure))>0 as production_owner_eligibility,
  not has_function_privilege('anon','private.production_seal_stock_page(uuid,integer,uuid)','EXECUTE')
    and not has_function_privilege('authenticated','private.production_seal_stock_page(uuid,integer,uuid)','EXECUTE') as no_direct_client_stock,
  not has_function_privilege('autoguardian_enrollment_api','private.draft_owner_sample_consent(uuid,uuid,integer,integer,text,text,text,boolean)','EXECUTE') as no_legacy_consent_bypass;
