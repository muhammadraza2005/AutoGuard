import {AsyncLocalStorage} from 'node:async_hooks';
import {ForbiddenException} from '@nestjs/common';
import type {PoolClient} from 'pg';

export type VerifiedSession={authUserId:string;sessionId:string;expiresAt:number;staff:boolean};
const requests=new AsyncLocalStorage<{identity?:VerifiedSession}>();
export function identityRequest(next:()=>void){requests.run({},next);}
export function rememberVerifiedSession(identity:VerifiedSession){
  const request=requests.getStore();
  if(request)request.identity=identity;
}
export function hasVerifiedStaffSession(){return requests.getStore()?.identity?.staff===true;}
export async function setRequestIdentity(client:Pick<PoolClient,'query'>,tenant:string,actor:string){
  const identity=requests.getStore()?.identity;
  if(identity&&(identity.authUserId!==actor||identity.expiresAt<=Date.now()/1000))throw new ForbiddenException({code:'INVALID_SESSION'});
  await client.query(`select set_config('autoguardian.tenant_id',$1,true),set_config('autoguardian.auth_user_id',$2,true),
    set_config('autoguardian.session_id',$3,true),set_config('autoguardian.staff_until',$4,true)`,
    [tenant,actor,identity?.sessionId??'',identity?.staff?String(identity.expiresAt):'']);
  if(identity){
    const result=await client.query('select private.access_session_valid($1) as valid',[identity.staff]);
    if(!result.rows[0]?.valid)throw new ForbiddenException({code:'SESSION_REVOKED'});
  }
}
