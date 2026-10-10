-- Run once after 017 as the migration administrator. No sample is promoted.
-- No consent text or production settings are seeded; publish reviewed facts separately.
begin;
create role autoguardian_access_executor nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
grant autoguardian_access_executor to current_user;
-- Only the migration administrator can publish wording. Runtime/client roles
-- have neither membership nor EXECUTE in this administrative path.
create role autoguardian_consent_publisher nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
grant autoguardian_consent_publisher to current_user;
grant usage on schema app,private to autoguardian_consent_publisher;
grant execute on function private.request_tenant_id() to autoguardian_consent_publisher;
grant select(id,status,deleted_at) on app.tenants to autoguardian_consent_publisher;
create policy consent_publisher_tenant on app.tenants for select to autoguardian_consent_publisher
  using(id=private.request_tenant_id() and status='ACTIVE' and deleted_at is null);
grant usage on schema app,private to autoguardian_access_executor;
grant execute on function private.request_tenant_id(),private.request_auth_user_id(),private.enrollment_agent_id(uuid),private.registration_reviewer_id()
  to autoguardian_access_executor;
-- Hosted Auth tables have RLS and no policies for application roles. The SQL
-- Editor postgres role cannot create policies on these provider-owned tables.
-- Keep one read-only Boolean gateway owned by the existing migration admin;
-- it reads only the requested session's metadata, no private domain rows or secrets.
-- No runtime/executor role receives Auth table grants, BYPASSRLS or admin membership.
grant select(id,status,deleted_at) on app.tenants to autoguardian_access_executor;
grant select(id,tenant_id,auth_user_id,status,deleted_at) on app.users to autoguardian_access_executor;
grant select(tenant_id,user_id,role_code,organization_id,valid_from,valid_to,deleted_at) on app.role_assignments to autoguardian_access_executor;
grant select(id,tenant_id,user_id,kind,deleted_at) on private.owners to autoguardian_access_executor;
create policy access_tenant on app.tenants for select to autoguardian_access_executor
  using(id=private.request_tenant_id() and status='ACTIVE' and deleted_at is null and private.request_auth_user_id() is not null);
create policy access_user on app.users for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and auth_user_id=private.request_auth_user_id() and status='ACTIVE' and deleted_at is null
    and exists(select 1 from app.tenants t where t.id=users.tenant_id));
create policy access_role on app.role_assignments for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.users u where u.id=role_assignments.user_id));
create policy access_owner on private.owners for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and deleted_at is null and exists(select 1 from app.users u where u.id=owners.user_id));
create function private.access_actor_id() returns uuid language sql stable security definer set search_path='' as $$
  select id from app.users where tenant_id=private.request_tenant_id() and auth_user_id=private.request_auth_user_id()
$$;
create function private.access_owner_id() returns uuid language sql stable security definer set search_path='' as $$
  select u.id from app.users u join app.role_assignments r on r.tenant_id=u.tenant_id and r.user_id=u.id
  where r.role_code='OWNER' and r.organization_id is null and r.deleted_at is null and r.valid_from<=now() and (r.valid_to is null or r.valid_to>now())
    and (select count(*) from private.owners o where o.user_id=u.id)=1
    and exists(select 1 from private.owners o where o.user_id=u.id and o.kind='PERSON') limit 1
$$;
create function private.managed_auth_session_valid(p_staff boolean) returns boolean language plpgsql stable security definer set search_path='' as $$
declare sid uuid; deadline timestamptz;
begin
  if p_staff is null or private.request_auth_user_id() is null then return false; end if;
  begin
    sid:=nullif(current_setting('autoguardian.session_id',true),'')::uuid;
    deadline:=to_timestamp(nullif(current_setting('autoguardian.staff_until',true),'')::double precision);
  exception when invalid_text_representation or numeric_value_out_of_range then return false; end;
  return exists(select 1 from auth.sessions s where s.id=sid and s.user_id=private.request_auth_user_id()
    and (s.not_after is null or s.not_after>now()) and (not p_staff or
      (deadline>now() and deadline<=now()+interval '1 hour' and s.aal='aal2'
        and exists(select 1 from auth.mfa_factors f where f.id=s.factor_id and f.user_id=s.user_id and f.factor_type='totp' and f.status='verified')
        and exists(select 1 from auth.mfa_amr_claims a where a.session_id=s.id and a.authentication_method='password'
          and a.updated_at<=now() and a.updated_at>now()-interval '1 hour')
        and exists(select 1 from auth.mfa_amr_claims a where a.session_id=s.id and a.authentication_method in ('totp','mfa/totp')
          and a.updated_at<=now() and a.updated_at>now()-interval '1 hour'))));
