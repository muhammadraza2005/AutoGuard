-- SQL Editor, postgres. Run once after reviewing the target project.
-- Stores encrypted ciphertext only. Never makes a public bucket or adds client policies.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('registration-enrollment-evidence','registration-enrollment-evidence',false,2097216,array['application/octet-stream'])
on conflict(id) do nothing;
do $$begin
  if not exists(select 1 from storage.buckets where id='registration-enrollment-evidence' and name=id
    and not public and file_size_limit=2097216 and allowed_mime_types=array['application/octet-stream']) then
    raise exception 'Existing production evidence bucket has unexpected settings. No settings were overwritten.';
  end if;
  -- A policy on storage.objects can grant access to every bucket. Reject such
  -- configurations until their scope is reviewed; the server uses its secret key.
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and (roles && array['public','anon','authenticated']::name[])) then
    raise exception 'Review existing Storage object policies before enabling production evidence. No client policy is required.';
  end if;
end;$$;
commit;
