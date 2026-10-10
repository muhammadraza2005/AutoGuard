import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,TextInput,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {randomUUID} from 'expo-crypto';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {useSession} from '@/features/auth/SessionProvider';
import {Action,Card,Copy,Heading,Label,Notice,stitchStyles} from '@/components/ui/Stitch';
import {ApiError} from '@/services/api/client';
import {readSealInspection,saveSealInspection,sealInspectionBody,issueSealBatch,sealBatchBody,
  type SealInspectionBody,type SealBatchBody} from '@/features/enrollment/productionSeals';

function usePrivateView(clear:()=>void){
  const [active,setActive]=useState(AppState.currentState==='active');const latest=useRef(clear);
  useEffect(()=>{latest.current=clear;},[clear]);
  useFocusEffect(useCallback(()=>{setActive(true);return()=>{setActive(false);latest.current();};},[]));
  useEffect(()=>{
    function update(){const next=AppState.currentState==='active'&&(typeof document==='undefined'||document.visibilityState!=='hidden');setActive(next);if(!next)latest.current();}
    const sub=AppState.addEventListener('change',update);if(typeof document!=='undefined')document.addEventListener('visibilitychange',update);
    return()=>{sub.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',update);};
  },[]);return active;
}
function failure(error:unknown){return error instanceof ApiError?(error.status===503?'setup':error.status===409?'conflict':'failed'):'failed';}
const checks=['idMatches','undamaged','vehicleMatches','safeSurface'] as const;
type Row={position:number;qrUrl:string;idMatches:boolean;undamaged:boolean;vehicleMatches:boolean;safeSurface:boolean};
export function ProductionSealInspectionPanel({id,disabled,onSaved,onBusyChange}:{id:string;disabled:boolean;onSaved:()=>void;onBusyChange:(busy:boolean)=>void}){
  const {t}=useTranslation();const {profile,request}=useSession();const [rows,setRows]=useState<Row[]>([]),[none,setNone]=useState(false);
  const [busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[error,setError]=useState<string|null>(null);
  const attempt=useRef<{key:string;body:SealInspectionBody}|null>(null),abort=useRef<AbortController|null>(null),mounted=useRef(true),sending=useRef(false);
  const active=usePrivateView(()=>{abort.current?.abort();setRows([]);setNone(false);});
  const query=useQuery({queryKey:['production-seal-inspection',profile?.tenantId,profile?.id,id],
    queryFn:({signal})=>readSealInspection(request,id,signal),enabled:active,gcTime:0,retry:false,refetchOnWindowFocus:false});
  const {refetch}=query;
  useEffect(()=>{if(active)void refetch();},[active,refetch]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;abort.current?.abort();};},[]);
  useEffect(()=>{onBusyChange(busy||uncertain);},[busy,uncertain,onBusyChange]);
  useEffect(()=>()=>onBusyChange(false),[onBusyChange]);
  const state=active&&!query.isFetching&&!query.isError?query.data:undefined;
  const locked=disabled||busy||uncertain||!state||state.frozen;
  function row(position:number){return rows.find(p=>p.position===position)??{position,qrUrl:'',idMatches:false,undamaged:false,vehicleMatches:false,safeSurface:false};}
  function patch(position:number,value:Partial<Row>){setRows(old=>[...old.filter(p=>p.position!==position),{...row(position),...value}]);}
  async function save(action?:'APPROVE'|'REJECT'){
    if(sending.current||(!attempt.current&&(!state||locked||!action)))return;
    if(!attempt.current){
      const body=sealInspectionBody.safeParse({expectedDraftRevision:state!.draftRevision,expectedSnapshotRevision:state!.snapshotRevision,
        expectedInspectionRevision:state!.inspectionRevision,action,placements:action==='REJECT'||state!.package==='NONE'?[]:
          state!.placements.map(p=>({...row(p.position),location:'OTHER',comment:p.description,qrUrl:row(p.position).qrUrl||null}))});
      if(!body.success||(action==='APPROVE'&&(state!.package==='NONE'?!none:state!.placements.length!==4))){setError('invalid');return;}
      attempt.current={key:randomUUID(),body:body.data};
    }
    sending.current=true;setBusy(true);setError(null);abort.current=new AbortController();
    try{const pending=attempt.current;await saveSealInspection(request,id,pending.key,pending.body,abort.current.signal);
      if(!mounted.current)return;attempt.current=null;setUncertain(false);setRows([]);setNone(false);await query.refetch();onSaved();
    }catch(e){if(!mounted.current)return;const definite=e instanceof ApiError&&[400,401,403,404,409,422].includes(e.status);
      if(definite){attempt.current=null;setUncertain(false);setRows([]);setNone(false);void query.refetch();}else setUncertain(true);setError(failure(e));
    }finally{sending.current=false;if(mounted.current)setBusy(false);}
  }
  if(!active)return null;
  return <Card><Heading>{t('registrationIntegration.inspection')}</Heading><Copy>{t('registrationIntegration.inspectionHint')}</Copy>
    {query.isFetching&&<Copy>{t('registrationIntegration.loading')}</Copy>}
    {(error||query.error)&&<Notice tone="danger">{t('registrationIntegration.'+(error??failure(query.error)))}</Notice>}
    {state&&<><Notice tone={state.physicalVerified?'neutral':'warning'}>{t('registrationIntegration.'+(state.physicalVerified?'verified':'pending'))}</Notice>
      {state.package==='NONE'&&<Action secondary={!none} disabled={locked} label={t('registrationIntegration.none')} onPress={()=>setNone(v=>!v)}/>}
      {state.placements.map(p=><View key={p.position} style={{gap:8}}><Heading>{t('liveSeals.position',{number:p.position})}</Heading>
        <Copy selectable>{p.code}</Copy><Copy>{p.description}</Copy><Label>{t('registrationIntegration.qr')}</Label>
        <TextInput style={stitchStyles.input} accessibilityLabel={t('registrationIntegration.qr')+' '+p.position} value={row(p.position).qrUrl}
          editable={!locked} maxLength={512} autoCapitalize="none" autoCorrect={false} autoComplete="off" onChangeText={qrUrl=>patch(p.position,{qrUrl})}/>
        {checks.map(k=><Action key={k} secondary={!row(p.position)[k]} disabled={locked} label={t('registrationIntegration.'+k)}
          icon={row(p.position)[k]?'checkbox-outline':'square-outline'} onPress={()=>patch(p.position,{[k]:!row(p.position)[k]})}/>)}</View>)}
      <Action disabled={locked||state.package===null} label={t('registrationIntegration.approve')} onPress={()=>void save('APPROVE')}/>
      <Action secondary disabled={locked} label={t('registrationIntegration.reject')} onPress={()=>void save('REJECT')}/></>}
    {uncertain&&<><Notice tone="warning">{t('registrationIntegration.uncertain')}</Notice><Action disabled={busy||disabled} label={t('registrationIntegration.retry')} onPress={()=>void save()}/></>}
    <Action secondary disabled={busy||disabled} label={t('registrationIntegration.refresh')} onPress={()=>{attempt.current=null;setUncertain(false);setRows([]);setNone(false);setError(null);void query.refetch();onSaved();}}/>
  </Card>;
}