end; $$;
revoke all on function private.managed_auth_session_valid(boolean) from public,anon,authenticated,service_role;
grant execute on function private.managed_auth_session_valid(boolean) to autoguardian_access_executor;
create function private.access_session_valid(p_staff boolean) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from app.tenants) and private.managed_auth_session_valid(p_staff)
$$;

create table private.registration_consent_documents (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references app.tenants(id), version text not null,
  operator_name text not null, authority_name text not null, privacy_contact text not null, retention_notice text not null,
  text_en text not null, text_fr text not null, text_hash_en text not null, text_hash_fr text not null,
  approved_by text not null, approved_at timestamptz not null, created_at timestamptz not null default now(),
  unique(tenant_id,id),unique(tenant_id,version),check(length(version) between 1 and 100),
  check(length(btrim(operator_name)) between 2 and 200 and length(btrim(authority_name)) between 2 and 200
    and length(btrim(privacy_contact)) between 3 and 500 and length(btrim(retention_notice)) between 20 and 10000
    and length(btrim(approved_by)) between 2 and 200 and approved_at<=created_at),
  check(length(text_en) between 100 and 20000 and length(text_fr) between 100 and 20000),
  check(text_hash_en=encode(sha256(convert_to(text_en,'UTF8')),'hex') and text_hash_fr=encode(sha256(convert_to(text_fr,'UTF8')),'hex')),
  check((operator_name||authority_name||privacy_contact||retention_notice||text_en||text_fr)!~* '\[[^]]+\]|PLACEHOLDER|TODO|example\.com|example\.test')
);
create table private.registration_access_configuration (
  tenant_id uuid primary key references app.tenants(id), production_enabled boolean not null default false,
  consent_document_id uuid, updated_at timestamptz not null default now(),
  foreign key(tenant_id,consent_document_id) references private.registration_consent_documents(tenant_id,id)
);
create table private.registration_consent_events (
  sequence bigint generated always as identity primary key,id uuid not null unique default gen_random_uuid(),
  tenant_id uuid not null,draft_id uuid not null,owner_profile_id uuid not null,actor_id uuid not null,
  session_id uuid not null,action text not null check(action in ('READ','ACCEPT','WITHDRAW')),
  document_id uuid,language text check(language in ('en','fr')),text_hash text,
  draft_revision integer not null,owner_generation integer not null,expected_consent_revision integer not null,
  request_key uuid,created_at timestamptz not null default now(),
  unique(tenant_id,actor_id,request_key),
  foreign key(tenant_id,draft_id) references app.enrollment_drafts(tenant_id,id),
  foreign key(tenant_id,owner_profile_id) references app.users(tenant_id,id),
  foreign key(tenant_id,actor_id) references app.users(tenant_id,id),
  foreign key(tenant_id,document_id) references private.registration_consent_documents(tenant_id,id),
  check(actor_id=owner_profile_id and draft_revision>0 and owner_generation>0 and expected_consent_revision>=0),
  check(action='READ' or (request_key is not null and document_id is not null and language is not null and text_hash ~ '^[0-9a-f]{64}$'))
);
alter table private.registration_consent_documents enable row level security;
alter table private.registration_consent_documents force row level security;
alter table private.registration_access_configuration enable row level security;
alter table private.registration_access_configuration force row level security;
alter table private.registration_consent_events enable row level security;
alter table private.registration_consent_events force row level security;
revoke all on private.registration_consent_documents,private.registration_access_configuration,private.registration_consent_events
  from public,anon,authenticated,service_role,autoguardian_enrollment_api;
grant select,insert on private.registration_consent_documents to autoguardian_consent_publisher;
grant select on private.registration_access_configuration to autoguardian_consent_publisher;
grant insert(tenant_id,consent_document_id),update(consent_document_id,updated_at) on private.registration_access_configuration to autoguardian_consent_publisher;
create policy consent_publisher_document_read on private.registration_consent_documents for select to autoguardian_consent_publisher
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.tenants));
create policy consent_publisher_document_insert on private.registration_consent_documents for insert to autoguardian_consent_publisher
  with check(tenant_id=private.request_tenant_id() and exists(select 1 from app.tenants));
