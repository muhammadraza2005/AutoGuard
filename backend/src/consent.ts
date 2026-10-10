import {BadRequestException,ConflictException,ForbiddenException,NotFoundException,ServiceUnavailableException} from '@nestjs/common';
import type {Pool} from 'pg';
import {draftId} from './enrollments';
import {setRequestIdentity} from './requestIdentity';

export function consentInput(value:unknown){
  const allowed=['action','documentId','language','expectedDraftRevision','expectedOwnerGeneration','expectedConsentRevision'];
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==allowed.length
    ||Object.keys(value).some(k=>!allowed.includes(k)))throw new BadRequestException({code:'INVALID_CONSENT'});
  const b=value as Record<string,unknown>;
  if(!['ACCEPT','WITHDRAW'].includes(String(b.action))||!['en','fr'].includes(String(b.language))
    ||!['expectedDraftRevision','expectedOwnerGeneration','expectedConsentRevision'].every(k=>
      typeof b[k]==='number'&&Number.isSafeInteger(b[k])&&Number(b[k])>=(k==='expectedConsentRevision'?0:1)&&Number(b[k])<2147483647))
    throw new BadRequestException({code:'INVALID_CONSENT'});
  return {action:b.action as 'ACCEPT'|'WITHDRAW',documentId:draftId(b.documentId),language:b.language as 'en'|'fr',
    expectedDraftRevision:Number(b.expectedDraftRevision),expectedOwnerGeneration:Number(b.expectedOwnerGeneration),expectedConsentRevision:Number(b.expectedConsentRevision)};
}
export interface ConsentStore {
  staffStatus(actor:string):Promise<unknown>;
  list(actor:string):Promise<unknown>;
  read(actor:string,draft:string):Promise<unknown>;
  change(actor:string,draft:string,key:string,input:ReturnType<typeof consentInput>):Promise<unknown>;
}
export class PostgresConsentStore implements ConsentStore {
  constructor(private readonly pool:Pool,private readonly tenant:string){}
  staffStatus(actor:string){return this.call(actor,'staff_access_status',[]);}
  list(actor:string){return this.call(actor,'owner_consent_queue',[]);}
  read(actor:string,draft:string){return this.call(actor,'owner_consent_read',[draft]);}
  change(actor:string,draft:string,key:string,input:ReturnType<typeof consentInput>){
    return this.call(actor,'owner_consent_change',[draft,key,input.documentId,input.language,input.action,input.expectedDraftRevision,input.expectedOwnerGeneration,input.expectedConsentRevision]);
  }
  private async call(actor:string,name:string,args:unknown[]){
    const client=await this.pool.connect();
    try{
      await client.query('begin');await client.query('set local role autoguardian_enrollment_api');
      await setRequestIdentity(client,this.tenant,actor);
      const result=await client.query(`select private.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args);
      await client.query('commit');return result.rows[0].result;
    }catch(error){
      await client.query('rollback');const code=(error as {code?:string}).code;
      if(code==='AG400')throw new BadRequestException({code:'INVALID_CONSENT'});
      if(code==='AG403')throw new ForbiddenException({code:'OWNER_ACCESS_REQUIRED'});
      if(code==='AG404')throw new NotFoundException({code:'CONSENT_NOT_FOUND'});
      if(code==='AG409'||code==='23505')throw new ConflictException({code:'CONSENT_CHANGED'});
      if(code==='AG422')throw new ConflictException({code:'CONSENT_NOT_CONFIGURED'});
      if(['42883','42P01','42703'].includes(code??''))throw new ServiceUnavailableException({code:'CONSENT_SETUP_REQUIRED'});
      throw error;
    }finally{client.release();}
  }
}
