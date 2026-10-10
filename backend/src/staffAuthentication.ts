import {ForbiddenException,ServiceUnavailableException,UnauthorizedException} from '@nestjs/common';
import {createClient, type SupabaseClient, type User} from '@supabase/supabase-js';
import type {IdentityVerifier} from './auth';
import type {Pool} from 'pg';
import {rememberVerifiedSession, type VerifiedSession} from './requestIdentity';

type AuthGateway=Pick<SupabaseClient['auth'],'getClaims'|'getUser'>;
export type StaffAuthenticationPolicy={factor:'totp'|'phone';maxAuthenticationAgeSeconds:number};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unavailable=()=>new ServiceUnavailableException({code:'AUTH_UNAVAILABLE'});
const denied=()=>new ForbiddenException({code:'STAFF_MFA_REQUIRED'});

// JWTs are verified by Supabase getClaims, never accepted by decoding alone.
export class SupabaseStaffAuthentication implements IdentityVerifier {
  private readonly auth:AuthGateway;
  private readonly issuer:string;
  constructor(url:string,key:string,private readonly policy:StaffAuthenticationPolicy,
    auth?:AuthGateway,private readonly now:()=>number=()=>Date.now()/1000){
    const parsed=new URL(url);
    if(parsed.protocol!=='https:'||parsed.pathname!=='/'||parsed.search||parsed.hash)throw new Error('Staff authentication requires an HTTPS project origin.');
    if(!['totp','phone'].includes(policy.factor)||!Number.isSafeInteger(policy.maxAuthenticationAgeSeconds)||policy.maxAuthenticationAgeSeconds<60
      ||policy.maxAuthenticationAgeSeconds>86400)throw new Error('An explicit staff authentication policy is required.');
    this.issuer=parsed.origin+'/auth/v1';
    this.auth=auth??createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
      global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}}).auth;
  }
  async verify(authorization:string|undefined):Promise<string>{return (await this.verifyContext(authorization)).authUserId;}
  async verifyContext(authorization:string|undefined){
    const match=/^Bearer ([^\s]+)$/i.exec(authorization??'');
    if(!match)throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    let verified,userResult;
    try{[verified,userResult]=await Promise.all([this.auth.getClaims(match[1]),this.auth.getUser(match[1])]);}
    catch{throw unavailable();}
    for(const result of [verified,userResult]){
      if(result.error){if(!result.error.status||result.error.status>=500)throw unavailable();
        throw new UnauthorizedException({code:'INVALID_SESSION'});}
    }
    const claims=verified.data?.claims,user=userResult.data.user;
    if(!claims||!user)throw new UnauthorizedException({code:'INVALID_SESSION'});
    const current=this.now();
    if(claims.iss!==this.issuer||claims.role!=='authenticated'||claims.sub!==user.id||!uuid.test(claims.sub)
      ||!(Array.isArray(claims.aud)?claims.aud.includes('authenticated'):claims.aud==='authenticated')
      ||typeof claims.exp!=='number'||!Number.isFinite(claims.exp)||claims.exp<=current
      ||typeof claims.iat!=='number'||!Number.isFinite(claims.iat)||claims.iat>current
      ||(claims.nbf!==undefined&&(typeof claims.nbf!=='number'||!Number.isFinite(claims.nbf)||claims.nbf>current))
      ||typeof claims.session_id!=='string'||!uuid.test(claims.session_id)||claims.is_anonymous!==false||user.is_anonymous)
      throw new UnauthorizedException({code:'INVALID_SESSION'});
    if(claims.aal!=='aal2'||!this.confirmedIdentity(user)||!user.factors?.some(f=>f.factor_type===this.policy.factor&&f.status==='verified'))throw denied();
    const amr=claims.amr;
    // Entries must carry provider-issued timestamps. Bare method names and
    // user_metadata roles/MFA claims never establish authentication strength.
    const methods=Array.isArray(amr)?amr.filter((entry):entry is {method:string;timestamp:number}=>
      typeof entry==='object'&&entry!==null&&typeof entry.method==='string'&&typeof entry.timestamp==='number'
        &&Number.isSafeInteger(entry.timestamp)&&entry.timestamp>0&&entry.timestamp<=current):[];
    const recent=(method:string)=>methods.some(entry=>entry.method===method&&current-entry.timestamp<=this.policy.maxAuthenticationAgeSeconds);
    const factorMethod=this.policy.factor==='totp'?'totp':'phone';
    if(!recent('password')||!(recent(factorMethod)||recent('mfa/'+factorMethod)))throw denied();
    const authenticationAt=Math.max(...methods.filter(e=>e.method===factorMethod||e.method==='mfa/'+factorMethod).map(e=>e.timestamp));
    return {authUserId:user.id,sessionId:claims.session_id,aal:'aal2' as const,factor:this.policy.factor,
      authenticatedAt:authenticationAt,expiresAt:Math.min(claims.exp,
        Math.max(...methods.filter(e=>e.method==='password').map(e=>e.timestamp))+this.policy.maxAuthenticationAgeSeconds,
        authenticationAt+this.policy.maxAuthenticationAgeSeconds)};
  }
  private confirmedIdentity(user:User){return Boolean((user.email&&user.email_confirmed_at)||(user.phone&&user.phone_confirmed_at));}
}