create policy consent_publisher_configuration on private.registration_access_configuration to autoguardian_consent_publisher
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.tenants))
  with check(tenant_id=private.request_tenant_id() and exists(select 1 from app.tenants));
grant select on private.registration_consent_documents,private.registration_access_configuration to autoguardian_access_executor;
grant select,insert on private.registration_consent_events to autoguardian_access_executor;
grant usage on sequence private.registration_consent_events_sequence_seq to autoguardian_access_executor;
create policy consent_document_read on private.registration_consent_documents for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and private.access_actor_id() is not null);
create policy access_configuration_read on private.registration_access_configuration for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.tenants));
-- Authority-controlled eligibility; public signup never grants OWNER or staff.
create function private.registration_production_enabled() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.registration_access_configuration where production_enabled and tenant_id=private.request_tenant_id())
$$;
create table private.production_enrollment_owners (
  tenant_id uuid not null,organization_id uuid not null,user_id uuid not null,label text not null,active boolean not null default true,
  primary key(tenant_id,organization_id,user_id),check(length(btrim(label)) between 2 and 100),
  foreign key(tenant_id,organization_id) references app.organizations(tenant_id,id),
  foreign key(tenant_id,user_id) references app.users(tenant_id,id)
);
alter table private.production_enrollment_owners enable row level security;
alter table private.production_enrollment_owners force row level security;
revoke all on private.production_enrollment_owners from public,anon,authenticated,service_role,autoguardian_enrollment_api;
grant select on private.production_enrollment_owners to autoguardian_enrollment_executor;
create policy production_owner_lookup on private.production_enrollment_owners for select to autoguardian_enrollment_executor
  using(tenant_id=private.request_tenant_id() and active and private.access_session_valid(true)
    and private.enrollment_agent_id(organization_id) is not null);
create function private.production_owner_eligible(p_org uuid,p_owner uuid) returns boolean language sql stable security definer set search_path='' as $$
  select private.access_session_valid(true) and private.registration_production_enabled()
    and exists(select 1 from private.production_enrollment_owners e join app.users u on u.tenant_id=e.tenant_id and u.id=e.user_id
      where e.organization_id=p_org and e.user_id=p_owner
        and exists(select 1 from app.role_assignments r where r.user_id=u.id and r.tenant_id=u.tenant_id and r.role_code='OWNER' and r.organization_id is null
          and r.deleted_at is null and r.valid_from<=now() and (r.valid_to is null or r.valid_to>now()))
        and (select count(*) from private.owners o where o.tenant_id=u.tenant_id and o.user_id=u.id and o.deleted_at is null)=1)
$$;
-- These two lookup policies disclose only authority-enrolled owner membership,
-- never owner names, identity bytes or contact information to an agent.
create policy production_owner_role_lookup on app.role_assignments for select to autoguardian_enrollment_executor
  using(tenant_id=private.request_tenant_id() and role_code='OWNER' and organization_id is null and exists(select 1 from private.production_enrollment_owners e where e.user_id=role_assignments.user_id));
create policy production_owner_record_lookup on private.owners for select to autoguardian_enrollment_executor
  using(tenant_id=private.request_tenant_id() and deleted_at is null and exists(select 1 from private.production_enrollment_owners e where e.user_id=owners.user_id));
drop policy enrollment_draft_executor on app.enrollment_drafts;
create policy enrollment_draft_executor on app.enrollment_drafts to autoguardian_enrollment_executor
  using(tenant_id=private.request_tenant_id() and created_by=private.enrollment_agent_id(organization_id))
  with check(tenant_id=private.request_tenant_id() and created_by=private.enrollment_agent_id(organization_id)
    and ((enrollment_mode='DEVELOPMENT' and exists(select 1 from private.development_enrollment_owners e where e.organization_id=enrollment_drafts.organization_id and e.user_id=enrollment_drafts.owner_profile_id))
      or private.production_owner_eligible(organization_id,owner_profile_id)));
create function private.production_owner_options(p_org uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not private.access_session_valid(true) or not private.registration_production_enabled() or private.enrollment_agent_id(p_org) is null then
    raise exception using errcode='AG403',message='AGENT_ACCESS_REQUIRED'; end if;
  return jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('profileId',user_id,'label',label,'verificationStatus','PHONE_PENDING') order by label,user_id)
    from (select * from private.production_enrollment_owners where organization_id=p_org and private.production_owner_eligible(p_org,user_id) order by label,user_id limit 50) e),'[]'::jsonb));
