import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {BadRequestException, ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Pool} from 'pg';
import {setRequestIdentity} from './requestIdentity';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid=()=>{throw new BadRequestException({code:'INVALID_PRODUCTION_SEAL'});};
function object(value:unknown,keys:string[]):Record<string,any> {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||Object.keys(value).some(k=>!keys.includes(k)))return invalid();
  return value as Record<string,any>;
}
function text(value:unknown,max=160) {
  if(typeof value!=='string'||value.trim().length<3||value.trim().length>max||/[\u0000-\u001f\u007f]/.test(value)
    ||/placeholder|replace_with|^test$|^sample$|^unknown$/i.test(value))return invalid();
  return value.trim();
}
export function sealBatchInput(value:unknown) {
  const v=object(value,['organizationId','agentId','manufacturer','batch','type','quantity','manufacturedOn','physicalBatchConfirmed']);
  if(!uuid.test(v.organizationId)||!uuid.test(v.agentId)||!['STANDARD','ALARM'].includes(v.type)
    ||!Number.isInteger(v.quantity)||v.quantity<1||v.quantity>100||v.physicalBatchConfirmed!==true
    ||typeof v.manufacturedOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.manufacturedOn)
    ||!Number.isFinite(Date.parse(v.manufacturedOn))||new Date(v.manufacturedOn).toISOString().slice(0,10)!==v.manufacturedOn
    ||Date.parse(v.manufacturedOn)>Date.now())return invalid();
  return {...v,quantity:v.quantity as number,manufacturer:text(v.manufacturer),batch:text(v.batch,64)};
}
export function sealInspectionInput(value:unknown) {
  const v=object(value,['expectedDraftRevision','expectedSnapshotRevision','expectedInspectionRevision','action','placements']);
  for(const k of ['expectedDraftRevision','expectedSnapshotRevision','expectedInspectionRevision'])
    if(!Number.isInteger(v[k])||v[k]<(k==='expectedInspectionRevision'?0:1)||v[k]>=2147483647)return invalid();
  if(!['APPROVE','REJECT'].includes(v.action)||!Array.isArray(v.placements)||![0,4].includes(v.placements.length))return invalid();
  const placements=v.placements.map((p:unknown)=>{
    const item=object(p,['position','location','comment','qrUrl','idMatches','undamaged','vehicleMatches','safeSurface']);
    if(!Number.isInteger(item.position)||item.position<1||item.position>4||typeof item.location!=='string'
      ||!/^[A-Z][A-Z0-9_]{1,63}$/.test(item.location)
      ||(item.qrUrl!==null&&(typeof item.qrUrl!=='string'||item.qrUrl.length>512))
      ||['idMatches','undamaged','vehicleMatches','safeSurface'].some(k=>typeof item[k]!=='boolean'))return invalid();
    return {...item,comment:text(item.comment,200)};
  }).sort((a:Record<string,any>,b:Record<string,any>)=>a.position-b.position);
  if(new Set(placements.map((p:Record<string,any>)=>p.position)).size!==placements.length)return invalid();
  return {...v,placements} as Record<string,any> & {placements:Record<string,any>[]};
}
export function sealRevocationInput(value:unknown) {
  const v=object(value,['code','reason']);
  if(typeof v.code!=='string'||!/^AG[A-F0-9]{32}$/.test(v.code)||!['DAMAGED','REPLACED','LOST','FRAUD'].includes(v.reason))return invalid();
  return {code:v.code as string,reason:v.reason as string};
}

export class SealSigner {
  private readonly keys:Map<string,Buffer>;private readonly origin:string;
  constructor(private readonly tenant:string,origin:string,private readonly activeVersion:string,keys:Record<string,string>) {
    const url=new URL(origin);
    if(url.protocol!=='https:'||url.origin!==origin||url.username||url.password||!uuid.test(tenant)||!/^[A-Za-z0-9_-]{1,32}$/.test(activeVersion))throw new Error('Invalid seal signing configuration');
    this.origin=origin;this.keys=new Map(Object.entries(keys).map(([version,key])=>{
      if(!/^[A-Za-z0-9_-]{1,32}$/.test(version)||!/^[0-9a-f]{64}$/i.test(key))throw new Error('Seal keys must contain 32 random bytes encoded as hex');
      return [version,Buffer.from(key,'hex')];
    }));
    if(!this.keys.has(activeVersion))throw new Error('Active seal key is missing');
  }
  private signature(code:string,version:string) {
    const key=this.keys.get(version);if(!key)return invalid();
    return createHmac('sha256',key).update(`AutoGuardian:seal:v1:${this.tenant}:${version}:${code}`).digest('base64url');
  }
  issue(code='AG'+randomBytes(16).toString('hex').toUpperCase()) {
    if(!/^AG[A-F0-9]{32}$/.test(code))return invalid();
    const signature=this.signature(code,this.activeVersion);
    return {code,keyVersion:this.activeVersion,qrUrl:`${this.origin}/s/${code}?v=${this.activeVersion}&sig=${signature}`};
  }
  verify(value:unknown) {
    if(typeof value!=='string'||value.length>512)return invalid();
    let url:URL;try{url=new URL(value);}catch{return invalid();}
    const code=url.pathname.slice(3),version=url.searchParams.get('v')??'',signature=url.searchParams.get('sig')??'';
    if(url.origin!==this.origin||url.username||url.password||url.hash||!url.pathname.startsWith('/s/')||!/^AG[A-F0-9]{32}$/.test(code)
      ||url.searchParams.size!==2||url.searchParams.getAll('v').length!==1||url.searchParams.getAll('sig').length!==1||!/^[A-Za-z0-9_-]{43}$/.test(signature))return invalid();
    const expected=Buffer.from(this.signature(code,version)),actual=Buffer.from(signature);
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return invalid();
    return {code,keyVersion:version};
  }
}

