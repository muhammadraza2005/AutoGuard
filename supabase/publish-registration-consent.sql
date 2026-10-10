-- After 018. Fill every value below with the reviewed, approved facts/text.
-- SQL Editor > Role postgres > New query > paste this whole file > Run once.
-- This publishes consent, but never enables production enrollment or grants roles.
begin;
set local role autoguardian_consent_publisher;
do $publish$
declare
  tenant_input text:='REPLACE_WITH_TENANT_UUID';
  version_input text:='REPLACE_WITH_NEW_VERSION';
  operator_input text:='REPLACE_WITH_OPERATING_ORGANIZATION';
  authority_input text:='REPLACE_WITH_REGISTRATION_AUTHORITY';
  contact_input text:='REPLACE_WITH_PRIVACY_CONTACT';
  retention_input text:='REPLACE_WITH_APPROVED_RETENTION_NOTICE';
  approved_by_input text:='REPLACE_WITH_APPROVER_NAME_OR_REFERENCE';
  english_input text:=$english$REPLACE_WITH_APPROVED_ENGLISH_AGREEMENT$english$;
  french_input text:=$french$REPLACE_WITH_APPROVED_FRENCH_AGREEMENT$french$;
  wording_approved boolean:=false; -- Set true only after the final text is approved.
  tenant_uuid uuid; document_uuid uuid;
begin
  if not wording_approved or (tenant_input||version_input||operator_input||authority_input||contact_input||retention_input||approved_by_input||english_input||french_input) ~* 'REPLACE_WITH|PLACEHOLDER|TODO' then
    raise exception 'Fill every field and approve the final agreement before publishing. No configuration was changed.';
  end if;
  tenant_uuid:=tenant_input::uuid;
  perform set_config('autoguardian.tenant_id',tenant_uuid::text,true);
  if not exists(select 1 from app.tenants where id=tenant_uuid) then raise exception 'The selected tenant is unavailable.'; end if;
  insert into private.registration_consent_documents(tenant_id,version,operator_name,authority_name,privacy_contact,retention_notice,
    text_en,text_fr,text_hash_en,text_hash_fr,approved_by,approved_at)
  values(tenant_uuid,version_input,operator_input,authority_input,contact_input,retention_input,english_input,french_input,
    encode(sha256(convert_to(english_input,'UTF8')),'hex'),encode(sha256(convert_to(french_input,'UTF8')),'hex'),approved_by_input,now()) returning id into document_uuid;
  insert into private.registration_access_configuration(tenant_id,consent_document_id) values(tenant_uuid,document_uuid)
    on conflict(tenant_id) do update set consent_document_id=excluded.consent_document_id,updated_at=now();
end;
$publish$;
commit;
