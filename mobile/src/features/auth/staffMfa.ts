import type {SupabaseClient} from '@supabase/supabase-js';

export async function verifiedTotpFactors(auth:SupabaseClient['auth']){
  const {data,error}=await auth.mfa.listFactors();
  if(error)throw new Error('Factor lookup failed.');
  return data.totp.filter(f=>f.status==='verified').map(f=>({id:f.id,name:f.friendly_name||'Authenticator'}));
}
export async function verifyTotp(auth:SupabaseClient['auth'],factorId:string,code:string){
  if(!/^[0-9]{6}$/.test(code))throw new Error('Enter the six-digit authenticator code.');
  const {data,error}=await auth.mfa.challengeAndVerify({factorId,code});
  if(error||!data?.access_token)throw new Error('Authenticator verification failed.');
  return data.access_token;
}