end; $$;
create function private.save_production_enrollment_draft(p_id uuid,p_key uuid,p_org uuid,p_owner uuid,p_vehicle jsonb,p_expected integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts; result jsonb;
begin
  if p_org is null or p_owner is null then raise exception using errcode='AG400',message='INVALID_DRAFT'; end if;
  if not private.access_session_valid(true) or not private.registration_production_enabled() or private.enrollment_agent_id(p_org) is null then
    raise exception using errcode='AG403',message='AGENT_ACCESS_REQUIRED'; end if;
  if not private.production_owner_eligible(p_org,p_owner) then raise exception using errcode='AG422',message='OWNER_PROFILE_UNAVAILABLE'; end if;
  if p_id is null then
    if p_key is null then raise exception using errcode='AG400',message='INVALID_DRAFT'; end if;
    perform pg_advisory_xact_lock(hashtextextended(private.request_tenant_id()::text||private.enrollment_agent_id(p_org)::text||p_key::text,0));
    select * into d from app.enrollment_drafts where created_by=private.enrollment_agent_id(p_org) and creation_key=p_key;
  else select * into d from app.enrollment_drafts where id=p_id for update; end if;
  if d.id is not null and d.enrollment_mode<>'PRODUCTION' then raise exception using errcode='AG409',message='SAMPLE_CANNOT_BE_PROMOTED'; end if;
  result:=private.save_enrollment_draft_metadata(p_id,p_key,p_org,p_owner,p_vehicle,p_expected);
  if result ? 'error' then return result; end if;
  if p_id is null and d.id is null then
    update app.enrollment_drafts set enrollment_mode='PRODUCTION' where id=(result->>'id')::uuid;
  end if;
  return result;
end; $$;
-- Extend the former development-only tenant lookup only for configured production
-- tenants with a current verified password/TOTP session. Staff roles stay live.
drop policy enrollment_tenant_lookup on app.tenants;
create policy enrollment_tenant_lookup on app.tenants for select to autoguardian_enrollment_executor
  using(id=private.request_tenant_id() and status='ACTIVE' and deleted_at is null and private.request_auth_user_id() is not null
    and (code='AUTOGUARDIAN_DEV' or (private.registration_production_enabled() and private.access_session_valid(true))));
grant select(code) on app.tenants to autoguardian_review_executor;
grant execute on function private.access_session_valid(boolean) to autoguardian_review_executor;
drop policy review_tenant_lookup on app.tenants;
create policy review_tenant_lookup on app.tenants for select to autoguardian_review_executor
  using(id=private.request_tenant_id() and status='ACTIVE' and deleted_at is null and private.request_auth_user_id() is not null
    and (code='AUTOGUARDIAN_DEV' or private.access_session_valid(true)));
grant select on app.enrollment_drafts to autoguardian_access_executor;
grant update(id) on app.enrollment_drafts to autoguardian_access_executor;
create policy access_draft_read on app.enrollment_drafts for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and (created_by=private.enrollment_agent_id(organization_id)
    or (private.registration_reviewer_id() is not null and created_by<>private.registration_reviewer_id())
    or (enrollment_mode='PRODUCTION' and owner_profile_id=private.access_owner_id() and created_by<>owner_profile_id)));
create policy access_draft_lock on app.enrollment_drafts for update to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and (created_by=private.enrollment_agent_id(organization_id)
    or (private.registration_reviewer_id() is not null and created_by<>private.registration_reviewer_id())
    or (enrollment_mode='PRODUCTION' and owner_profile_id=private.access_owner_id() and created_by<>owner_profile_id)))
  with check(tenant_id=private.request_tenant_id());
create policy consent_event_read on private.registration_consent_events for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id));
create policy consent_event_append on private.registration_consent_events for insert to autoguardian_access_executor
  with check(tenant_id=private.request_tenant_id() and actor_id=private.access_owner_id() and private.access_session_valid(false)
    and exists(select 1 from app.enrollment_drafts d where d.id=draft_id and d.enrollment_mode='PRODUCTION' and d.owner_profile_id=actor_id
      and d.created_by<>actor_id and d.revision=draft_revision and d.owner_generation=registration_consent_events.owner_generation));
grant select on private.draft_seal_packages,private.enrollment_prerequisite_receipts,private.enrollment_submissions to autoguardian_access_executor;
create policy access_package_read on private.draft_seal_packages for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id));
create policy access_receipt_read on private.enrollment_prerequisite_receipts for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id));
create policy access_submission_read on private.enrollment_submissions for select to autoguardian_access_executor
  using(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id));
