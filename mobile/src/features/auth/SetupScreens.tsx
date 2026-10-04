import { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';
import { useSession } from './SessionProvider';

export function TermsScreen() {
  const {t}=useTranslation();const router=useRouter();const [accepted,setAccepted]=useState(false);
  return <StitchPage><Heading>{t('flow.terms')}</Heading><Notice>{t('flow.termsBody')}</Notice><Card><Ionicons name="document-text-outline" size={28} color={colors.primary}/><Copy>{t('flow.termsSample')}</Copy><View style={u.divider}/><Pressable accessibilityRole="checkbox" accessibilityState={{checked:accepted}} onPress={()=>setAccepted(!accepted)} style={[u.row,{minHeight:48}]}><Ionicons name={accepted?'checkbox':'square-outline'} size={25} color={colors.primary}/><Copy style={{flex:1}}>{t('flow.consent')}</Copy></Pressable></Card><Action label={t('flow.continue')} disabled={!accepted} onPress={()=>router.push('/(auth)/pin-setup')}/><Action secondary label={t('stitch.cancel')} onPress={()=>router.back()}/></StitchPage>;
}
export function PinSetupScreen() {
  const {t}=useTranslation();const router=useRouter();const {setPreviewSection}=useSession();const [pin,setPin]=useState('');const [confirm,setConfirm]=useState('');const [step,setStep]=useState(1);const [error,setError]=useState(false);
  return <StitchPage><Heading>{t(step===1?'flow.pinSetup':'flow.pinConfirm')}</Heading><Copy style={u.muted}>{t(step===1?'flow.pinBody':'flow.confirmBody')}</Copy><Card><View style={{alignItems:'center',padding:16}}><Ionicons name="lock-closed-outline" size={38} color={colors.primary}/></View><Label>{t('flow.pin')}</Label><TextInput accessibilityLabel={t('flow.pin')} value={step===1?pin:confirm} onChangeText={v=>{const digits=v.replace(/\D/g,'');if(step===1)setPin(digits);else setConfirm(digits);setError(false);}} style={[u.input,{textAlign:'center',letterSpacing:12,fontSize:24}]} maxLength={6} keyboardType="number-pad" secureTextEntry/><Action label={t(step===1?'flow.continue':'flow.setup')} disabled={(step===1?pin:confirm).length<4} onPress={()=>{if(step===1)setStep(2);else if(pin!==confirm)setError(true);else{setPin('');setConfirm('');setPreviewSection('consumer');router.replace('/(consumer)');}}}/>{step===2&&<Action secondary label={t('stitch.previous')} onPress={()=>setStep(1)}/>}</Card>{error&&<Notice tone="danger">{t('flow.pinMismatch')}</Notice>}<Notice>{t('flow.pinNotice')}</Notice></StitchPage>;
}
