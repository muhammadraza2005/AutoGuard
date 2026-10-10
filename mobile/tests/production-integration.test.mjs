import test from 'node:test';import assert from 'node:assert/strict';
import {sealInspectionBody,sealInspectionState,verifySealQr} from '../src/features/enrollment/productionSeals.ts';
import {ownerSnapshotSchema} from '../src/features/enrollment/owner.ts';
import {savedWizardSteps} from '../src/features/enrollment/wizard.ts';
import {availableSealChoices} from '../src/features/enrollment/sealChoices.ts';
import {registrationIntegrationEn,registrationIntegrationFr} from '../src/i18n/registrationIntegrationResources.ts';
const id='00000000-0000-4000-8000-000000000001';
test('production consent cannot reuse sample documents or claims; saved owner preparation does not pretend consent',()=>{
 const v={mode:'PRODUCTION',sampleOnly:false,draftId:id,draftRevision:1,ownerProfileId:id,ownerGeneration:1,
  details:null,savedAt:null,documents:[],consent:null,phoneVerified:false,productionConsentVerified:false};
 assert.equal(ownerSnapshotSchema.parse(v).mode,'PRODUCTION');assert.throws(()=>ownerSnapshotSchema.parse({...v,sampleOnly:true}));
 assert.throws(()=>ownerSnapshotSchema.parse({...v,documents:[{version:'fake',language:'en',termsText:'fake',dataText:'fake'}]}));
 assert.equal(savedWizardSteps([{code:'OWNER_DETAILS_SAMPLE',status:'COMPLETE'}],'PRODUCTION').owner,true);
 assert.equal(savedWizardSteps([{code:'OWNER_DETAILS_SAMPLE',status:'COMPLETE'}]).owner,false);
});
test('physical approval requires four QR scans and individual checks; client cannot supply trusted scan results',()=>{
 const body={expectedDraftRevision:1,expectedSnapshotRevision:2,expectedInspectionRevision:0,action:'APPROVE',
  placements:[1,2,3,4].map(position=>({position,location:'OTHER',comment:'Actual location '+position,qrUrl:'https://seals.synthetic.invalid/s/AG'+String(position).repeat(32),
   idMatches:true,undamaged:true,vehicleMatches:true,safeSurface:true}))};
 assert.equal(sealInspectionBody.parse(body).placements.length,4);
 for(const patch of [{placements:body.placements.slice(1)},{placements:body.placements.map(p=>({...p,undamaged:false}))},
  {placements:body.placements.map(p=>({...p,scanCode:'FAKE'}))},{physicalVerified:true}])assert.throws(()=>sealInspectionBody.parse({...body,...patch}));
 assert.throws(()=>sealInspectionState.parse({draftId:id,draftRevision:1,snapshotRevision:1,inspectionRevision:0,package:'NONE',
  placements:[{position:1,code:'AG'+'1'.repeat(32),status:'IN_STOCK',type:'STANDARD',photoId:null,description:null}],locations:[],physicalVerified:false,frozen:false}));
});
test('QR input goes to authenticated signature verification and revoked/active stock is never selectable',async()=>{
 const code='AG'+'A'.repeat(32),qrUrl='https://seals.synthetic.invalid/s/'+code;
 assert.equal(await verifySealQr(async(path,options)=>{assert.equal(path,'/v1/registration-seals/verify');assert.deepEqual(options.body,{qrUrl});
  return {code,status:'IN_STOCK',signatureVerified:true,available:true,revocationReason:null};},qrUrl),code);
 for(const status of ['ACTIVE','REVOKED'])await assert.rejects(verifySealQr(async()=>({code,status,signatureVerified:true,available:false,revocationReason:null}),qrUrl));
 assert.deepEqual(availableSealChoices('STANDARD',1,[],[{code,type:'STANDARD',status:'ACTIVE',available:false}],[]),[]);
 assert.deepEqual(Object.keys(registrationIntegrationEn).sort(),Object.keys(registrationIntegrationFr).sort());
 assert.deepEqual(Object.keys(registrationIntegrationEn.preparationChecks).sort(),Object.keys(registrationIntegrationFr.preparationChecks).sort());
});
