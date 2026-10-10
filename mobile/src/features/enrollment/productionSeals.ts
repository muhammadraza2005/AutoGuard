import {z} from 'zod';
const revision=z.number().int().min(1).max(2147483646);
const code=z.string().regex(/^AG[A-F0-9]{32}$/);
const status=z.enum(['IN_STOCK','ACTIVE','REVOKED','DESTROYED']);
const text=(max:number)=>z.string().trim().min(3).max(max).refine(v=>!/[\x00-\x1f\x7f]/.test(v));
const qr=z.string().max(512).url().refine(v=>new URL(v).protocol==='https:');
export const sealInspectionState=z.object({draftId:z.uuid(),draftRevision:revision,snapshotRevision:revision,
  inspectionRevision:z.number().int().min(0),package:z.enum(['NONE','STANDARD','ONE_ALARM','FOUR_ALARMS']).nullable(),
  placements:z.array(z.object({position:z.number().int().min(1).max(4),code,status,type:z.enum(['STANDARD','ALARM']),
    photoId:z.uuid().nullable(),description:text(200).nullable()})).max(4),
  locations:z.array(z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/),approved:z.boolean(),requiresActualComment:z.boolean().optional()})).max(100),
  physicalVerified:z.boolean(),frozen:z.boolean()}).superRefine((v,ctx)=>{
    if(new Set(v.placements.map(p=>p.position)).size!==v.placements.length || new Set(v.placements.map(p=>p.code)).size!==v.placements.length
      || (v.package==='NONE'&&v.placements.length>0))ctx.addIssue({code:'custom',message:'Invalid seal inspection state.'});
  });
export type SealInspectionState=z.infer<typeof sealInspectionState>;
export const sealInspectionBody=z.object({expectedDraftRevision:revision,expectedSnapshotRevision:revision,
  expectedInspectionRevision:z.number().int().min(0).max(2147483646),action:z.enum(['APPROVE','REJECT']),
  placements:z.array(z.object({position:z.number().int().min(1).max(4),location:z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/),
    comment:text(200),qrUrl:qr.nullable(),idMatches:z.boolean(),undamaged:z.boolean(),vehicleMatches:z.boolean(),safeSurface:z.boolean()}).strict()).max(4)
}).strict().superRefine((v,ctx)=>{
  if(![0,4].includes(v.placements.length)||new Set(v.placements.map(p=>p.position)).size!==v.placements.length
    ||(v.action==='APPROVE'&&v.placements.some(p=>!p.qrUrl||!p.idMatches||!p.undamaged||!p.vehicleMatches||!p.safeSurface)))
    ctx.addIssue({code:'custom',message:'Four physical checks and signed QR scans are required.'});
});
export type SealInspectionBody=z.infer<typeof sealInspectionBody>;
export const sealBatchBody=z.object({organizationId:z.uuid(),agentId:z.uuid(),manufacturer:text(160),batch:text(64),
  type:z.enum(['STANDARD','ALARM']),quantity:z.number().int().min(1).max(100),
  manufacturedOn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&Date.parse(v)<=Date.now()),
  physicalBatchConfirmed:z.literal(true)}).strict();
export type SealBatchBody=z.infer<typeof sealBatchBody>;
type Request=(path:string,options?:{method?:'POST';body?:unknown;idempotencyKey?:string;signal?:AbortSignal})=>Promise<unknown>;
function parsedState(raw:unknown,id:string){const v=sealInspectionState.parse(raw);if(v.draftId.toLowerCase()!==id.toLowerCase())throw new Error('Unexpected draft.');return v;}
export async function readSealInspection(request:Request,id:string,signal?:AbortSignal){
  return parsedState(await request('/v1/registration-seals/'+z.uuid().parse(id)+'/inspection',{signal}),id);
}
export async function saveSealInspection(request:Request,id:string,key:string,body:SealInspectionBody,signal?:AbortSignal){
  return parsedState(await request('/v1/registration-seals/'+z.uuid().parse(id)+'/inspection',{
    method:'POST',idempotencyKey:z.uuid().parse(key),body:sealInspectionBody.parse(body),signal}),id);
}
export async function verifySealQr(request:Request,qrUrl:string,signal?:AbortSignal){
  const v=z.object({code,status,signatureVerified:z.literal(true),available:z.boolean(),revocationReason:z.string().nullable()})
    .parse(await request('/v1/registration-seals/verify',{method:'POST',body:{qrUrl:qr.parse(qrUrl)},signal}));
  if(v.status!=='IN_STOCK'||!v.available)throw new Error('Seal unavailable.');return v.code;
}
export async function issueSealBatch(request:Request,key:string,body:SealBatchBody,signal?:AbortSignal){
  const v=z.object({batchId:z.uuid(),physicalAuthenticity:z.literal('ISSUER_ATTESTED'),
    seals:z.array(z.object({code,qrUrl:qr,keyVersion:z.string().regex(/^[A-Za-z0-9_-]{1,32}$/),status})).min(1).max(100)})
    .parse(await request('/v1/registration-seals/batches',{method:'POST',idempotencyKey:z.uuid().parse(key),body:sealBatchBody.parse(body),signal}));
  if(v.seals.length!==body.quantity||new Set(v.seals.map(s=>s.code)).size!==v.seals.length)throw new Error('Unexpected issued batch.');return v;
}
