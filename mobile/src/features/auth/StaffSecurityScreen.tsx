import {useEffect,useRef,useState} from 'react';
import {AppState,TextInput,View} from 'react-native';
import {Redirect,useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import {useSession} from './SessionProvider';
import {profileScope} from './authEvents';
import {getSupabaseClient} from '@/services/supabase/client';
import {apiRequest} from '@/services/api/client';
import {runtime} from '@/config/runtime';
import {verifiedTotpFactors,verifyTotp} from './staffMfa';
import {Action,AppHeader,Card,Copy,Heading,Label,Notice,StitchPage,stitchStyles} from '@/components/ui/Stitch';

const statusSchema=z.object({verified:z.literal(true),factor:z.literal('totp'),maxAgeSeconds:z.literal(3600),expiresAt:z.iso.datetime({offset:true}),agent:z.boolean(),reviewer:z.boolean()})
  .refine(s=>s.agent||s.reviewer);
export default function StaffSecurityScreen(){
  const {t}=useTranslation(),{profile,loading,refreshProfile}=useSession();
  if(runtime.isDemo)return <Redirect href="/live-account"/>;
  if(loading)return <StitchPage><Copy>{t('devAuth.loading')}</Copy></StitchPage>;
  if(!profile)return <Redirect href="/(auth)/sign-in"/>;
  if(!profile.roles.some(r=>['ENROLLMENT_AGENT','TENANT_ADMIN'].includes(r.code)))return <Redirect href="/live-account"/>;
  return <SecurityContent key={profileScope(profile)} refreshProfile={refreshProfile}/>;
}
function SecurityContent({refreshProfile}:{refreshProfile:()=>void}){
  const {t}=useTranslation(),router=useRouter();
  const [factors,setFactors]=useState<{id:string;name:string}[]>([]),[selected,setSelected]=useState('');
  const [secret,setSecret]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
  const mounted=useRef(false),epoch=useRef(0),pending=useRef('');
  useEffect(()=>{
    mounted.current=true;const generation=++epoch.current;
    void verifiedTotpFactors(getSupabaseClient().auth).then(items=>{
      if(mounted.current&&epoch.current===generation){setFactors(items);setSelected(items[0]?.id??'');}
    }).catch(()=>{if(mounted.current&&epoch.current===generation)setFailed(true);});
    const hide=()=>{epoch.current++;setCode('');setSecret('');setReady(false);};
    const sub=AppState.addEventListener('change',state=>{if(state!=='active')hide();});
    const visibility=()=>{if(document.visibilityState!=='visible')hide();};
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
    const invalidate=()=>{epoch.current++;};
    return ()=>{mounted.current=false;invalidate();sub.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);};
  },[]);
  async function setup(){
    setBusy(true);setFailed(false);const generation=epoch.current;
    try{
      const auth=getSupabaseClient().auth;
      const verified=await verifiedTotpFactors(auth);
      if(verified.length){
        if(mounted.current&&generation===epoch.current){setFactors(verified);setSelected(verified[0].id);setSecret('');}
        return;
      }
      // Replace only this screen's unfinished factor, never a verified factor.
      if(pending.current){
        const lookup=await auth.mfa.listFactors();
        if(lookup.error||lookup.data.all.some(f=>f.id===pending.current&&f.status==='verified'))throw new Error('Refresh your authenticator factors.');
        const {error}=await auth.mfa.unenroll({factorId:pending.current});if(error)throw error;pending.current='';
      }
      const {data,error}=await auth.mfa.enroll({factorType:'totp',friendlyName:'AutoGuardian '+Date.now(),issuer:'AutoGuardian'});
      if(error||!data)throw new Error('Setup failed.');
      if(!mounted.current||generation!==epoch.current){await auth.mfa.unenroll({factorId:data.id});return;}
      pending.current=data.id;setSelected(data.id);setSecret(data.totp.secret);setReady(false);
    }catch{if(mounted.current&&generation===epoch.current)setFailed(true);}finally{if(mounted.current)setBusy(false);}
  }
  async function verify(){
    setBusy(true);setFailed(false);setReady(false);const generation=epoch.current;const input=code;setCode('');
    try{
      const token=await verifyTotp(getSupabaseClient().auth,selected,input);
      // Verified factors remain enrolled; the secret is immediately discarded.
      pending.current='';setSecret('');
      const status=statusSchema.parse(await apiRequest('/v1/me/staff-access',{accessToken:token}));
      if(mounted.current&&generation===epoch.current&&Date.parse(status.expiresAt)>Date.now()){setReady(true);refreshProfile();}
    }catch{if(mounted.current&&generation===epoch.current)setFailed(true);}finally{if(mounted.current)setBusy(false);}
  }
  return <View style={{flex:1}}><AppHeader/><StitchPage><Heading>{t('accessSecurity.title')}</Heading>
    <Notice>{t('accessSecurity.description')}</Notice>
    <Card>{factors.map(f=><Action secondary key={f.id} label={f.name} disabled={busy} onPress={()=>{setSelected(f.id);setReady(false);setSecret('');}}/>)}
      {!factors.length&&<Action secondary label={t('accessSecurity.setup')} disabled={busy} onPress={()=>void setup()}/>}
      {secret&&<><Label>{t('accessSecurity.secret')}</Label><Copy selectable>{secret}</Copy><Copy>{t('accessSecurity.secretHelp')}</Copy></>}
      <Label>{t('accessSecurity.code')}</Label><TextInput style={stitchStyles.input} accessibilityLabel={t('accessSecurity.code')}
        value={code} onChangeText={value=>setCode(value.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad" secureTextEntry autoComplete="off" autoCorrect={false} editable={!busy}/>
      <Action label={t('accessSecurity.verify')} disabled={busy||!selected||code.length!==6} onPress={()=>void verify()}/>
    </Card>
    {ready&&<Notice>{t('accessSecurity.ready')}</Notice>}
    {failed&&<Notice tone="danger">{t('accessSecurity.failed')}</Notice>}
    <Copy>{t('accessSecurity.recovery')}</Copy>
    <Action secondary label={t('devAuth.account')} onPress={()=>router.replace('/live-account')}/>
  </StitchPage></View>;
}
