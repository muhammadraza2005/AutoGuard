import {test} from 'node:test';import assert from 'node:assert/strict';
import {consentStateSchema,consentBodySchema,readConsent,changeConsent} from '../src/features/owner/registrationConsent.ts';
import {verifiedTotpFactors,verifyTotp} from '../src/features/auth/staffMfa.ts';
import {accessSecurityEn,accessSecurityFr,ownerConsentEn,ownerConsentFr} from '../src/i18n/accessConsentResources.ts';
import {preserveAuthView} from '../src/features/auth/authEvents.ts';
const id='00000000-0000-4000-8000-000000000001',documentId='00000000-0000-4000-8000-000000000002';
const state={draftId:id,draftRevision:1,ownerGeneration:1,consentRevision:0,status:'MISSING',active:false,document:null,
 vehicle:{chassisIdentifier:'SYNTHETIC',plate:null,category:'CAR',make:null,model:null,manufactureYear:null,color:null},
 lastDocumentId:null,lastLanguage:null,phoneVerified:false,history:[]};
test('consent contract rejects fake verification, unsupported claims and missing approved wording',async()=>{
 assert.ok(consentStateSchema.safeParse(state).success);
 for(const value of [{...state,phoneVerified:true},{...state,status:'ACCEPTED'},{...state,ownerProfileId:id}])assert.equal(consentStateSchema.safeParse(value).success,false);
 const body={action:'ACCEPT',documentId,language:'fr',expectedDraftRevision:1,expectedOwnerGeneration:1,expectedConsentRevision:0};
 assert.ok(consentBodySchema.safeParse(body).success);assert.equal(consentBodySchema.safeParse({...body,accepted:true}).success,false);
 await assert.rejects(()=>readConsent(async()=>({...state,draftId:documentId}),id));
});
test('uncertain consent results retry identical owner choices and cannot silently change version or language',async()=>{
 const attempt={key:documentId,body:{action:'ACCEPT',documentId,language:'fr',expectedDraftRevision:1,expectedOwnerGeneration:1,expectedConsentRevision:0}},calls=[];
 const request=async(path,options)=>{calls.push({path,options});if(calls.length===1)throw new Error('Unknown result');return {...state,status:'WITHDRAWN'};};
 await assert.rejects(()=>changeConsent(request,id,attempt));assert.equal((await changeConsent(request,id,attempt)).status,'WITHDRAWN');
 assert.deepEqual(calls[0],calls[1]);assert.equal(calls[1].options.idempotencyKey,documentId);
});
test('authenticator flow uses actual provider challenges and never treats an invalid code or provider failure as success',async()=>{
 const calls=[],auth={mfa:{listFactors:async()=>({error:null,data:{totp:[{id,friendly_name:'Staff',status:'verified'},{id:documentId,status:'unverified'}]}}),
  challengeAndVerify:async body=>{calls.push(body);return {data:{access_token:'synthetic-provider-token'},error:null};}}};
 assert.deepEqual(await verifiedTotpFactors(auth),[{id,name:'Staff'}]);await assert.rejects(()=>verifyTotp(auth,id,'12'));
 assert.equal(calls.length,0);assert.equal(await verifyTotp(auth,id,'123456'),'synthetic-provider-token');assert.deepEqual(calls,[{factorId:id,code:'123456'}]);
 auth.mfa.challengeAndVerify=async()=>({data:null,error:{message:'Invalid code'}});await assert.rejects(()=>verifyTotp(auth,id,'123456'));
 assert.equal(preserveAuthView('MFA_CHALLENGE_VERIFIED',id,id,true),true);
 assert.equal(preserveAuthView('MFA_CHALLENGE_VERIFIED',id,documentId,true),false);
});
test('access and consent screens have matching English and French resources',()=>{
 const keys=o=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?keys(v).map(c=>k+'.'+c):[k]).sort();
 assert.deepEqual(keys(accessSecurityEn),keys(accessSecurityFr));assert.deepEqual(keys(ownerConsentEn),keys(ownerConsentFr));
});
