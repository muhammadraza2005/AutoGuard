-- SRS F1/section 8: signed batch IDs, four seals or NONE, confidential fitting.
-- Independent MFA TENANT_ADMIN inspection is the project owner's safe default.
begin;
create role autoguardian_seal_executor nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
grant autoguardian_seal_executor to current_user;
grant usage on schema app,private to autoguardian_seal_executor;
grant execute on function private.request_tenant_id(),private.request_auth_user_id(),private.enrollment_agent_id(uuid),
  private.registration_reviewer_id(),private.access_session_valid(boolean) to autoguardian_seal_executor;

alter table private.development_seal_stock drop constraint development_seal_stock_code_check;
alter table private.development_seal_stock drop constraint development_seal_stock_batch_code_check;
alter table private.development_seal_stock drop constraint development_seal_stock_status_check;
alter table private.development_seal_stock add column origin text not null default 'DEVELOPMENT' check(origin in ('DEVELOPMENT','PRODUCTION'));
alter table private.development_seal_stock add column revocation_reason text;
alter table private.development_seal_stock add constraint production_revocation_reason check(origin<>'PRODUCTION' or status<>'REVOKED' or (revocation_reason is not null and revocation_reason in ('DAMAGED','REPLACED','LOST','FRAUD')));
alter table private.development_seal_stock add constraint seal_stock_code_check check(
  (origin='DEVELOPMENT' and code ~ '^DEV-SEAL-[A-Z0-9-]{1,40}$') or (origin='PRODUCTION' and code ~ '^AG[A-F0-9]{32}$'));
alter table private.development_seal_stock add constraint seal_stock_batch_check check(char_length(batch_code) between 3 and 64);
alter table private.development_seal_stock add constraint seal_stock_status_check check(status in ('IN_STOCK','ACTIVE','REVOKED','DESTROYED'));

create table private.production_seal_batches (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,issuer_id uuid not null,request_key uuid not null,
  payload jsonb not null,created_at timestamptz not null default now(),unique(tenant_id,issuer_id,request_key),unique(tenant_id,id),
  foreign key(tenant_id,issuer_id) references app.users(tenant_id,id)
);
create table private.production_seal_identifiers (
  seal_id uuid primary key,tenant_id uuid not null,batch_id uuid not null,key_version text not null,
  qr_url text not null check(char_length(qr_url)<512),created_at timestamptz not null default now(),
  foreign key(tenant_id,seal_id) references private.development_seal_stock(tenant_id,id),
  foreign key(tenant_id,batch_id) references private.production_seal_batches(tenant_id,id)
);
create table private.production_seal_inspections (
  sequence bigint generated always as identity primary key,id uuid not null unique default gen_random_uuid(),
  tenant_id uuid not null,draft_id uuid not null,inspector_id uuid not null,request_key uuid not null,payload jsonb not null,
  draft_revision integer not null,snapshot_revision integer not null,fitting_revision integer not null,
  accepted boolean not null,created_at timestamptz not null default now(),unique(tenant_id,inspector_id,request_key),
  foreign key(tenant_id,draft_id) references app.enrollment_drafts(tenant_id,id),
  foreign key(tenant_id,inspector_id) references app.users(tenant_id,id)
);
-- Optional category presets. Unset categories use SRS OTHER with a real comment.
-- Provisional suggested positions may be stored here but can NEVER pass inspection.
create table private.production_seal_locations (
  tenant_id uuid not null,category text not null,code text not null,approved boolean not null default false,
  primary key(tenant_id,category,code),check(code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  foreign key(tenant_id) references app.tenants(id)
);
create table private.production_seal_revocations (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,seal_id uuid not null,actor_id uuid not null,request_key uuid not null,
  reason text not null check(reason in ('DAMAGED','REPLACED','LOST','FRAUD')),created_at timestamptz not null default now(),unique(tenant_id,actor_id,request_key),
  foreign key(tenant_id,seal_id) references private.development_seal_stock(tenant_id,id),foreign key(tenant_id,actor_id) references app.users(tenant_id,id)
);
create table private.production_seal_read_events (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,draft_id uuid not null,actor_id uuid not null,created_at timestamptz not null default now(),
  foreign key(tenant_id,draft_id) references app.enrollment_drafts(tenant_id,id),foreign key(tenant_id,actor_id) references app.users(tenant_id,id)
);

grant select on app.users,app.role_assignments,app.organizations,app.agent_accreditations to autoguardian_seal_executor;
create policy seal_user_lookup on app.users for select to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and status='ACTIVE' and deleted_at is null and private.access_session_valid(true));
create policy seal_role_lookup on app.role_assignments for select to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and private.access_session_valid(true));
create policy seal_org_lookup on app.organizations for select to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and status='ACTIVE' and deleted_at is null and private.access_session_valid(true));
create policy seal_accreditation_lookup on app.agent_accreditations for select to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and private.access_session_valid(true));
grant select,insert on private.development_seal_stock to autoguardian_seal_executor;
grant update(id,status,revocation_reason) on private.development_seal_stock to autoguardian_seal_executor;
create policy production_stock_scope on private.development_seal_stock to autoguardian_seal_executor
  using(tenant_id=private.request_tenant_id() and origin='PRODUCTION' and private.access_session_valid(true)
    and (private.registration_reviewer_id() is not null or assigned_agent_id=private.enrollment_agent_id(organization_id)))
  with check(tenant_id=private.request_tenant_id() and origin='PRODUCTION' and private.access_session_valid(true));