grant insert on private.enrollment_prerequisite_receipts to autoguardian_access_executor;
grant usage on sequence private.enrollment_prerequisite_receipts_sequence_seq to autoguardian_access_executor;
create policy access_receipt_append on private.enrollment_prerequisite_receipts for insert to autoguardian_access_executor
  with check(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id and d.enrollment_mode='PRODUCTION'
    and d.revision=enrollment_prerequisite_receipts.draft_revision and d.owner_generation=enrollment_prerequisite_receipts.owner_generation
    and d.enrollment_snapshot_revision=enrollment_prerequisite_receipts.snapshot_revision
    and ((code in ('AGENT_AUTHENTICATION','CONSENT') and d.created_by=private.enrollment_agent_id(d.organization_id) and private.access_session_valid(true))
      or (code='CONSENT' and not accepted and d.owner_profile_id=private.access_owner_id() and private.access_session_valid(false)))));

create function private.owner_consent_state(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts; doc private.registration_consent_documents; e private.registration_consent_events; history jsonb; revision integer; state text;
begin
  select * into d from app.enrollment_drafts where id=p_draft and enrollment_mode='PRODUCTION';
  if not found then raise exception using errcode='AG404',message='CONSENT_NOT_FOUND'; end if;
  select c.* into doc from private.registration_consent_documents c join private.registration_access_configuration a on a.tenant_id=c.tenant_id and a.consent_document_id=c.id
    where a.tenant_id=d.tenant_id and a.production_enabled;
  select * into e from private.registration_consent_events where draft_id=d.id and owner_profile_id=d.owner_profile_id and action<>'READ' order by sequence desc limit 1;
  select count(*)::integer into revision from private.registration_consent_events where draft_id=d.id and action<>'READ';
  state:=case when e.action='WITHDRAW' then 'WITHDRAWN' when e.action='ACCEPT' and e.document_id=doc.id
    and e.owner_profile_id=d.owner_profile_id and e.owner_generation=d.owner_generation and e.draft_revision=d.revision then 'ACCEPTED'
    when e.action='ACCEPT' then 'STALE' else 'MISSING' end;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'action',action,'documentId',document_id,'language',language,'createdAt',created_at) order by sequence),'[]'::jsonb)
    into history from private.registration_consent_events where draft_id=d.id and owner_profile_id=d.owner_profile_id and action<>'READ';
  return jsonb_build_object('draftId',d.id,'draftRevision',d.revision,'ownerGeneration',d.owner_generation,'consentRevision',revision,'status',state,
    'active',exists(select 1 from private.enrollment_submissions where draft_id=d.id and status='ACTIVE'),
    'vehicle',jsonb_build_object('chassisIdentifier',d.chassis_identifier,'plate',d.plate,'category',d.category,'make',d.make,'model',d.model,'manufactureYear',d.manufacture_year,'color',d.color),
    'document',case when doc.id is null then null else jsonb_build_object('id',doc.id,'version',doc.version,'operator',doc.operator_name,'authority',doc.authority_name,
      'privacyContact',doc.privacy_contact,'retentionNotice',doc.retention_notice,'en',doc.text_en,'fr',doc.text_fr,'hashEn',doc.text_hash_en,'hashFr',doc.text_hash_fr) end,
    'lastDocumentId',e.document_id,'lastLanguage',e.language,'history',history,'phoneVerified',false);
end; $$;
create function private.owner_consent_queue() returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts; items jsonb:='[]'::jsonb;
begin
  if not private.access_session_valid(false) or private.access_owner_id() is null then raise exception using errcode='AG403',message='OWNER_ACCESS_REQUIRED'; end if;
  for d in select * from app.enrollment_drafts where enrollment_mode='PRODUCTION' and owner_profile_id=private.access_owner_id()
    and created_by<>private.access_owner_id() order by updated_at desc,id limit 50 for share loop
    insert into private.registration_consent_events(tenant_id,draft_id,owner_profile_id,actor_id,session_id,action,draft_revision,owner_generation,expected_consent_revision)
      values(d.tenant_id,d.id,d.owner_profile_id,d.owner_profile_id,current_setting('autoguardian.session_id')::uuid,'READ',d.revision,d.owner_generation,0);
    items:=items||jsonb_build_array(jsonb_build_object('id',d.id,'chassisIdentifier',d.chassis_identifier,'plate',d.plate));
  end loop;
  return jsonb_build_object('items',items);
