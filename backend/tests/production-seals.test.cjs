const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture,id}=require('./helpers/production-seal-fixture.cjs');
const {SealSigner,PostgresProductionSealStore,ProductionSealService,sealBatchInput,sealInspectionInput}=require('../dist/productionSeals');
const {PostgresSealStore,sealFittingInput,sealLocationInput}=require('../dist/seals');
const {PostgresSubmissionStore}=require('../dist/submission');
const {PostgresConsentStore,consentInput}=require('../dist/consent');
const {PostgresRegistrationReviewStore}=require('../dist/registrationReviews');
const {createApp}=require('../dist/app');
const {rememberVerifiedSession}=require('../dist/requestIdentity');
const {UnauthorizedException}=require('@nestjs/common');
const signer=()=>new SealSigner(id(10),'https://seals.synthetic.invalid','v1',{v1:'a1'.repeat(32)});
const batch={organizationId:id(30),agentId:id(21),manufacturer:'Synthetic manufacturer',batch:'SYNTHETIC-BATCH',type:'STANDARD',quantity:4,manufacturedOn:'2026-01-01',physicalBatchConfirmed:true};
async function fitting(f){
 const store=new PostgresProductionSealStore(f.pool,id(10)),service=new ProductionSealService(store,signer()),seals=new PostgresSealStore(f.pool,id(10));
 const issued=await f.as(3,()=>service.issue(id(3),id(100),batch));
 await f.db.query("select set_config('autoguardian.tenant_id',$1,false),set_config('autoguardian.auth_user_id',$2,false),set_config('autoguardian.session_id',$3,false),set_config('autoguardian.staff_until',$4,false)",[id(10),id(1),id(61),String(Date.now()/1000+300)]);
 for(let n=0;n<4;n++)await f.db.query(`insert into private.enrollment_attachments(id,tenant_id,draft_id,agent_user_id,organization_id,owner_profile_id,kind,mime_type,byte_size,sha256,object_path,status)
  values($1,$2,$3,$4,$5,$6,'SEAL_FITTING_PHOTO','image/jpeg',10,$7,$8,'STAGED')`,[id(200+n),id(10),f.draft.id,id(21),id(30),id(22),String(n).padStart(64,'a'),'synthetic-'+n]);
 const saved=await f.as(1,()=>seals.save(id(1),f.draft.id,id(101),sealFittingInput({package:'STANDARD',expectedDraftRevision:1,expectedFittingRevision:0,
   placements:issued.seals.map((s,n)=>({position:n+1,sealCode:s.code,photoId:id(200+n)}))})));
 const locations=Array.from({length:4},(_,n)=>({position:n+1,description:'Actual synthetic mounting location '+(n+1)}));
 await f.as(1,()=>seals.saveLocations(id(1),f.draft.id,id(102),sealLocationInput({expectedDraftRevision:1,expectedFittingRevision:saved.fittingRevision,expectedLocationRevision:0,locations})));
 let state=await f.as(3,()=>service.read(id(3),f.draft.id));
 // Isolated evidence-review fixtures; HTTP encrypted evidence remains covered by its own tests.
 for(let n=0;n<4;n++)await f.db.query(`insert into private.registration_review_events(tenant_id,draft_id,reviewer_id,request_key,draft_revision,snapshot_revision,expected_review_revision,action,attachment_id)
   values($1,$2,$3,$4,1,$5,$6,'ACCEPTED',$7)`,[id(10),f.draft.id,id(23),id(250+n),state.snapshotRevision,n,id(200+n)]);
 const input={expectedDraftRevision:1,expectedSnapshotRevision:state.snapshotRevision,expectedInspectionRevision:0,action:'APPROVE',
  placements:issued.seals.map((s,n)=>({position:n+1,location:'OTHER',comment:locations[n].description,qrUrl:s.qrUrl,idMatches:true,undamaged:true,vehicleMatches:true,safeSurface:true}))};
 return {service,seals,issued,state,input};
}
test('HMAC QR rejects altered signatures, tenants, origins, repeated fields and unknown keys; rotation keeps old keys',()=>{
 const s=signer(),issued=s.issue();assert.equal(s.verify(issued.qrUrl).code,issued.code);assert.match(issued.code,/^AG[A-F0-9]{32}$/);
 for(const value of [issued.qrUrl.replace('https:','http:'),issued.qrUrl.replace('seals.synthetic.invalid','evil.invalid'),issued.qrUrl+'&v=v1',issued.qrUrl+'#x',issued.qrUrl.replace('sig=','sig=x'),issued.qrUrl.replace('v=v1','v=missing')])assert.throws(()=>s.verify(value));
 assert.throws(()=>new SealSigner(id(11),'https://seals.synthetic.invalid','v1',{v1:'a1'.repeat(32)}).verify(issued.qrUrl));
 const rotated=new SealSigner(id(10),'https://seals.synthetic.invalid','v2',{v1:'a1'.repeat(32),v2:'b2'.repeat(32)});assert.equal(rotated.verify(issued.qrUrl).code,issued.code);
 assert.throws(()=>sealBatchInput({...batch,physicalBatchConfirmed:false}));assert.throws(()=>sealBatchInput({...batch,manufacturer:'PLACEHOLDER'}));
 assert.throws(()=>sealInspectionInput({expectedDraftRevision:1,expectedSnapshotRevision:1,expectedInspectionRevision:0,action:'APPROVE',placements:[],physicalVerified:true}));
});
test('production seals cannot be reused across drafts even after release; development stock cannot pass a production save',async()=>{
 const f=await fixture();try{
  const {seals,issued}=await fitting(f);
  await f.as(1,()=>seals.save(id(1),f.draft.id,id(400),sealFittingInput({package:'NONE',placements:[],expectedDraftRevision:1,expectedFittingRevision:1})));
  const second=(await f.as(1,()=>f.drafts.save(id(1),{...f.input,vehicle:{...f.input.vehicle,chassisIdentifier:'SECOND-SYNTHETIC'}},undefined,id(401)))).draft;
  await assert.rejects(()=>f.as(1,()=>seals.save(id(1),second.id,id(402),sealFittingInput({package:'STANDARD',expectedDraftRevision:1,expectedFittingRevision:0,
    placements:issued.seals.map((s,n)=>({position:n+1,sealCode:s.code,photoId:null}))}))),e=>e.getStatus()===409);
  assert.equal((await f.as(1,()=>seals.fitting(id(1),second.id))).fittingRevision,0);
  await f.db.query(`insert into private.development_seal_stock(id,tenant_id,organization_id,assigned_agent_id,code,batch_code,type) values($1,$2,$3,$4,'DEV-SEAL-FAKE','DEV-BATCH-TEST','STANDARD')`,[id(500),id(10),id(30),id(21)]);
  await assert.rejects(()=>f.as(1,()=>seals.save(id(1),second.id,id(403),sealFittingInput({package:'STANDARD',expectedDraftRevision:1,expectedFittingRevision:0,placements:[{position:1,sealCode:'DEV-SEAL-FAKE',photoId:null}]}))),e=>e.getStatus()===409);
 }finally{await f.db.close();}
});
test('sealed registration finalization consumes issued stock atomically, preserves retries and rejects subsequent reuse',async()=>{
 const f=await fixture();try{
  await f.db.query("select set_config('autoguardian.tenant_id',$1,false),set_config('autoguardian.auth_user_id',$2,false),set_config('autoguardian.session_id',$3,false),set_config('autoguardian.staff_until',$4,false)",[id(10),id(1),id(61),String(Date.now()/1000+300)]);
  for(const [n,kind] of ['OWNER_ID','REGISTRATION_DOCUMENT','VEHICLE_FRONT','VEHICLE_REAR','VEHICLE_LEFT','VEHICLE_RIGHT','CHASSIS_PHOTO','PLATE_PHOTO'].entries())await f.db.query(`insert into private.enrollment_attachments(id,tenant_id,draft_id,agent_user_id,organization_id,owner_profile_id,kind,mime_type,byte_size,sha256,object_path,status)
    values($1,$2,$3,$4,$5,$6,$7,'image/jpeg',10,$8,$9,'STAGED')`,[id(600+n),id(10),f.draft.id,id(21),id(30),id(22),kind,String(n).padStart(64,'b'),'synthetic-doc-'+n]);
  const {service,input}=await fitting(f),reviews=new PostgresRegistrationReviewStore(f.pool,id(10));
  async function decision(action,attachmentId,key){
   const state=await f.as(3,()=>reviews.read(id(3),f.draft.id));
   return f.as(3,()=>reviews.change(id(3),f.draft.id,id(key),{expectedDraftRevision:state.draftRevision,expectedSnapshotRevision:state.snapshotRevision,
    expectedReviewRevision:state.reviewRevision,action,attachmentId,replacementId:null,reason:null,inspected:action!=='READ_REQUESTED'}));
  }
  for(let n=0;n<8;n++){await decision('READ_REQUESTED',id(600+n),700+2*n);await decision('ACCEPTED',id(600+n),701+2*n);}
  await f.as(3,()=>service.inspect(id(3),f.draft.id,id(610),input));
  assert.equal((await decision('APPROVED',null,720)).productionApproved,true);
  await f.db.query(`insert into private.registration_consent_documents(id,tenant_id,version,operator_name,authority_name,privacy_contact,retention_notice,text_en,text_fr,text_hash_en,text_hash_fr,approved_by,approved_at)
    values($1,$2,'synthetic-seal-v1','Synthetic operator','Synthetic authority','privacy@synthetic.invalid',repeat('Synthetic retention notice. ',3),repeat('Synthetic English test agreement. ',8),repeat('Accord synthétique pour les tests. ',8),
    encode(sha256(convert_to(repeat('Synthetic English test agreement. ',8),'UTF8')),'hex'),encode(sha256(convert_to(repeat('Accord synthétique pour les tests. ',8),'UTF8')),'hex'),'Synthetic approver',now())`,[id(620),id(10)]);
  await f.db.query('update private.registration_access_configuration set consent_document_id=$1 where tenant_id=$2',[id(620),id(10)]);
  const consent=new PostgresConsentStore(f.pool,id(10)),owner=await f.as(2,()=>consent.read(id(2),f.draft.id));
  await f.as(2,()=>consent.change(id(2),f.draft.id,id(621),consentInput({action:'ACCEPT',documentId:owner.document.id,language:'en',expectedDraftRevision:1,expectedOwnerGeneration:owner.ownerGeneration,expectedConsentRevision:0})));
  // Only unrelated provider integrations use synthetic local receipts here.
  for(const code of ['OWNER_PHONE','PAYMENT'])await f.db.query(`insert into private.enrollment_prerequisite_receipts(tenant_id,draft_id,draft_revision,owner_generation,fitting_revision,snapshot_revision,code,accepted,trusted_reference,expires_at)
    select tenant_id,id,revision,owner_generation,1,enrollment_snapshot_revision,$2,true,'ISOLATED_PROVIDER_FIXTURE',now()+interval '1 hour' from app.enrollment_drafts where id=$1`,[f.draft.id,code]);
  const submission=new PostgresSubmissionStore(f.pool,id(10));let state=await f.as(1,()=>submission.read(id(1),f.draft.id));assert.equal(state.canSubmit,true);
  await f.as(1,()=>submission.execute(id(1),f.draft.id,id(630),state.draftRevision,'submit',state.snapshotRevision));
  const active=await f.as(1,()=>submission.execute(id(1),f.draft.id,id(631),state.draftRevision,'finalize',state.snapshotRevision));
  assert.ok((await f.db.query("select status from private.development_seal_stock where origin='PRODUCTION'")).rows.every(s=>s.status==='ACTIVE'));
  assert.deepEqual(await f.as(1,()=>submission.execute(id(1),f.draft.id,id(631),state.draftRevision,'finalize',state.snapshotRevision)),active);
  assert.equal((await f.db.query('select count(*)::integer n from app.vehicles')).rows[0].n,1);
  assert.equal((await f.as(3,()=>service.read(id(3),f.draft.id))).physicalVerified,true);
  const fs=require('node:fs/promises'),path=require('node:path');
  const verified=await f.db.exec(await fs.readFile(path.resolve(__dirname,'../../supabase/verify-production-seals.sql'),'utf8'));
  assert.ok(Object.values(verified[0].rows[0]).every(Boolean));
 }finally{await f.db.close();}
});
test('physical inspection requires four authentic assigned seals, distinct current photos, actual locations and an independent reviewer',async()=>{
 const f=await fixture();try{
  const {service,seals,issued,input}=await fitting(f);
  await assert.rejects(()=>f.as(1,()=>service.inspect(id(1),f.draft.id,id(300),input)),e=>[403,404].includes(e.getStatus()));
  for(const patch of [{undamaged:false},{safeSurface:false},{idMatches:false},{location:'PLACEHOLDER_FRONT'},{comment:'different surface'},{qrUrl:issued.seals[1].qrUrl}]){
   await assert.rejects(()=>f.as(3,()=>service.inspect(id(3),f.draft.id,id(301),{...input,placements:input.placements.map((p,n)=>n===0?{...p,...patch}:p)})),e=>e.getStatus()===400);
  }
  const approved=await f.as(3,()=>service.inspect(id(3),f.draft.id,id(302),input));assert.equal(approved.physicalVerified,true);assert.equal(approved.inspectionRevision,1);
  assert.deepEqual(await f.as(3,()=>service.inspect(id(3),f.draft.id,id(302),input)),approved);
  const receipt=(await f.db.query("select * from private.enrollment_prerequisite_receipts where code='SEALS'")).rows[0];assert.equal(receipt.accepted,true);assert.match(receipt.trusted_reference,/^PHYSICAL_INSPECTION:/);
  const reject={...input,expectedInspectionRevision:1,action:'REJECT',placements:[]};
  assert.equal((await f.as(3,()=>service.inspect(id(3),f.draft.id,id(303),reject))).physicalVerified,false);
  assert.equal((await f.as(3,()=>service.inspect(id(3),f.draft.id,id(302),input))).physicalVerified,false);
  await assert.rejects(()=>f.as(3,()=>service.inspect(id(3),f.draft.id,id(304),input)),e=>e.getStatus()===409);
  await f.as(3,()=>service.inspect(id(3),f.draft.id,id(305),{...input,expectedInspectionRevision:2}));
  await assert.rejects(()=>f.as(1,()=>service.revoke(id(1),id(306),{code:issued.seals[0].code,reason:'DAMAGED'})),e=>e.getStatus()===403);
  const revoked=await f.as(3,()=>service.revoke(id(3),id(306),{code:issued.seals[0].code,reason:'DAMAGED'}));assert.equal(revoked.status,'REVOKED');
  assert.deepEqual(await f.as(3,()=>service.revoke(id(3),id(306),{code:issued.seals[0].code,reason:'DAMAGED'})),revoked);
  const checked=await f.as(1,()=>service.verify(id(1),{qrUrl:issued.seals[0].qrUrl}));assert.equal(checked.status,'REVOKED');assert.equal(checked.revocationReason,'DAMAGED');
  assert.equal((await f.as(3,()=>service.read(id(3),f.draft.id))).physicalVerified,false);
  await assert.rejects(()=>f.db.query("update private.development_seal_stock set status='IN_STOCK' where code=$1",[issued.seals[0].code]),e=>e.code==='AG409');
  await assert.rejects(()=>f.db.exec('delete from private.production_seal_inspections'),e=>e.code==='AG403');
 }finally{await f.db.close();}
});
test('SRS NONE package needs an explicit current independent decision and never invents fitted seals',async()=>{
 const f=await fixture();try{
  const service=new ProductionSealService(new PostgresProductionSealStore(f.pool,id(10))),seals=new PostgresSealStore(f.pool,id(10));
  await f.as(1,()=>seals.save(id(1),f.draft.id,id(110),sealFittingInput({package:'NONE',placements:[],expectedDraftRevision:1,expectedFittingRevision:0})));
  let state=await f.as(3,()=>service.read(id(3),f.draft.id));assert.equal(state.physicalVerified,false);
  state=await f.as(3,()=>service.inspect(id(3),f.draft.id,id(111),{expectedDraftRevision:1,expectedSnapshotRevision:state.snapshotRevision,expectedInspectionRevision:0,action:'APPROVE',placements:[]}));
  assert.equal(state.physicalVerified,true);assert.deepEqual(state.placements,[]);
  await f.as(1,()=>f.drafts.save(id(1),{...f.input,vehicle:{...f.input.vehicle,color:'BLUE'},expectedRevision:1},f.draft.id));
  assert.equal((await f.as(3,()=>service.read(id(3),f.draft.id))).physicalVerified,false);
 }finally{await f.db.close();}
});
test('restricted issuance persists exact retries, rejects agents and expired MFA, and omits alarm classification from QR checks',async()=>{
 const f=await fixture();try{
  const store=new PostgresProductionSealStore(f.pool,id(10)),service=new ProductionSealService(store,signer());
  await assert.rejects(()=>f.as(1,()=>service.issue(id(1),id(100),batch)),e=>e.getStatus()===403);
  const issued=await f.as(3,()=>service.issue(id(3),id(100),batch));assert.equal(issued.seals.length,4);
  assert.deepEqual(await f.as(3,()=>service.issue(id(3),id(100),batch)),issued);
  await assert.rejects(()=>f.as(3,()=>service.issue(id(3),id(100),{...batch,quantity:3})),e=>e.getStatus()===409);
  const verified=await f.as(1,()=>service.verify(id(1),{qrUrl:issued.seals[0].qrUrl}));assert.equal(verified.signatureVerified,true);assert.equal(verified.type,undefined);
  for(const role of ['anon','authenticated','service_role','autoguardian_enrollment_api'])assert.equal((await f.db.query("select has_table_privilege($1,'private.production_seal_identifiers','SELECT,INSERT,UPDATE,DELETE') as allowed",[role])).rows[0].allowed,false);
  await assert.rejects(()=>f.db.exec("update private.production_seal_identifiers set key_version='forged'"),e=>e.code==='AG403');
  await f.db.exec(`delete from auth.sessions where id='${id(63)}'`);await assert.rejects(()=>f.as(3,()=>service.issue(id(3),id(101),batch)),e=>e.getStatus()===403);
 }finally{await f.db.close();}
});
test('HTTP seal routes require staff proof, reject forged fields and expose no-store scoped responses',async()=>{
 const f=await fixture();let app;try{
  const auth={verify:async header=>{
   if(!['Bearer agent','Bearer admin'].includes(header))throw new UnauthorizedException();
   const n=header==='Bearer agent'?1:3;rememberVerifiedSession({authUserId:id(n),sessionId:id(60+n),expiresAt:Date.now()/1000+300,staff:true});return id(n);
  }};
  const service=new ProductionSealService(new PostgresProductionSealStore(f.pool,id(10)),signer());
  app=await createApp(auth,{},undefined,undefined,{auth,store:f.drafts,productionSeals:service},{accountAuth:auth,staffAuth:auth,staffProofAuth:auth});
  await app.listen(0,'127.0.0.1');const base=await app.getUrl(),url=base+'/v1/registration-seals/batches';
  assert.equal((await fetch(url,{method:'POST'})).status,401);
  const headers={Authorization:'Bearer admin','Content-Type':'application/json','Idempotency-Key':id(800)};
  assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify({...batch,signatureVerified:true})})).status,400);
  assert.equal((await fetch(url+'?tenant=other',{method:'POST',headers,body:JSON.stringify(batch)})).status,400);
  assert.equal((await fetch(url,{method:'POST',headers:{...headers,Authorization:'Bearer agent'},body:JSON.stringify(batch)})).status,403);
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(batch)});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const issued=await response.json();
  const verified=await fetch(base+'/v1/registration-seals/verify',{method:'POST',headers:{...headers,Authorization:'Bearer agent'},body:JSON.stringify({qrUrl:issued.seals[0].qrUrl})});
  assert.equal(verified.status,200);assert.equal((await verified.json()).signatureVerified,true);
  await f.db.exec(`delete from auth.sessions where id='${id(63)}'`);
  assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify(batch)})).status,403);
 }finally{if(app)await app.close();await f.db.close();}
});