grant select on app.enrollment_drafts to autoguardian_seal_executor;
grant update(id) on app.enrollment_drafts to autoguardian_seal_executor;
create policy seal_draft_scope on app.enrollment_drafts to autoguardian_seal_executor
  using(tenant_id=private.request_tenant_id() and private.access_session_valid(true)
    and (created_by=private.enrollment_agent_id(organization_id) or (private.registration_reviewer_id() is not null and created_by<>private.registration_reviewer_id())))
  with check(tenant_id=private.request_tenant_id());
grant select on private.draft_seal_packages,private.draft_seal_placements,private.draft_seal_location_notes,
  private.enrollment_attachments,private.registration_review_events,private.enrollment_submissions to autoguardian_seal_executor;
do $$declare t text;begin
  foreach t in array array['draft_seal_packages','draft_seal_placements','draft_seal_location_notes','enrollment_attachments','registration_review_events','enrollment_submissions'] loop
    execute format('create policy seal_related_read on private.%I for select to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id))',t);
  end loop;
  foreach t in array array['production_seal_batches','production_seal_identifiers','production_seal_inspections','production_seal_locations','production_seal_revocations','production_seal_read_events'] loop
    execute format('alter table private.%I enable row level security',t);
    execute format('alter table private.%I force row level security',t);
    execute format('revoke all on private.%I from public,anon,authenticated,service_role,autoguardian_enrollment_api',t);
  end loop;
end;$$;
grant select,insert on private.production_seal_batches,private.production_seal_identifiers,private.production_seal_inspections to autoguardian_seal_executor;
grant select on private.production_seal_locations to autoguardian_seal_executor;
grant select,insert on private.production_seal_revocations to autoguardian_seal_executor;
grant insert on private.production_seal_read_events to autoguardian_seal_executor;
create policy seal_revocation_scope on private.production_seal_revocations to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and private.registration_reviewer_id() is not null) with check(tenant_id=private.request_tenant_id() and actor_id=private.registration_reviewer_id());
create policy seal_read_append on private.production_seal_read_events for insert to autoguardian_seal_executor with check(tenant_id=private.request_tenant_id() and private.access_session_valid(true) and exists(select 1 from app.enrollment_drafts d where d.id=draft_id and actor_id=coalesce(private.registration_reviewer_id(),private.enrollment_agent_id(d.organization_id))));
grant usage on sequence private.production_seal_inspections_sequence_seq to autoguardian_seal_executor;
create policy seal_batch_scope on private.production_seal_batches to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and private.registration_reviewer_id() is not null) with check(tenant_id=private.request_tenant_id() and issuer_id=private.registration_reviewer_id());
create policy seal_identifier_scope on private.production_seal_identifiers to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and exists(select 1 from private.development_seal_stock s where s.id=seal_id)) with check(tenant_id=private.request_tenant_id() and private.registration_reviewer_id() is not null);
create policy seal_inspection_scope on private.production_seal_inspections to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id)) with check(tenant_id=private.request_tenant_id() and inspector_id=private.registration_reviewer_id() and exists(select 1 from app.enrollment_drafts d where d.id=draft_id and d.created_by<>inspector_id));
create policy seal_location_scope on private.production_seal_locations to autoguardian_seal_executor using(tenant_id=private.request_tenant_id() and private.access_session_valid(true));
grant insert on private.enrollment_prerequisite_receipts to autoguardian_seal_executor;
grant usage on sequence private.enrollment_prerequisite_receipts_sequence_seq to autoguardian_seal_executor;
create policy seal_receipt_append on private.enrollment_prerequisite_receipts for insert to autoguardian_seal_executor
  with check(tenant_id=private.request_tenant_id() and code='SEALS' and private.access_session_valid(true)
    and private.registration_reviewer_id() is not null and exists(select 1 from app.enrollment_drafts d where d.id=draft_id and d.enrollment_mode='PRODUCTION' and d.created_by<>private.registration_reviewer_id()
      and d.revision=enrollment_prerequisite_receipts.draft_revision and d.enrollment_snapshot_revision=enrollment_prerequisite_receipts.snapshot_revision));

