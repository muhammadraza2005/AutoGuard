import {useEffect,useRef,useState} from 'react';
import {AppState,View} from 'react-native';
import {Redirect} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {randomUUID} from 'expo-crypto';
import {z} from 'zod';
import {useSession} from '@/features/auth/SessionProvider';
import {profileScope} from '@/features/auth/authEvents';
import type {AuthenticatedRequest} from '@/services/api/client';
import {runtime} from '@/config/runtime';
import {Action,AppHeader,Card,Copy,Heading,Label,Notice,StitchPage} from '@/components/ui/Stitch';
import {changeConsent,readConsent,type ConsentAttempt,type ConsentState} from './registrationConsent';

const queueSchema=z.object({items:z.array(z.object({id:z.uuid(),chassisIdentifier:z.string(),plate:z.string().nullable()}).strict())}).strict();
export default function RegistrationConsentScreen(){
  const {t}=useTranslation(),{profile,loading,request}=useSession();
  if(runtime.isDemo)return <Redirect href="/live-account"/>;
  if(loading)return <StitchPage><Copy>{t('devAuth.loading')}</Copy></StitchPage>;
  if(!profile)return <Redirect href="/(auth)/sign-in"/>;
  if(!profile.roles.some(r=>r.code==='OWNER'&&r.organizationId===null))return <Redirect href="/live-account"/>;
  return <ConsentContent key={profileScope(profile)} request={request}/>;
}
function ConsentContent({request}:{request:AuthenticatedRequest}){
  const {t,i18n}=useTranslation();
  const [queue,setQueue]=useState<z.infer<typeof queueSchema>['items']>([]),[state,setState]=useState<ConsentState|null>(null);
  const [ackContext,setAckContext]=useState<string|null>(null),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false),[retry,setRetry]=useState(false),[started,setStarted]=useState(false);
  const epoch=useRef(0),mounted=useRef(false),attempt=useRef<ConsentAttempt|null>(null),inflight=useRef(false);
  const language=i18n.resolvedLanguage?.startsWith('fr')?'fr':'en';
  const agreementContext=state?JSON.stringify([state.draftId,state.document?.id,state.draftRevision,state.ownerGeneration,state.consentRevision,language]):null;
  const ack=agreementContext!==null&&ackContext===agreementContext;
  useEffect(()=>{
    mounted.current=true;epoch.current++;
    const hide=()=>{epoch.current++;setState(null);setAckContext(null);setQueue([]);setStarted(false);attempt.current=null;setRetry(false);};
    const sub=AppState.addEventListener('change',s=>{if(s!=='active')hide();});
    const visibility=()=>{if(document.visibilityState!=='visible')hide();};
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
    const invalidate=()=>{epoch.current++;};
    return ()=>{mounted.current=false;invalidate();sub.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);};
  },[]);
  async function load(id?:string){
    if(inflight.current)return;inflight.current=true;setBusy(true);setFailed(false);setAckContext(null);const generation=epoch.current;
    try{const result=id?await readConsent(request,id):queueSchema.parse(await request('/v1/me/registration-consents'));
      if(!mounted.current||epoch.current!==generation)return;
      if('items' in result){setQueue(result.items);setState(null);setStarted(true);}else setState(result);
    }catch{if(mounted.current&&epoch.current===generation)setFailed(true);}finally{inflight.current=false;if(mounted.current)setBusy(false);}
  }
  async function change(action:'ACCEPT'|'WITHDRAW',repeat=false){
    if(inflight.current||!state)return;
    if(!repeat){
      if(action==='ACCEPT'&&(!ack||!state.document||state.active))return;
      const documentId=action==='ACCEPT'?state.document?.id:state.lastDocumentId;
      const acceptedLanguage=action==='ACCEPT'?language:state.lastLanguage;
      if(!documentId||!acceptedLanguage)return;
      attempt.current={key:randomUUID(),body:{action,documentId,language:acceptedLanguage,expectedDraftRevision:state.draftRevision,
        expectedOwnerGeneration:state.ownerGeneration,expectedConsentRevision:state.consentRevision}};
    }
    if(!attempt.current)return;inflight.current=true;setBusy(true);setFailed(false);const generation=epoch.current;
    try{const result=await changeConsent(request,state.draftId,attempt.current);
      if(mounted.current&&epoch.current===generation){setState(result);attempt.current=null;setRetry(false);setAckContext(null);}
    }catch{if(mounted.current&&epoch.current===generation){setFailed(true);setRetry(true);}}
    finally{inflight.current=false;if(mounted.current)setBusy(false);}
  }
  return <View style={{flex:1}}><AppHeader/><StitchPage><Heading>{t('ownerConsent.title')}</Heading>
    <Notice>{t('ownerConsent.description')}</Notice>
    {!state&&<><Action label={t('ownerConsent.load')} disabled={busy} onPress={()=>void load()}/>
      {started&&!queue.length&&<Copy>{t('ownerConsent.empty')}</Copy>}
      {queue.map(row=><Action secondary key={row.id} label={row.plate||row.chassisIdentifier} disabled={busy} onPress={()=>void load(row.id)}/>)}</>}
    {state&&<><Card><Label>{t('ownerConsent.vehicle')}</Label><Copy selectable>{[state.vehicle.chassisIdentifier,state.vehicle.plate,state.vehicle.category,state.vehicle.make,state.vehicle.model,state.vehicle.manufactureYear,state.vehicle.color].filter(v=>v!==null).join(' · ')}</Copy>
      <Label>{t('ownerConsent.status')}</Label><Copy>{t('ownerConsent.states.'+state.status)}</Copy>
      {state.document?<><Label>{t('ownerConsent.version')}</Label><Copy>{state.document.version}</Copy><Copy>{state.document[language]}</Copy>
        <Label>{t('ownerConsent.retention')}</Label><Copy>{state.document.retentionNotice}</Copy><Label>{t('ownerConsent.contact')}</Label><Copy selectable>{state.document.privacyContact}</Copy></>
        :<Notice tone="danger">{t('ownerConsent.notConfigured')}</Notice>}
      {!state.active&&state.document&&state.status!=='ACCEPTED'&&!retry&&<>
        <Action secondary label={(ack?'☑ ':'☐ ')+t('ownerConsent.ack')} disabled={busy} onPress={()=>setAckContext(ack?null:agreementContext)}/>
        <Action label={t('ownerConsent.accept')} disabled={busy||!ack} onPress={()=>void change('ACCEPT')}/></>}
      {!state.active&&state.lastDocumentId&&state.status!=='WITHDRAWN'&&!retry&&<Action secondary label={t('ownerConsent.withdraw')} disabled={busy} onPress={()=>void change('WITHDRAW')}/>}
      {state.active&&<Notice>{t('ownerConsent.active')}</Notice>}
    </Card><Card><Label>{t('ownerConsent.history')}</Label>{state.history.map(e=><Copy key={e.id}>{t('ownerConsent.events.'+e.action)} · {e.language.toUpperCase()} · {new Date(e.createdAt).toLocaleString()}</Copy>)}</Card>
      {retry&&<Action label={t('ownerConsent.retry')} disabled={busy} onPress={()=>void change(attempt.current?.body.action??'ACCEPT',true)}/>}
      <Action secondary label={t('ownerConsent.refresh')} disabled={busy} onPress={()=>void load(state.draftId)}/>
      <Action secondary label={t('ownerConsent.back')} disabled={busy} onPress={()=>{setState(null);attempt.current=null;setRetry(false);}}/>
    </>}
    {failed&&<Notice tone="danger">{t('ownerConsent.failed')}</Notice>}
  </StitchPage></View>;
}