export function RegistrationSealBatchPanel(){
  const {t}=useTranslation();const {request}=useSession();const [open,setOpen]=useState(false);
  const [fields,setFields]=useState({organizationId:'',agentId:'',manufacturer:'',batch:'',manufacturedOn:'',quantity:'4'});
  const [type,setType]=useState<'STANDARD'|'ALARM'>('STANDARD'),[physical,setPhysical]=useState(false),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false);
  const [error,setError]=useState<string|null>(null),[issued,setIssued]=useState<Awaited<ReturnType<typeof issueSealBatch>>|null>(null);
  const attempt=useRef<{key:string;body:SealBatchBody}|null>(null),mounted=useRef(true),sending=useRef(false);
  const active=usePrivateView(()=>{setIssued(null);setPhysical(false);});
  const visible=useRef(active);useEffect(()=>{visible.current=active;},[active]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function issue(){
    if(sending.current)return;
    if(!attempt.current){const parsed=sealBatchBody.safeParse({...fields,quantity:Number(fields.quantity),type,physicalBatchConfirmed:physical});
      if(!parsed.success){setError('invalid');return;}attempt.current={key:randomUUID(),body:parsed.data};}
    sending.current=true;setBusy(true);setError(null);
    try{const v=await issueSealBatch(request,attempt.current.key,attempt.current.body);if(!mounted.current)return;
      if(!visible.current){setUncertain(true);return;}setIssued(v);attempt.current=null;setUncertain(false);setPhysical(false);}
    catch(e){if(!mounted.current)return;const definite=e instanceof ApiError&&[400,401,403,404,409,422].includes(e.status);if(definite)attempt.current=null;setUncertain(!definite);setError(failure(e));}
    finally{sending.current=false;if(mounted.current)setBusy(false);}
  }
  if(!active)return null;
  return <Card><Action secondary disabled={busy||uncertain} label={t('registrationIntegration.batch')} onPress={()=>setOpen(v=>!v)}/>
    {open&&<><Copy>{t('registrationIntegration.batchHint')}</Copy>
      {(Object.keys(fields) as (keyof typeof fields)[]).map(k=><View key={k} style={{gap:6}}><Label>{t('registrationIntegration.'+(k==='batch'?'batchCode':k))}</Label>
        <TextInput style={stitchStyles.input} accessibilityLabel={t('registrationIntegration.'+(k==='batch'?'batchCode':k))} value={fields[k]} editable={!busy&&!uncertain}
          autoCapitalize="none" autoCorrect={false} maxLength={k==='manufacturer'?160:k==='batch'?64:k==='quantity'?3:k==='manufacturedOn'?10:36}
          keyboardType={k==='quantity'?'number-pad':'default'} onChangeText={v=>setFields(old=>({...old,[k]:v}))}/></View>)}
      {(['STANDARD','ALARM'] as const).map(v=><Action key={v} secondary={type!==v} disabled={busy||uncertain} label={t('liveSeals.types.'+v)} onPress={()=>setType(v)}/>)}
      <Action secondary={!physical} disabled={busy||uncertain} label={t('registrationIntegration.physicalBatch')} onPress={()=>setPhysical(v=>!v)}/>
      {error&&<Notice tone="danger">{t('registrationIntegration.'+error)}</Notice>}
      {uncertain&&<Notice tone="warning">{t('registrationIntegration.uncertain')}</Notice>}
      <Action disabled={busy||(!uncertain&&!physical)} label={t('registrationIntegration.'+(uncertain?'retry':'issue'))} onPress={()=>void issue()}/>
      {issued&&<><Heading>{t('registrationIntegration.issued')}</Heading>{issued.seals.map(s=><View key={s.code} style={{gap:6}}><Copy selectable>{s.code}</Copy><Copy selectable>{s.qrUrl}</Copy></View>)}</>}
    </>}
  </Card>;
}