export class PostgresProductionSealStore {
  constructor(private readonly pool:Pool,private readonly tenant:string) {}
  issue(actor:string,key:string,input:ReturnType<typeof sealBatchInput>,seals:ReturnType<SealSigner['issue']>[]) {
    return this.call(actor,'issue',[key,JSON.stringify(input),JSON.stringify(seals)]);
  }
  read(actor:string,draft:string) {return this.call(actor,'read',[draft]);}
  inspect(actor:string,draft:string,key:string,input:ReturnType<typeof sealInspectionInput>) {
    return this.call(actor,'inspect',[draft,key,JSON.stringify(input)]);
  }
  verify(actor:string,code:string,version:string) {return this.call(actor,'verify',[code,version]);}
  revoke(actor:string,key:string,input:ReturnType<typeof sealRevocationInput>) {return this.call(actor,'revoke',[key,input.code,input.reason]);}
  private async call(actor:string,action:'issue'|'read'|'inspect'|'verify'|'revoke',args:unknown[]) {
    const client=await this.pool.connect();
    try {
      await client.query('begin isolation level serializable');await client.query('set local role autoguardian_enrollment_api');
      await setRequestIdentity(client,this.tenant,actor);
      const result=await client.query(`select private.production_seal_${action}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args);
      await client.query('commit');return result.rows[0].result;
    }catch(error){
      await client.query('rollback');const e=error as {code?:string};
      if(['AG400','23514','22P02'].includes(e.code??''))throw new BadRequestException({code:'INVALID_PRODUCTION_SEAL'});
      if(e.code==='AG403')throw new ForbiddenException({code:'SEAL_ACCESS_REQUIRED'});
      if(e.code==='AG404')throw new NotFoundException({code:'SEAL_NOT_FOUND'});
      if(['AG409','23505','40001','40P01'].includes(e.code??''))throw new ConflictException({code:'SEAL_CHANGED'});
      if(['42883','42P01','42703'].includes(e.code??''))throw new ServiceUnavailableException({code:'SEAL_SETUP_REQUIRED'});
      throw error;
    }finally{client.release();}
  }
}
export class ProductionSealService {
  constructor(private readonly store:PostgresProductionSealStore,private readonly signer?:SealSigner) {}
  read(actor:string,draft:string) {return this.store.read(actor,draft);}
  revoke(actor:string,key:string,body:unknown) {return this.store.revoke(actor,key,sealRevocationInput(body));}
  inspect(actor:string,draft:string,key:string,body:unknown) {
    const input=sealInspectionInput(body);
    const placements=input.placements.map((p:Record<string,any>)=>{
      if(input.action==='REJECT')return {...p,scanCode:null,scanVersion:null};
      if(!this.signer)throw new ServiceUnavailableException({code:'SEAL_SIGNING_SETUP_REQUIRED'});
      const scanned=this.signer.verify(p.qrUrl);return {...p,scanCode:scanned.code,scanVersion:scanned.keyVersion};
    });
    return this.store.inspect(actor,draft,key,{...input,placements});
  }
  issue(actor:string,key:string,body:unknown) {
    const input=sealBatchInput(body);if(!this.signer)throw new ServiceUnavailableException({code:'SEAL_SIGNING_SETUP_REQUIRED'});
    return this.store.issue(actor,key,input,Array.from({length:input.quantity},()=>this.signer!.issue()));
  }
  verify(actor:string,body:unknown) {
    const input=object(body,['qrUrl']);if(!this.signer)throw new ServiceUnavailableException({code:'SEAL_SIGNING_SETUP_REQUIRED'});
    const value=this.signer.verify(input.qrUrl);return this.store.verify(actor,value.code,value.keyVersion);
  }
}
export function configuredProductionSeals(env:NodeJS.ProcessEnv,store:PostgresProductionSealStore,tenant:string) {
  const keys=env.AUTOGUARDIAN_SEAL_KEYS_JSON,origin=env.AUTOGUARDIAN_SEAL_ORIGIN,active=env.AUTOGUARDIAN_SEAL_ACTIVE_KEY;
  if(!keys&&!origin&&!active)return new ProductionSealService(store);
  if(!keys||!origin||!active)throw new Error('Configure all three AUTOGUARDIAN_SEAL signing settings');
  if(env.NODE_ENV==='production' && /\.(invalid|test|example)$|^localhost$/i.test(new URL(origin).hostname))
    throw new Error('Replace the test seal verification origin before production.');
  const parsed:unknown=JSON.parse(keys);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid seal key ring');
  return new ProductionSealService(store,new SealSigner(tenant,origin,active,parsed as Record<string,string>));
}