create function private.production_seal_issue(p_key uuid,p_input jsonb,p_seals jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid;previous private.production_seal_batches;b uuid:=gen_random_uuid();s jsonb;seal uuid;items jsonb;
begin
  actor:=private.registration_reviewer_id();
  if actor is null or not private.access_session_valid(true) then raise exception using errcode='AG403';end if;
  if p_key is null or jsonb_typeof(p_input)<>'object' or p_input->>'physicalBatchConfirmed'<>'true' or p_input->>'type' not in ('STANDARD','ALARM')
    or (p_input->>'quantity')::integer not between 1 and 100 or jsonb_typeof(p_seals)<>'array' or jsonb_array_length(p_seals)<>(p_input->>'quantity')::integer
    or char_length(p_input->>'manufacturer') not between 3 and 160 or char_length(p_input->>'batch') not between 3 and 64
    or (p_input->>'manufacturedOn')::date>current_date then raise exception using errcode='AG400';end if;
  perform pg_advisory_xact_lock(hashtextextended(private.request_tenant_id()::text||actor::text||p_key::text,0));
  select * into previous from private.production_seal_batches where issuer_id=actor and request_key=p_key;
  if found then
    if previous.payload<>p_input then raise exception using errcode='AG409';end if;b:=previous.id;
  else
    if not exists(select 1 from app.organizations where id=(p_input->>'organizationId')::uuid) or not exists(select 1 from app.users u
      join app.role_assignments r on r.user_id=u.id and r.tenant_id=u.tenant_id join app.agent_accreditations a on a.user_id=u.id and a.tenant_id=u.tenant_id and a.organization_id=r.organization_id
      where u.id=(p_input->>'agentId')::uuid and r.organization_id=(p_input->>'organizationId')::uuid and r.role_code='ENROLLMENT_AGENT'
      and r.deleted_at is null and r.valid_from<=now() and (r.valid_to is null or r.valid_to>now()) and a.status='ACTIVE'
      and a.valid_from<=now() and (a.valid_to is null or a.valid_to>now())) then raise exception using errcode='AG403';end if;
    insert into private.production_seal_batches(id,tenant_id,issuer_id,request_key,payload) values(b,private.request_tenant_id(),actor,p_key,p_input);
    for s in select value from jsonb_array_elements(p_seals) loop
      if s->>'code' !~ '^AG[A-F0-9]{32}$' or s->>'keyVersion' !~ '^[A-Za-z0-9_-]{1,32}$' or s->>'qrUrl' !~ '^https://' then raise exception using errcode='AG400';end if;
      seal:=gen_random_uuid();
      insert into private.development_seal_stock(id,tenant_id,organization_id,assigned_agent_id,code,batch_code,type,origin)
        values(seal,private.request_tenant_id(),(p_input->>'organizationId')::uuid,(p_input->>'agentId')::uuid,s->>'code',p_input->>'batch',p_input->>'type','PRODUCTION');
      insert into private.production_seal_identifiers(seal_id,tenant_id,batch_id,key_version,qr_url) values(seal,private.request_tenant_id(),b,s->>'keyVersion',s->>'qrUrl');
    end loop;
  end if;
  select jsonb_agg(jsonb_build_object('code',s.code,'qrUrl',i.qr_url,'keyVersion',i.key_version,'status',s.status) order by s.code) into items
    from private.production_seal_identifiers i join private.development_seal_stock s on s.id=i.seal_id where i.batch_id=b;
  return jsonb_build_object('batchId',b,'seals',items,'physicalAuthenticity','ISSUER_ATTESTED');
end;$$;

create function private.production_seal_verify(p_code text,p_version text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.development_seal_stock;
begin
  if not private.access_session_valid(true) then raise exception using errcode='AG403';end if;
  select stock.* into s from private.development_seal_stock stock join private.production_seal_identifiers i on i.seal_id=stock.id where stock.code=p_code and i.key_version=p_version;
  if not found then raise exception using errcode='AG404';end if;
  return jsonb_build_object('code',s.code,'status',s.status,'revocationReason',s.revocation_reason,'signatureVerified',true,'available',s.status='IN_STOCK' and not exists(select 1 from private.draft_seal_placements where seal_id=s.id));
end;$$;

create function private.production_seals_current(p_draft uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts;h private.draft_seal_packages;e private.production_seal_inspections;
begin
  select * into d from app.enrollment_drafts where id=p_draft;
  if not found or d.enrollment_mode<>'PRODUCTION' then return false;end if;
  select * into h from private.draft_seal_packages where draft_id=d.id;
  select * into e from private.production_seal_inspections where draft_id=d.id order by sequence desc limit 1;
  if not coalesce(e.accepted and e.draft_revision=d.revision and e.snapshot_revision=d.enrollment_snapshot_revision and e.fitting_revision=h.revision and h.saved_draft_revision=d.revision,false) then return false;end if;
  if h.package='NONE' then return not exists(select 1 from private.draft_seal_placements where draft_id=d.id and released_at is null);end if;
  return (select count(*)=4 from private.draft_seal_placements where draft_id=d.id and released_at is null)
    and not exists(select 1 from jsonb_array_elements(e.payload->'placements') x where x->>'location'<>'OTHER'
      and not exists(select 1 from private.production_seal_locations where category=d.category and code=x->>'location' and approved))
    and not exists(select 1 from private.draft_seal_placements p left join private.enrollment_attachments a on a.id=p.photo_id
      where p.draft_id=d.id and p.released_at is null and (a.status is distinct from 'STAGED' or a.owner_generation is distinct from d.owner_generation
        or not exists(select 1 from private.registration_review_events r where r.attachment_id=p.photo_id and r.reviewer_id=e.inspector_id
          and r.action='ACCEPTED' and r.draft_revision=d.revision and r.snapshot_revision=d.enrollment_snapshot_revision
          and r.sequence=(select max(sequence) from private.registration_review_events where attachment_id=p.photo_id and action<>'READ_REQUESTED'))))
    and not exists(select 1 from private.draft_seal_placements p left join private.development_seal_stock s on s.id=p.seal_id
      left join private.production_seal_identifiers i on i.seal_id=s.id where p.draft_id=d.id and p.released_at is null and (s.origin is distinct from 'PRODUCTION' or i.seal_id is null
        or (s.status is distinct from 'IN_STOCK' and not(s.status='ACTIVE' and exists(select 1 from private.enrollment_submissions where draft_id=d.id and status='ACTIVE')))));
end;$$;
create function private.production_seal_revoke(p_key uuid,p_code text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid;s private.development_seal_stock;e private.production_seal_revocations;
begin
  actor:=private.registration_reviewer_id();if actor is null or not private.access_session_valid(true) then raise exception using errcode='AG403';end if;
  if p_key is null or p_reason not in ('DAMAGED','REPLACED','LOST','FRAUD') then raise exception using errcode='AG400';end if;
  perform pg_advisory_xact_lock(hashtextextended(private.request_tenant_id()::text||actor::text||p_key::text,0));
  select * into s from private.development_seal_stock where code=p_code for update;if not found then raise exception using errcode='AG404';end if;
  select * into e from private.production_seal_revocations where actor_id=actor and request_key=p_key;
  if found then
    if e.seal_id<>s.id or e.reason<>p_reason then raise exception using errcode='AG409';end if;
  else
    if s.status in ('REVOKED','DESTROYED') then raise exception using errcode='AG409';end if;
    update private.development_seal_stock set status='REVOKED',revocation_reason=p_reason where id=s.id;
    insert into private.production_seal_revocations(tenant_id,seal_id,actor_id,request_key,reason) values(s.tenant_id,s.id,actor,p_key,p_reason);
  end if;
  return jsonb_build_object('code',s.code,'status','REVOKED','reason',p_reason);
end;$$;

create function private.production_seal_read(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts;h private.draft_seal_packages;items jsonb;locations jsonb;
begin
  select * into d from app.enrollment_drafts where id=p_draft and enrollment_mode='PRODUCTION' for share;
  if not found then raise exception using errcode='AG404';end if;
  insert into private.production_seal_read_events(tenant_id,draft_id,actor_id) values(d.tenant_id,d.id,coalesce(private.registration_reviewer_id(),private.enrollment_agent_id(d.organization_id)));
  select * into h from private.draft_seal_packages where draft_id=d.id;
  select jsonb_agg(jsonb_build_object('position',p.position,'code',s.code,'status',s.status,'type',s.type,'photoId',p.photo_id,'description',n.description) order by p.position) into items
    from private.draft_seal_placements p join private.development_seal_stock s on s.id=p.seal_id
    left join private.draft_seal_location_notes l on l.draft_id=d.id and l.draft_revision=d.revision and l.fitting_revision=h.revision
    left join lateral(select x->>'description' as description from jsonb_array_elements(l.locations) x where (x->>'position')::integer=p.position) n on true
    where p.draft_id=d.id and p.released_at is null;
  select jsonb_agg(jsonb_build_object('code',code,'approved',approved) order by code) into locations from private.production_seal_locations where category=d.category;
  return jsonb_build_object('draftId',d.id,'draftRevision',d.revision,'snapshotRevision',d.enrollment_snapshot_revision,'package',h.package,
    'inspectionRevision',(select count(*) from private.production_seal_inspections where draft_id=d.id),'placements',coalesce(items,'[]'::jsonb),
    'locations',coalesce(locations,'[{"code":"PROVISIONAL_POSITION_1","approved":false},{"code":"PROVISIONAL_POSITION_2","approved":false},{"code":"PROVISIONAL_POSITION_3","approved":false},{"code":"PROVISIONAL_POSITION_4","approved":false}]'::jsonb)
      ||jsonb_build_array(jsonb_build_object('code','OTHER','approved',true,'requiresActualComment',true)),
    'physicalVerified',private.production_seals_current(d.id),'frozen',exists(select 1 from private.enrollment_submissions where draft_id=d.id));
end;$$;

create function private.production_seal_inspect(p_draft uuid,p_key uuid,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts;h private.draft_seal_packages;actor uuid;e private.production_seal_inspections;n private.draft_seal_location_notes;
  accepted boolean;count_events integer;item jsonb;placement private.draft_seal_placements;eid uuid:=gen_random_uuid();
begin
  actor:=private.registration_reviewer_id();
  if actor is null or not private.access_session_valid(true) then raise exception using errcode='AG403';end if;
  select * into d from app.enrollment_drafts where id=p_draft and enrollment_mode='PRODUCTION' and created_by<>actor for update;
  if not found then raise exception using errcode='AG404';end if;
  if p_key is null or jsonb_typeof(p_input) is distinct from 'object' or p_input->>'action' not in ('APPROVE','REJECT') then raise exception using errcode='AG400';end if;
  perform pg_advisory_xact_lock(hashtextextended(d.tenant_id::text||actor::text||p_key::text,0));
  select * into e from private.production_seal_inspections where inspector_id=actor and request_key=p_key;
  if found then
    if e.draft_id<>p_draft or e.payload<>p_input then raise exception using errcode='AG409';end if;
    return private.production_seal_read(d.id);
  end if;
  if exists(select 1 from private.enrollment_submissions where draft_id=d.id) then raise exception using errcode='AG409';end if;
  select * into h from private.draft_seal_packages where draft_id=d.id;
  select count(*) into count_events from private.production_seal_inspections where draft_id=d.id;
  if d.revision<>(p_input->>'expectedDraftRevision')::integer or d.enrollment_snapshot_revision<>(p_input->>'expectedSnapshotRevision')::integer
    or count_events<>(p_input->>'expectedInspectionRevision')::integer or h.saved_draft_revision is distinct from d.revision then raise exception using errcode='AG409';end if;
  accepted:=p_input->>'action'='APPROVE';
  if accepted then
    if h.package='NONE' then
      if jsonb_array_length(p_input->'placements')<>0 or exists(select 1 from private.draft_seal_placements where draft_id=d.id and released_at is null) then raise exception using errcode='AG400';end if;
    else
      select * into n from private.draft_seal_location_notes where draft_id=d.id and draft_revision=d.revision and fitting_revision=h.revision;
      if n.draft_id is null or jsonb_array_length(p_input->'placements')<>4 or (select count(distinct x->>'position') from jsonb_array_elements(p_input->'placements') x)<>4
        or (select count(distinct lower(btrim(x->>'comment'))) from jsonb_array_elements(p_input->'placements') x)<>4 then raise exception using errcode='AG400';end if;
      -- Serialize inspection with fitting, stock revocation, and finalization.
      perform s.id from private.development_seal_stock s join private.draft_seal_placements p on p.seal_id=s.id where p.draft_id=d.id and p.released_at is null order by s.id for share of s;
      if (select count(*) from private.draft_seal_placements where draft_id=d.id and released_at is null)<>4
        or exists(select 1 from private.draft_seal_placements p left join private.development_seal_stock s on s.id=p.seal_id left join private.production_seal_identifiers i on i.seal_id=s.id
          where p.draft_id=d.id and p.released_at is null and (s.origin is distinct from 'PRODUCTION' or s.status is distinct from 'IN_STOCK' or i.seal_id is null)) then raise exception using errcode='AG409';end if;
      if (select count(distinct a.sha256) from private.draft_seal_placements p join private.enrollment_attachments a on a.id=p.photo_id
        where p.draft_id=d.id and p.released_at is null and a.draft_id=d.id and a.owner_generation=d.owner_generation and a.owner_profile_id=d.owner_profile_id
          and a.kind='SEAL_FITTING_PHOTO' and a.status='STAGED' and a.mime_type in ('image/jpeg','image/png'))<>4 then raise exception using errcode='AG400';end if;
      if (select count(*) from private.draft_seal_placements p join private.development_seal_stock s on s.id=p.seal_id where p.draft_id=d.id and p.released_at is null and s.type='ALARM')
        <>(case h.package when 'STANDARD' then 0 when 'ONE_ALARM' then 1 when 'FOUR_ALARMS' then 4 else -1 end) then raise exception using errcode='AG400';end if;
      for item in select value from jsonb_array_elements(p_input->'placements') loop
        select * into placement from private.draft_seal_placements where draft_id=d.id and released_at is null and position=(item->>'position')::integer;
        if placement.id is null or item->>'idMatches'<>'true' or item->>'undamaged'<>'true' or item->>'vehicleMatches'<>'true' or item->>'safeSurface'<>'true'
          or char_length(btrim(item->>'comment')) not between 3 and 200
          or not exists(select 1 from jsonb_array_elements(n.locations) x where x->>'position'=item->>'position' and x->>'description'=item->>'comment')
          or (item->>'location'<>'OTHER' and not exists(select 1 from private.production_seal_locations where category=d.category and code=item->>'location' and approved))
          or not exists(select 1 from private.development_seal_stock s join private.production_seal_identifiers i on i.seal_id=s.id where s.id=placement.seal_id and s.code=item->>'scanCode' and i.key_version=item->>'scanVersion')
          or not exists(select 1 from private.registration_review_events r where r.attachment_id=placement.photo_id and r.reviewer_id=actor
            and r.snapshot_revision=d.enrollment_snapshot_revision and r.draft_revision=d.revision and r.action='ACCEPTED'
            and r.sequence=(select max(sequence) from private.registration_review_events where attachment_id=placement.photo_id and action<>'READ_REQUESTED')) then raise exception using errcode='AG400';end if;
      end loop;
    end if;
  end if;
  insert into private.production_seal_inspections(id,tenant_id,draft_id,inspector_id,request_key,payload,draft_revision,snapshot_revision,fitting_revision,accepted)
    values(eid,d.tenant_id,d.id,actor,p_key,p_input,d.revision,d.enrollment_snapshot_revision,h.revision,accepted);
  insert into private.enrollment_prerequisite_receipts(tenant_id,draft_id,draft_revision,owner_generation,fitting_revision,snapshot_revision,code,accepted,trusted_reference,expires_at)
    values(d.tenant_id,d.id,d.revision,d.owner_generation,h.revision,d.enrollment_snapshot_revision,'SEALS',accepted,'PHYSICAL_INSPECTION:'||eid,now()+interval '1 hour');
  return private.production_seal_read(d.id);
end;$$;

-- Existing fitting/photo/revision machinery is shared, not replaced by a mock.
-- Production stock cannot enter development drafts, or vice versa.
do $$declare signature text;definition text;begin
  foreach signature in array array['private.save_draft_seal_fitting_samples(uuid,uuid,integer,integer,text,jsonb)','private.draft_seal_validation(uuid,text,jsonb,boolean)'] loop
    definition:=pg_get_functiondef(signature::regprocedure);
    definition:=replace(definition,'^DEV-SEAL-[A-Z0-9-]{1,40}$','^(DEV-SEAL-[A-Z0-9-]{1,40}|AG[A-F0-9]{32})$');
    if signature like '%save_draft%' then
      definition:=replace(definition,'if not exists (select 1 from private.development_enrollment_owners',
        'if d.enrollment_mode=''PRODUCTION'' and not private.production_owner_eligible(d.organization_id,d.owner_profile_id) then raise exception using errcode=''AG422'',message=''OWNER_PROFILE_UNAVAILABLE'';end if; if d.enrollment_mode=''DEVELOPMENT'' and not exists (select 1 from private.development_enrollment_owners');
    end if;
    execute definition;
  end loop;
end;$$;
create function private.seal_placement_origin_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare d app.enrollment_drafts;s private.development_seal_stock;
begin
  if new.released_at is not null then return new;end if;
  select * into d from app.enrollment_drafts where id=new.draft_id;
  select * into s from private.development_seal_stock where id=new.seal_id;
  if d.enrollment_mode is distinct from s.origin or s.status is distinct from 'IN_STOCK' then raise exception using errcode='AG409',message='SEAL_UNAVAILABLE';end if;
  if s.origin='PRODUCTION' and exists(select 1 from private.draft_seal_placements where seal_id=s.id and draft_id<>d.id) then raise exception using errcode='AG409',message='SEAL_UNAVAILABLE';end if;
  return new;
end;$$;
create trigger seal_origin_guard before insert or update on private.draft_seal_placements for each row execute function private.seal_placement_origin_guard();

-- A once-valid inspection cannot outlive revocation, a new rejection or an edit.
alter function private.enrollment_submission_status(uuid) rename to enrollment_submission_access_status;
revoke execute on function private.enrollment_submission_access_status(uuid) from autoguardian_enrollment_api;
create function private.enrollment_submission_status(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare state jsonb;checks jsonb;seal_ok boolean;
begin
  state:=private.enrollment_submission_access_status(p_draft);if state->>'mode'<>'PRODUCTION' then return state;end if;
  seal_ok:=private.production_seals_current(p_draft);
  select jsonb_agg(case when c->>'code'='SEALS' and not seal_ok then jsonb_set(c,'{status}','"REJECTED"'::jsonb) else c end) into checks from jsonb_array_elements(state->'checks') c;
  return state||jsonb_build_object('checks',checks,'canSubmit',(state->>'canSubmit')::boolean and seal_ok,'canFinalize',(state->>'canFinalize')::boolean and seal_ok);
end;$$;
alter function private.registration_review_read(uuid) rename to registration_review_evidence_read;
revoke execute on function private.registration_review_evidence_read(uuid) from autoguardian_enrollment_api;
create function private.registration_review_read(p_draft uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare state jsonb;seal_ok boolean;
begin
  state:=private.registration_review_evidence_read(p_draft);if state->>'mode'<>'PRODUCTION' then return state;end if;
  seal_ok:=private.production_seals_current(p_draft);
  return state||jsonb_build_object('sealsConfirmed',(state->>'sealsConfirmed')::boolean and seal_ok,
    'canApprove',(state->>'canApprove')::boolean and seal_ok,'productionApproved',(state->>'productionApproved')::boolean and seal_ok);
end;$$;

-- Finalization consumes actual stock atomically in the existing transaction.
grant update(status) on private.development_seal_stock to autoguardian_enrollment_executor;
create policy production_stock_activation on private.development_seal_stock for update to autoguardian_enrollment_executor
  using(tenant_id=private.request_tenant_id() and origin='PRODUCTION' and assigned_agent_id=private.enrollment_agent_id(organization_id) and private.access_session_valid(true))
  with check(tenant_id=private.request_tenant_id() and origin='PRODUCTION' and status='ACTIVE' and assigned_agent_id=private.enrollment_agent_id(organization_id) and private.access_session_valid(true));
create function private.production_seal_activate() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='ACTIVE' and old.status<>'ACTIVE' then
    perform s.id from private.development_seal_stock s join private.draft_seal_placements p on p.seal_id=s.id where p.draft_id=new.draft_id and p.released_at is null order by s.id for update of s;
    if not private.production_seals_current(new.draft_id) then raise exception using errcode='AG409',message='SEAL_CHANGED';end if;
    update private.development_seal_stock set status='ACTIVE' where origin='PRODUCTION' and id in(select seal_id from private.draft_seal_placements where draft_id=new.draft_id and released_at is null);
  end if;return new;
end;$$;
create trigger production_seal_activation before update on private.enrollment_submissions for each row execute function private.production_seal_activate();
create function private.seal_terminal_guard() returns trigger language plpgsql set search_path='' as $$
begin
  if old.origin='PRODUCTION' and (new.origin<>old.origin or new.code<>old.code or new.type<>old.type or new.batch_code<>old.batch_code or new.organization_id<>old.organization_id or new.assigned_agent_id<>old.assigned_agent_id
    or (old.status in ('REVOKED','DESTROYED') and (new.status<>old.status or new.revocation_reason is distinct from old.revocation_reason))
    or (old.status='ACTIVE' and new.status not in ('ACTIVE','REVOKED'))) then raise exception using errcode='AG409',message='SEAL_IMMUTABLE';end if;
  return new;
end;$$;
create trigger production_seal_terminal before update on private.development_seal_stock for each row execute function private.seal_terminal_guard();

grant create on schema private to autoguardian_seal_executor,autoguardian_enrollment_executor,autoguardian_review_executor;
alter function private.production_seal_issue(uuid,jsonb,jsonb) owner to autoguardian_seal_executor;
alter function private.production_seal_verify(text,text) owner to autoguardian_seal_executor;
alter function private.production_seal_read(uuid) owner to autoguardian_seal_executor;
alter function private.production_seal_inspect(uuid,uuid,jsonb) owner to autoguardian_seal_executor;
alter function private.production_seals_current(uuid) owner to autoguardian_seal_executor;
alter function private.production_seal_revoke(uuid,text,text) owner to autoguardian_seal_executor;
alter function private.seal_placement_origin_guard() owner to autoguardian_enrollment_executor;
alter function private.enrollment_submission_status(uuid) owner to autoguardian_enrollment_executor;
alter function private.production_seal_activate() owner to autoguardian_enrollment_executor;
alter function private.registration_review_read(uuid) owner to autoguardian_review_executor;
revoke create on schema private from autoguardian_seal_executor,autoguardian_enrollment_executor,autoguardian_review_executor;
revoke all on function private.production_seal_issue(uuid,jsonb,jsonb),private.production_seal_verify(text,text),private.production_seal_read(uuid),private.production_seal_inspect(uuid,uuid,jsonb),private.production_seals_current(uuid),private.seal_placement_origin_guard(),private.production_seal_activate(),private.seal_terminal_guard(),private.enrollment_submission_status(uuid) from public,anon,authenticated,service_role;
grant execute on function private.production_seal_issue(uuid,jsonb,jsonb),private.production_seal_verify(text,text),private.production_seal_read(uuid),private.production_seal_inspect(uuid,uuid,jsonb),private.enrollment_submission_status(uuid) to autoguardian_enrollment_api;
revoke all on function private.production_seal_revoke(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function private.production_seal_revoke(uuid,text,text) to autoguardian_enrollment_api;
grant execute on function private.production_seals_current(uuid) to autoguardian_enrollment_executor,autoguardian_review_executor;
revoke all on function private.registration_review_read(uuid) from public,anon,authenticated,service_role;
grant execute on function private.registration_review_read(uuid) to autoguardian_enrollment_api;
create trigger production_batch_immutable before update or delete on private.production_seal_batches for each row execute function private.immutable_registration_consent();
create trigger production_identifier_immutable before update or delete on private.production_seal_identifiers for each row execute function private.immutable_registration_consent();
create trigger production_inspection_immutable before update or delete on private.production_seal_inspections for each row execute function private.immutable_registration_consent();
create trigger production_revocation_immutable before update or delete on private.production_seal_revocations for each row execute function private.immutable_registration_consent();
create trigger production_seal_read_immutable before update or delete on private.production_seal_read_events for each row execute function private.immutable_registration_consent();
commit;