end; $$;
create function private.owner_consent_read(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts; state jsonb;
begin
  if not private.access_session_valid(false) or private.access_owner_id() is null then raise exception using errcode='AG403',message='OWNER_ACCESS_REQUIRED'; end if;
  select * into d from app.enrollment_drafts where id=p_draft and enrollment_mode='PRODUCTION' and owner_profile_id=private.access_owner_id() and created_by<>owner_profile_id for update;
  if not found then raise exception using errcode='AG404',message='CONSENT_NOT_FOUND'; end if;
  state:=private.owner_consent_state(d.id);
  insert into private.registration_consent_events(tenant_id,draft_id,owner_profile_id,actor_id,session_id,action,document_id,draft_revision,owner_generation,expected_consent_revision)
    values(d.tenant_id,d.id,d.owner_profile_id,d.owner_profile_id,current_setting('autoguardian.session_id')::uuid,'READ',
      (state->'document'->>'id')::uuid,d.revision,d.owner_generation,0);
  return state;
end; $$;
create function private.owner_consent_change(p_draft uuid,p_key uuid,p_document uuid,p_language text,p_action text,p_revision integer,p_generation integer,p_consent_revision integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts; old private.registration_consent_events; doc private.registration_consent_documents; state jsonb; fitting integer;
begin
  if not private.access_session_valid(false) or private.access_owner_id() is null then raise exception using errcode='AG403',message='OWNER_ACCESS_REQUIRED'; end if;
  if p_key is null or p_document is null or p_language is null or p_language not in ('en','fr') or p_action is null or p_action not in ('ACCEPT','WITHDRAW')
    or p_revision is null or p_revision<1 or p_generation is null or p_generation<1 or p_consent_revision is null or p_consent_revision<0 then raise exception using errcode='AG400',message='INVALID_CONSENT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(private.request_tenant_id()::text||private.access_owner_id()::text||p_key::text,0));
  select * into d from app.enrollment_drafts where id=p_draft and enrollment_mode='PRODUCTION' and owner_profile_id=private.access_owner_id() and created_by<>owner_profile_id for update;
  if not found then raise exception using errcode='AG404',message='CONSENT_NOT_FOUND'; end if;
  select * into old from private.registration_consent_events where actor_id=d.owner_profile_id and request_key=p_key;
  if found then
    if old.draft_id<>d.id or old.document_id<>p_document or old.language<>p_language or old.action<>p_action or old.draft_revision<>p_revision
      or old.owner_generation<>p_generation or old.expected_consent_revision<>p_consent_revision then raise exception using errcode='AG409',message='IDEMPOTENCY_CONFLICT'; end if;
    -- Return current state; delayed accept retries never undo a later withdrawal.
    return private.owner_consent_state(d.id);
  end if;
  state:=private.owner_consent_state(d.id);
  if d.revision<>p_revision or d.owner_generation<>p_generation or (state->>'consentRevision')::integer<>p_consent_revision
    or (state->>'active')::boolean then raise exception using errcode='AG409',message='CONSENT_CHANGED'; end if;
  if p_action='ACCEPT' and state->'document'->>'id' is distinct from p_document::text then raise exception using errcode='AG422',message='CONSENT_NOT_CONFIGURED'; end if;
  if p_action='ACCEPT' and exists(select 1 from private.enrollment_submissions where draft_id=d.id) then raise exception using errcode='AG409',message='APPLICATION_SUBMITTED'; end if;
  if p_action='ACCEPT' and not exists(select 1 from private.registration_consent_events e where e.draft_id=d.id and e.actor_id=d.owner_profile_id
    and e.action='READ' and e.document_id=p_document and e.session_id=current_setting('autoguardian.session_id')::uuid
    and e.draft_revision=d.revision and e.owner_generation=d.owner_generation) then raise exception using errcode='AG409',message='READ_AGREEMENT_FIRST'; end if;
  if p_action='WITHDRAW' and (state->>'lastDocumentId' is distinct from p_document::text or state->>'lastLanguage' is distinct from p_language) then
    raise exception using errcode='AG409',message='CONSENT_CHANGED'; end if;
  select * into doc from private.registration_consent_documents where id=p_document;
  if not found then raise exception using errcode='AG422',message='CONSENT_NOT_CONFIGURED'; end if;
  insert into private.registration_consent_events(tenant_id,draft_id,owner_profile_id,actor_id,session_id,action,document_id,language,text_hash,draft_revision,owner_generation,expected_consent_revision,request_key)
    values(d.tenant_id,d.id,d.owner_profile_id,d.owner_profile_id,current_setting('autoguardian.session_id')::uuid,p_action,doc.id,p_language,
      case when p_language='en' then doc.text_hash_en else doc.text_hash_fr end,d.revision,d.owner_generation,p_consent_revision,p_key);
  if p_action='WITHDRAW' then
    select coalesce(max(revision),0) into fitting from private.draft_seal_packages where draft_id=d.id and saved_draft_revision=d.revision and owner_profile_id=d.owner_profile_id;
    insert into private.enrollment_prerequisite_receipts(tenant_id,draft_id,draft_revision,owner_generation,fitting_revision,snapshot_revision,code,accepted,trusted_reference,expires_at)
      values(d.tenant_id,d.id,d.revision,d.owner_generation,fitting,d.enrollment_snapshot_revision,'CONSENT',false,'OWNER_WITHDRAWAL:'||p_key::text,now()+interval '1 hour');
  end if;
  return private.owner_consent_state(d.id);
end; $$;
create function private.refresh_registration_access(p_draft uuid) returns void language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts; state jsonb; fitting integer; deadline timestamptz; receipt_code text;
begin
  if not private.access_session_valid(true) then raise exception using errcode='AG403',message='STAFF_MFA_REQUIRED'; end if;
  select * into d from app.enrollment_drafts where id=p_draft and created_by=private.enrollment_agent_id(organization_id) for update;
  if not found then raise exception using errcode='AG404',message='DRAFT_NOT_FOUND'; end if;
  if d.enrollment_mode<>'PRODUCTION' then return; end if;
  if exists(select 1 from private.enrollment_submissions where draft_id=d.id and status='ACTIVE') then return; end if;
  state:=private.owner_consent_state(d.id);
  deadline:=to_timestamp(current_setting('autoguardian.staff_until')::double precision);
  select coalesce(max(revision),0) into fitting from private.draft_seal_packages where draft_id=d.id and saved_draft_revision=d.revision and owner_profile_id=d.owner_profile_id;
  foreach receipt_code in array array['AGENT_AUTHENTICATION','CONSENT'] loop
    insert into private.enrollment_prerequisite_receipts(tenant_id,draft_id,draft_revision,owner_generation,fitting_revision,snapshot_revision,code,accepted,trusted_reference,expires_at)
      values(d.tenant_id,d.id,d.revision,d.owner_generation,fitting,d.enrollment_snapshot_revision,receipt_code,
        case when receipt_code='CONSENT' then state->>'status'='ACCEPTED' else true end,
        case when receipt_code='CONSENT' then 'OWNER_CONSENT:'||coalesce(state->>'lastDocumentId','MISSING') else 'STAFF_SESSION:'||current_setting('autoguardian.session_id') end,deadline);
  end loop;
end; $$;
create function private.staff_access_status() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not private.access_session_valid(true) or (private.enrollment_agent_id(null) is null and private.registration_reviewer_id() is null) then
    raise exception using errcode='AG403',message='STAFF_ACCESS_REQUIRED'; end if;
  return jsonb_build_object('verified',true,'factor','totp','maxAgeSeconds',3600,
    'expiresAt',to_timestamp(current_setting('autoguardian.staff_until')::double precision),
    'agent',private.enrollment_agent_id(null) is not null,'reviewer',private.registration_reviewer_id() is not null);
end; $$;
create function private.registration_consent_current(p_draft uuid) returns boolean language sql stable security definer set search_path='' as $$
  select private.owner_consent_state(p_draft)->>'status'='ACCEPTED'
$$;
-- Recheck live security/consent inside submit/finalize, under their draft lock.
-- A once-valid receipt cannot outlive a revoked session or retired agreement.
alter function private.enrollment_submission_status(uuid) rename to enrollment_submission_receipt_status;
revoke execute on function private.enrollment_submission_receipt_status(uuid) from autoguardian_enrollment_api;
create function private.enrollment_submission_status(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare state jsonb; checks jsonb; auth_ok boolean; consent_ok boolean;
begin
  state:=private.enrollment_submission_receipt_status(p_draft);
  if state->>'mode'<>'PRODUCTION' then return state; end if;
  auth_ok:=private.access_session_valid(true);
  consent_ok:=private.registration_consent_current(p_draft);
  select jsonb_agg(case when c->>'code'='AGENT_AUTHENTICATION' and not auth_ok then jsonb_set(c,'{status}','"REJECTED"'::jsonb)
    when c->>'code'='CONSENT' and not consent_ok then jsonb_set(c,'{status}','"REJECTED"'::jsonb) else c end) into checks
    from jsonb_array_elements(state->'checks') c;
  return state||jsonb_build_object('checks',checks,'canSubmit',(state->>'canSubmit')::boolean and auth_ok and consent_ok,
    'canFinalize',(state->>'canFinalize')::boolean and auth_ok and consent_ok);
end; $$;
-- Narrow trigger owner can serialize an actual owner's withdrawal with activation.
grant create on schema private to autoguardian_access_executor;
alter function private.enrollment_submission_freeze() owner to autoguardian_access_executor;
alter function private.access_actor_id() owner to autoguardian_access_executor;
alter function private.access_owner_id() owner to autoguardian_access_executor;
alter function private.access_session_valid(boolean) owner to autoguardian_access_executor;
alter function private.registration_production_enabled() owner to autoguardian_access_executor;
alter function private.owner_consent_state(uuid) owner to autoguardian_access_executor;
alter function private.owner_consent_queue() owner to autoguardian_access_executor;
alter function private.owner_consent_read(uuid) owner to autoguardian_access_executor;
alter function private.owner_consent_change(uuid,uuid,uuid,text,text,integer,integer,integer) owner to autoguardian_access_executor;
alter function private.refresh_registration_access(uuid) owner to autoguardian_access_executor;
alter function private.staff_access_status() owner to autoguardian_access_executor;
alter function private.registration_consent_current(uuid) owner to autoguardian_access_executor;
revoke create on schema private from autoguardian_access_executor;
revoke all on function private.access_actor_id(),private.access_owner_id(),private.access_session_valid(boolean),private.registration_production_enabled(),
  private.owner_consent_state(uuid),private.owner_consent_queue(),private.owner_consent_read(uuid),
  private.owner_consent_change(uuid,uuid,uuid,text,text,integer,integer,integer),private.refresh_registration_access(uuid),private.staff_access_status(),private.registration_consent_current(uuid)
  from public,anon,authenticated,service_role;
grant execute on function private.access_session_valid(boolean),private.registration_production_enabled() to autoguardian_enrollment_executor;
grant execute on function private.registration_consent_current(uuid) to autoguardian_enrollment_executor;
grant create on schema private to autoguardian_enrollment_executor;
alter function private.production_owner_eligible(uuid,uuid) owner to autoguardian_enrollment_executor;
alter function private.production_owner_options(uuid) owner to autoguardian_enrollment_executor;
alter function private.save_production_enrollment_draft(uuid,uuid,uuid,uuid,jsonb,integer) owner to autoguardian_enrollment_executor;
alter function private.enrollment_submission_status(uuid) owner to autoguardian_enrollment_executor;
revoke create on schema private from autoguardian_enrollment_executor;
revoke all on function private.production_owner_eligible(uuid,uuid),private.production_owner_options(uuid),private.save_production_enrollment_draft(uuid,uuid,uuid,uuid,jsonb,integer),private.enrollment_submission_status(uuid)
  from public,anon,authenticated,service_role;
grant execute on function private.production_owner_options(uuid),private.save_production_enrollment_draft(uuid,uuid,uuid,uuid,jsonb,integer),private.enrollment_submission_status(uuid) to autoguardian_enrollment_api;
grant execute on function private.access_session_valid(boolean) to autoguardian_identity_api,autoguardian_enrollment_api;
grant execute on function private.owner_consent_queue(),private.owner_consent_read(uuid),
  private.owner_consent_change(uuid,uuid,uuid,text,text,integer,integer,integer),private.refresh_registration_access(uuid),private.staff_access_status() to autoguardian_enrollment_api;
-- Published documents and acceptance history are immutable, including to their owner.
create function private.immutable_registration_consent() returns trigger language plpgsql set search_path='' as $$
begin raise exception using errcode='AG403',message='IMMUTABLE_CONSENT_RECORD'; end; $$;
revoke all on function private.immutable_registration_consent() from public,anon,authenticated,service_role;
create trigger consent_document_immutable before update or delete on private.registration_consent_documents for each row execute function private.immutable_registration_consent();
create trigger consent_event_immutable before update or delete on private.registration_consent_events for each row execute function private.immutable_registration_consent();
commit;
