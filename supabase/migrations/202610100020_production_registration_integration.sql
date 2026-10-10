-- Run once as postgres after 019. No users, consent approval, stock, or provider
-- receipts are created. Existing development drafts cannot become production.
begin;
grant select(enrollment_mode) on app.enrollment_drafts to autoguardian_enrollment_api;
-- Preserve the established authorization, encryption metadata and retry logic.
do $$declare signature text; definition text; needle text; begin
  foreach signature in array array['private.draft_owner_snapshot(uuid)',
    'private.enrollment_attachment_reserve(uuid,uuid,text,text,integer,text)'] loop
    definition:=pg_get_functiondef(signature::regprocedure);
    needle:='if not exists(select 1 from private.development_enrollment_owners';
    if strpos(definition,needle)=0 then raise exception 'Unexpected registration function: %',signature; end if;
    definition:=replace(definition,needle,
      'if d.enrollment_mode=''PRODUCTION'' and not private.production_owner_eligible(d.organization_id,d.owner_profile_id) then raise exception using errcode=''AG422'',message=''OWNER_PROFILE_UNAVAILABLE''; end if; if d.enrollment_mode=''DEVELOPMENT'' and not exists (select 1 from private.development_enrollment_owners');
    if signature like '%owner_snapshot%' then
      definition:=replace(definition,'select e.* into consent',
        'if d.enrollment_mode=''PRODUCTION'' then return jsonb_build_object(''draftId'',d.id,''draftRevision'',d.revision,''ownerProfileId'',d.owner_profile_id,''ownerGeneration'',d.owner_generation,''ciphertext'',details.ciphertext,''savedAt'',details.saved_at,''documents'',''[]''::jsonb,''consent'',null,''mode'',''PRODUCTION'',''sampleOnly'',false,''phoneVerified'',false,''productionConsentVerified'',coalesce(private.registration_consent_current(d.id),false)); end if; select e.* into consent');
    end if;
    execute definition;
  end loop;
  definition:=pg_get_functiondef('private.enrollment_draft_json(app.enrollment_drafts)'::regprocedure);
  execute replace(definition,'''status'',d.status','''mode'',d.enrollment_mode,''status'',d.status');
  -- Creation changes the mode after the shared metadata saver returns.
  definition:=pg_get_functiondef('private.save_production_enrollment_draft(uuid,uuid,uuid,uuid,jsonb,integer)'::regprocedure);
  execute replace(definition,'return result;','return result||jsonb_build_object(''mode'',''PRODUCTION'');');
end;$$;

alter function private.draft_owner_consent(uuid,uuid,integer,integer,text,text,text,boolean) rename to draft_owner_sample_consent;
revoke execute on function private.draft_owner_sample_consent(uuid,uuid,integer,integer,text,text,text,boolean) from autoguardian_enrollment_api;
create function private.draft_owner_consent(p_draft uuid,p_key uuid,p_revision integer,p_generation integer,p_digest text,p_version text,p_language text,p_accept boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts;
begin
  select * into d from app.enrollment_drafts where id=p_draft for update;
  if not found then raise exception using errcode='AG404',message='DRAFT_NOT_FOUND'; end if;
  if d.enrollment_mode='PRODUCTION' then raise exception using errcode='AG403',message='DIRECT_OWNER_CONSENT_REQUIRED'; end if;
  return private.draft_owner_sample_consent(p_draft,p_key,p_revision,p_generation,p_digest,p_version,p_language,p_accept);
end;$$;

-- Mark metadata from the stored mode, never a client flag. Fitting completion
-- remains a saved-record check; only independent inspection verifies physically.
create function private.registration_metadata_mode(p_draft uuid,p_value jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts;
begin
  select * into d from app.enrollment_drafts where id=p_draft;
  if not found then raise exception using errcode='AG404',message='DRAFT_NOT_FOUND'; end if;
  return p_value||jsonb_build_object('mode',d.enrollment_mode,'sampleOnly',d.enrollment_mode='DEVELOPMENT');
end;$$;
alter function private.enrollment_attachment_list(uuid) rename to enrollment_attachment_list_pre_integration;
alter function private.draft_seal_fitting_read(uuid) rename to draft_seal_fitting_read_pre_integration;
alter function private.draft_seal_locations_read(uuid) rename to draft_seal_locations_read_pre_integration;
revoke execute on function private.enrollment_attachment_list_pre_integration(uuid),private.draft_seal_fitting_read_pre_integration(uuid),
  private.draft_seal_locations_read_pre_integration(uuid) from autoguardian_enrollment_api;
create function private.enrollment_attachment_list(p_draft uuid) returns jsonb language sql security definer set search_path='' as $$
  select private.registration_metadata_mode(p_draft,private.enrollment_attachment_list_pre_integration(p_draft))
$$;
create function private.draft_seal_fitting_read(p_draft uuid) returns jsonb language sql security definer set search_path='' as $$
  select private.registration_metadata_mode(p_draft,private.draft_seal_fitting_read_pre_integration(p_draft))
$$;
create function private.draft_seal_locations_read(p_draft uuid) returns jsonb language sql security definer set search_path='' as $$
  select private.registration_metadata_mode(p_draft,private.draft_seal_locations_read_pre_integration(p_draft))
$$;

alter function private.enrollment_readiness(uuid) rename to enrollment_readiness_pre_integration;
revoke execute on function private.enrollment_readiness_pre_integration(uuid) from autoguardian_enrollment_api;
create function private.enrollment_readiness(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; d app.enrollment_drafts; checks jsonb; state jsonb;
begin
  result:=private.enrollment_readiness_pre_integration(p_draft);
  select * into d from app.enrollment_drafts where id=p_draft;
  result:=private.registration_metadata_mode(p_draft,result);
  if d.enrollment_mode='DEVELOPMENT' then return result; end if;
  state:=private.enrollment_submission_status(p_draft);
  select jsonb_agg(case
    when c->>'code'='OWNER_SELECTION' then jsonb_set(c,'{status}',to_jsonb(case when private.production_owner_eligible(d.organization_id,d.owner_profile_id) then 'COMPLETE' else 'MISSING' end))
    when c->>'code'='CONSENT_SAMPLE' then jsonb_set(c,'{status}',to_jsonb(case when coalesce(private.registration_consent_current(d.id),false) then 'COMPLETE' else 'MISSING' end))
    when c->>'code' in ('AGENT_AUTHENTICATION','OWNER_PHONE','CONSENT','PRODUCTION_EVIDENCE','PAYMENT','REVIEW_POLICY') then
      jsonb_set(c,'{status}',to_jsonb(coalesce((select case r->>'status' when 'COMPLETE' then 'COMPLETE' when 'EXPIRED' then 'STALE' when 'STALE' then 'STALE' else 'MISSING' end
        from jsonb_array_elements(state->'checks') r where r->>'code'=c->>'code'),'MISSING')))
    else c end order by n) into checks from jsonb_array_elements(result->'checks') with ordinality v(c,n);
  return result||jsonb_build_object('checks',checks);
end;$$;

-- Two independent stock pages: production IDs never appear as sample stock.
do $$declare definition text; begin
  definition:=pg_get_functiondef('private.development_seal_stock_page(uuid,integer,uuid)'::regprocedure);
  definition:=replace(definition,'private.development_seal_stock_page','private.production_seal_stock_page');
  definition:=replace(definition,'s.organization_id=p_org','s.organization_id=p_org and s.origin=''PRODUCTION''');
  definition:=replace(definition,'''sampleOnly'',true','''mode'',''PRODUCTION'',''sampleOnly'',false');
  execute definition;
  definition:=pg_get_functiondef('private.development_seal_stock_page(uuid,integer,uuid)'::regprocedure);
  execute replace(definition,'s.organization_id=p_org','s.organization_id=p_org and s.origin=''DEVELOPMENT''');
end;$$;

grant create on schema private to autoguardian_enrollment_executor;
alter function private.draft_owner_consent(uuid,uuid,integer,integer,text,text,text,boolean) owner to autoguardian_enrollment_executor;
alter function private.registration_metadata_mode(uuid,jsonb) owner to autoguardian_enrollment_executor;
alter function private.enrollment_attachment_list(uuid) owner to autoguardian_enrollment_executor;
alter function private.draft_seal_fitting_read(uuid) owner to autoguardian_enrollment_executor;
alter function private.draft_seal_locations_read(uuid) owner to autoguardian_enrollment_executor;
alter function private.enrollment_readiness(uuid) owner to autoguardian_enrollment_executor;
alter function private.production_seal_stock_page(uuid,integer,uuid) owner to autoguardian_enrollment_executor;
revoke create on schema private from autoguardian_enrollment_executor;
revoke all on function private.draft_owner_consent(uuid,uuid,integer,integer,text,text,text,boolean),private.registration_metadata_mode(uuid,jsonb),
  private.enrollment_attachment_list(uuid),private.draft_seal_fitting_read(uuid),private.draft_seal_locations_read(uuid),private.enrollment_readiness(uuid),
  private.production_seal_stock_page(uuid,integer,uuid) from public,anon,authenticated,service_role;
grant execute on function private.draft_owner_consent(uuid,uuid,integer,integer,text,text,text,boolean),private.enrollment_attachment_list(uuid),
  private.draft_seal_fitting_read(uuid),private.draft_seal_locations_read(uuid),private.enrollment_readiness(uuid),
  private.production_seal_stock_page(uuid,integer,uuid) to autoguardian_enrollment_api;
commit;
