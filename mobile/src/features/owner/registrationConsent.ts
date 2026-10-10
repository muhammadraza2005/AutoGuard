import {z} from 'zod';
import type {AuthenticatedRequest} from '@/services/api/client';
const uuid=z.uuid();
const vehicle=z.object({chassisIdentifier:z.string(),plate:z.string().nullable(),category:z.string(),make:z.string().nullable(),model:z.string().nullable(),
  manufactureYear:z.number().int().nullable(),color:z.string().nullable()}).strict();
export const consentStateSchema=z.object({draftId:uuid,draftRevision:z.number().int().positive(),ownerGeneration:z.number().int().positive(),consentRevision:z.number().int().nonnegative(),
  status:z.enum(['MISSING','STALE','ACCEPTED','WITHDRAWN']),active:z.boolean(),vehicle,
  document:z.object({id:uuid,version:z.string(),operator:z.string(),authority:z.string(),privacyContact:z.string(),retentionNotice:z.string(),
    en:z.string().min(100),fr:z.string().min(100),hashEn:z.string().regex(/^[a-f0-9]{64}$/),hashFr:z.string().regex(/^[a-f0-9]{64}$/)}).strict().nullable(),
  lastDocumentId:uuid.nullable(),lastLanguage:z.enum(['en','fr']).nullable(),phoneVerified:z.literal(false),
  history:z.array(z.object({id:uuid,action:z.enum(['ACCEPT','WITHDRAW']),documentId:uuid,language:z.enum(['en','fr']),createdAt:z.string()}).strict())}).strict()
  .refine(s=>s.status!=='ACCEPTED'||(s.document!==null&&s.lastDocumentId===s.document.id&&s.lastLanguage!==null));
export type ConsentState=z.infer<typeof consentStateSchema>;
export const consentBodySchema=z.object({action:z.enum(['ACCEPT','WITHDRAW']),documentId:uuid,language:z.enum(['en','fr']),expectedDraftRevision:z.number().int().positive(),
  expectedOwnerGeneration:z.number().int().positive(),expectedConsentRevision:z.number().int().nonnegative()}).strict();
export type ConsentAttempt={key:string;body:z.infer<typeof consentBodySchema>};
function checked(value:unknown,id:string){const state=consentStateSchema.parse(value);if(state.draftId!==id)throw new Error('Consent context changed.');return state;}
export async function readConsent(request:AuthenticatedRequest,id:string){uuid.parse(id);return checked(await request('/v1/me/registration-consents/'+id),id);}
export async function changeConsent(request:AuthenticatedRequest,id:string,attempt:ConsentAttempt){uuid.parse(id);uuid.parse(attempt.key);
  const body=consentBodySchema.parse(attempt.body);return checked(await request('/v1/me/registration-consents/'+id,{method:'POST',body,idempotencyKey:attempt.key}),id);}
