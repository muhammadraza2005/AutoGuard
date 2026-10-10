const {test}=require('node:test'),assert=require('node:assert/strict');
const {SupabaseStaffAuthentication,SupabaseAccountAuthentication}=require('../dist/staffAuthentication');
const subject='00000000-0000-4000-8000-000000000001',session='00000000-0000-4000-8000-000000000002';
const current=1800000000;
const claims={iss:'https://synthetic.supabase.co/auth/v1',aud:'authenticated',role:'authenticated',sub:subject,iat:current-10,exp:current+300,
  session_id:session,is_anonymous:false,aal:'aal2',amr:[{method:'password',timestamp:current-60},{method:'totp',timestamp:current-10}]};
const user={id:subject,email:'synthetic@example.test',email_confirmed_at:'synthetic',is_anonymous:false,factors:[{factor_type:'totp',status:'verified'}]};
const policy={factor:'totp',maxAuthenticationAgeSeconds:900};
function verifier(c=claims,u=user,error=null){return new SupabaseStaffAuthentication('https://synthetic.supabase.co','test-key',policy,
  {getClaims:async()=>({data:{claims:c},error}),getUser:async()=>({data:{user:u},error})},()=>current);}
test('staff authentication requires provider-verified password and configured MFA and returns bounded context',async()=>{
  assert.equal(await verifier().verify('Bearer synthetic'),subject);
  assert.deepEqual(await verifier().verifyContext('Bearer synthetic'),{authUserId:subject,sessionId:session,aal:'aal2',factor:'totp',authenticatedAt:current-10,expiresAt:current+300});
  await assert.rejects(()=>verifier().verify(undefined),e=>e.getStatus()===401);
});
test('confirmed account authentication bootstraps owner/staff accounts without granting MFA or phone proof',async()=>{
 const auth={getClaims:async()=>({data:{claims:{...claims,aal:'aal1'}},error:null}),getUser:async()=>({data:{user:{...user,factors:[]}},error:null})};
 const account=new SupabaseAccountAuthentication('https://synthetic.supabase.co','test',auth,()=>current);
 assert.deepEqual(await account.verifyContext('Bearer synthetic'),{authUserId:subject,sessionId:session,expiresAt:current+300,staff:false});
 auth.getUser=async()=>({data:{user:{...user,email_confirmed_at:null}},error:null});
 await assert.rejects(()=>account.verify('Bearer synthetic'),e=>e.getStatus()===403);
});
test('forged scope, expired tokens, inconsistent subjects and anonymous/recovery sessions cannot establish staff identity',async()=>{
  for(const patch of [{iss:'https://other.supabase.co/auth/v1'},{role:'service_role'},{aud:'anon'},{sub:session},{session_id:'invalid'},
    {exp:current},{iat:current+1},{nbf:current+1},{is_anonymous:true},{is_anonymous:undefined}])
    await assert.rejects(()=>verifier({...claims,...patch}).verify('Bearer synthetic'),e=>e.getStatus()===401);
  for(const patch of [{aal:'aal1'},{amr:['password','totp']},{amr:[{method:'password',timestamp:current-1000},{method:'totp',timestamp:current-5}]},
    {amr:[{method:'recovery',timestamp:current-5},{method:'totp',timestamp:current-5}]},{amr:[{method:'password',timestamp:current-5},{method:'totp',timestamp:current+1}]}])
    await assert.rejects(()=>verifier({...claims,...patch}).verify('Bearer synthetic'),e=>e.getStatus()===403);
});
test('removed factors, unconfirmed identities and metadata-only MFA fail closed',async()=>{
  for(const patch of [{factors:[]},{factors:[{factor_type:'totp',status:'unverified'}]},{email_confirmed_at:null},
    {factors:[],user_metadata:{aal:'aal2',role:'ENROLLMENT_AGENT',mfa:true}}])
    await assert.rejects(()=>verifier(claims,{...user,...patch}).verify('Bearer synthetic'),e=>e.getStatus()===403);
});
test('provider failures cannot become authentication; no policy is inferred silently',async()=>{
  await assert.rejects(()=>verifier(claims,user,{status:503}).verify('Bearer synthetic'),e=>e.getStatus()===503);
  await assert.rejects(()=>verifier(claims,user,{status:401}).verify('Bearer synthetic'),e=>e.getStatus()===401);
  assert.throws(()=>new SupabaseStaffAuthentication('https://synthetic.supabase.co','test',{factor:'none',maxAuthenticationAgeSeconds:900}));
  assert.throws(()=>new SupabaseStaffAuthentication('https://synthetic.supabase.co','test',{factor:'totp',maxAuthenticationAgeSeconds:0}));
});