// Confirmed email allows account bootstrap and direct owner consent. It grants
// no staff role, phone-possession proof or permission to read consumer vehicles.
export class SupabaseAccountAuthentication implements IdentityVerifier {
  private readonly auth:AuthGateway;
  private readonly issuer:string;
  constructor(url:string,key:string,auth?:AuthGateway,private readonly now:()=>number=()=>Date.now()/1000){
    const origin=new URL(url);
    if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Account authentication requires an HTTPS project origin.');
    this.issuer=origin.origin+'/auth/v1';
    this.auth=auth??createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
      global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}}).auth;
  }
  async verify(header:string|undefined){return (await this.verifyContext(header)).authUserId;}
  async verifyContext(header:string|undefined):Promise<VerifiedSession>{
    const match=/^Bearer ([^\s]+)$/i.exec(header??'');if(!match)throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    let claimsResult,userResult;
    try{[claimsResult,userResult]=await Promise.all([this.auth.getClaims(match[1]),this.auth.getUser(match[1])]);}catch{throw unavailable();}
    for(const r of [claimsResult,userResult])if(r.error){if(!r.error.status||r.error.status>=500)throw unavailable();throw new UnauthorizedException({code:'INVALID_SESSION'});}
    const c=claimsResult.data?.claims,u=userResult.data.user,now=this.now();
    if(!c||!u||c.iss!==this.issuer||c.role!=='authenticated'||c.sub!==u.id||!uuid.test(c.sub)
      ||!(Array.isArray(c.aud)?c.aud.includes('authenticated'):c.aud==='authenticated')||c.is_anonymous!==false||u.is_anonymous
      ||typeof c.exp!=='number'||!Number.isFinite(c.exp)||c.exp<=now||typeof c.iat!=='number'||!Number.isFinite(c.iat)||c.iat>now
      ||(c.nbf!==undefined&&(typeof c.nbf!=='number'||!Number.isFinite(c.nbf)||c.nbf>now))||typeof c.session_id!=='string'||!uuid.test(c.session_id))
      throw new UnauthorizedException({code:'INVALID_SESSION'});
    if(!((u.email&&u.email_confirmed_at)||(u.phone&&u.phone_confirmed_at)))throw new ForbiddenException({code:'CONFIRMED_ACCOUNT_REQUIRED'});
    return {authUserId:u.id,sessionId:c.session_id,expiresAt:c.exp,staff:false};
  }
}

export class SessionCheckedAuthentication implements IdentityVerifier {
  constructor(private readonly verifier:{verifyContext(header:string|undefined):Promise<{authUserId:string;sessionId:string;expiresAt:number}>},
    private readonly pool:Pool,private readonly tenant:string,private readonly staff:boolean){}
  async verify(header:string|undefined){
    const identity={...await this.verifier.verifyContext(header),staff:this.staff};
    const client=await this.pool.connect();
    try{
      await client.query('begin');await client.query('set local role autoguardian_enrollment_api');
      await client.query(`select set_config('autoguardian.tenant_id',$1,true),set_config('autoguardian.auth_user_id',$2,true),
        set_config('autoguardian.session_id',$3,true),set_config('autoguardian.staff_until',$4,true)`,
        [this.tenant,identity.authUserId,identity.sessionId,this.staff?String(identity.expiresAt):'']);
      const result=await client.query('select private.access_session_valid($1) as valid',[this.staff]);
      if(!result.rows[0]?.valid)throw new ForbiddenException({code:'SESSION_REVOKED'});
      await client.query('commit');
    }catch(error){await client.query('rollback');throw error;}finally{client.release();}
    rememberVerifiedSession(identity);return identity.authUserId;
  }
}
