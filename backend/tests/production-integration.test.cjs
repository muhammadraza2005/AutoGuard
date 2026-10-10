const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {fixture,id}=require('./helpers/production-seal-fixture.cjs');
const {OwnerService,PostgresOwnerStore,ownerCipher,configuredOwner}=require('../dist/owner');
const {EvidenceService,PostgresEvidenceStore,evidenceCipher,configuredEvidence}=require('../dist/evidence');
const {PostgresReadinessStore}=require('../dist/readiness');
const {PostgresSealStore,sealFittingInput}=require('../dist/seals');
const {configuredProductionSeals}=require('../dist/productionSeals');
const details={type:'INDIVIDUAL',name:'Synthetic Owner 001',companyRegistration:null,representativeName:null,
  idDocumentType:'SYNTHETIC',idDocumentNumber:'TEST ID 0001',phone:'+243000000001',preferredLanguage:'en'};
test('production owner and encrypted uploads use actual eligibility, preserve audited read-back and block agent consent and provider-free activation',async()=>{
 const f=await fixture();try{
  assert.equal(f.draft.mode,'PRODUCTION');assert.equal((await f.as(1,()=>f.drafts.detail(id(1),f.draft.id))).draft.mode,'PRODUCTION');
  const owner=new OwnerService(new PostgresOwnerStore(f.pool,id(10)),ownerCipher(Buffer.alloc(32,11)),'PRODUCTION');
  const initial=await f.as(1,()=>owner.read(id(1),f.draft.id));assert.equal(initial.sampleOnly,false);assert.deepEqual(initial.documents,[]);
  const saved=await f.as(1,()=>owner.save(id(1),f.draft.id,id(500),{expectedDraftRevision:initial.draftRevision,details}));
  assert.deepEqual(saved.details,details);assert.equal(saved.productionConsentVerified,false);
  await assert.rejects(f.as(1,()=>owner.consent(id(1),f.draft.id,id(501),{expectedDraftRevision:saved.draftRevision,
   ownerGeneration:saved.ownerGeneration,version:'fake',language:'en',accept:true,termsAccepted:true,dataAccepted:true})),e=>e.getStatus()===403);
  await assert.rejects(f.as(1,()=>owner.save(id(1),f.draft.id,id(502),{expectedDraftRevision:saved.draftRevision,
   details:{...details,type:'COMPANY',companyRegistration:'Typed registration',representativeName:'Typed representative'}})),e=>e.getStatus()===422);
  const objects=new Map(),storage={check:async()=>{},put:async(p,b)=>{if(!objects.has(p))objects.set(p,b);},get:async p=>objects.get(p)};
  const evidence=new EvidenceService(new PostgresEvidenceStore(f.pool,id(10)),storage,evidenceCipher(Buffer.alloc(32,12)),'PRODUCTION');
  const manifest=JSON.parse(await fs.readFile(path.resolve(__dirname,'../../Milestone-1-Test-Uploads/manifest.json'),'utf8'));
  for(const [n,file] of manifest.files.filter(v=>!['SEAL_FITTING_PHOTO','PURCHASE_PROOF'].includes(v.kind)).entries()){
   const bytes=await fs.readFile(path.resolve(__dirname,'../../Milestone-1-Test-Uploads',file.file));
   const result=await f.as(1,()=>evidence.upload(id(1),f.draft.id,id(510+n),{kind:file.kind,dataBase64:bytes.toString('base64'),
    uploadContext:{draftRevision:saved.draftRevision,ownerGeneration:saved.ownerGeneration}}));assert.equal(result.attachment.status,'STAGED');
   const reopened=await f.as(1,()=>evidence.read(id(1),f.draft.id,id(510+n),{reason:'ENROLLMENT_REVIEW'}));
   assert.equal(reopened.mimeType,file.kind==='REGISTRATION_DOCUMENT'?'application/pdf':'image/jpeg');
   assert.equal([...objects.values()].at(-1).subarray(0,4).toString(),'AG01');
  }
  const uploads=await f.as(1,()=>evidence.list(id(1),f.draft.id));assert.equal(uploads.sampleOnly,false);assert.equal(uploads.evidenceChecklist.complete,true);
  const seals=new PostgresSealStore(f.pool,id(10),true);
  await f.as(1,()=>seals.save(id(1),f.draft.id,id(530),sealFittingInput({expectedDraftRevision:saved.draftRevision,
   expectedFittingRevision:0,package:'NONE',placements:[]})));
  const readiness=await f.as(1,()=>new PostgresReadinessStore(f.pool,id(10)).read(id(1),f.draft.id));
  assert.equal(readiness.mode,'PRODUCTION');assert.equal(readiness.sampleOnly,false);assert.equal(readiness.canSubmit,false);
  for(const code of ['OWNER_SELECTION','OWNER_DETAILS_SAMPLE','IDENTITY_SAMPLE','REGISTRATION_SAMPLE','VEHICLE_PHOTO_SAMPLE','SEAL_FITTING'])
   assert.equal(readiness.checks.find(v=>v.code===code).status,'COMPLETE',code);
  for(const code of ['CONSENT','OWNER_PHONE','PAYMENT'])assert.notEqual(readiness.checks.find(v=>v.code===code).status,'COMPLETE',code);
  const verify=(await f.db.query(await fs.readFile(path.resolve(__dirname,'../../supabase/verify-production-registration-integration.sql'),'utf8'))).rows[0];
  assert.equal(Object.values(verify).every(v=>v===true),true);
  // Exercise the hosted Storage setup contract without contacting a hosted project.
  await f.db.exec('create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid);alter table storage.objects enable row level security;');
  const setup=await fs.readFile(path.resolve(__dirname,'../../supabase/setup-production-evidence-storage.sql'),'utf8');
  await f.db.exec(setup);await f.db.exec(setup);
  assert.equal((await f.db.query("select count(*)::int as n from storage.buckets where not public and file_size_limit=2097216")).rows[0].n,1);
  await f.db.exec("create policy broad_client_read on storage.objects for select to authenticated using(true);");
  await assert.rejects(f.db.exec(setup),/Review existing Storage object policies/);await f.db.exec('rollback');
  // Losing current authority-backed eligibility immediately blocks new private writes.
  await f.db.exec(`update private.production_enrollment_owners set active=false where user_id='${id(22)}';`);
  await assert.rejects(f.as(1,()=>owner.read(id(1),f.draft.id)),e=>e.getStatus()===422);
 }finally{await f.db.close();}
});
test('production setup requires independent keys and refuses reserved test signing origins in production',()=>{
 const env={SUPABASE_URL:'https://synthetic.supabase.co',SUPABASE_STORAGE_SECRET_KEY:'sb_secret_synthetic',
  ENROLLMENT_EVIDENCE_KEY_HEX:'aa'.repeat(32),PRODUCTION_OWNER_KEY_HEX:'bb'.repeat(32),PRODUCTION_EVIDENCE_KEY_HEX:'cc'.repeat(32)};
 assert.doesNotThrow(()=>configuredOwner(env,{},false));assert.doesNotThrow(()=>configuredEvidence(env,{},false));
 assert.throws(()=>configuredOwner({...env,PRODUCTION_OWNER_KEY_HEX:env.PRODUCTION_EVIDENCE_KEY_HEX},{},false));
 assert.throws(()=>configuredEvidence({...env,PRODUCTION_EVIDENCE_KEY_HEX:env.ENROLLMENT_EVIDENCE_KEY_HEX},{},false));
 assert.throws(()=>configuredEvidence({...env,PRODUCTION_EVIDENCE_BUCKET:'development-enrollment-evidence'},{},false));
 assert.throws(()=>configuredProductionSeals({NODE_ENV:'production',AUTOGUARDIAN_SEAL_ORIGIN:'https://seals.autoguardian.invalid',
  AUTOGUARDIAN_SEAL_ACTIVE_KEY:'test-v1',AUTOGUARDIAN_SEAL_KEYS_JSON:JSON.stringify({'test-v1':'dd'.repeat(32)})},{},id(10)));
});
