import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, Progress, DetailRow, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';
import { runtime } from '@/config/runtime';

export default function AuthorizationScreen() {
  const { t } = useTranslation(); const router=useRouter(); const {id}=useLocalSearchParams<{id:string}>();
  const [answer,setAnswer]=useState<'yes'|'no'|null>(null); const [pin,setPin]=useState(''); const [submitted,setSubmitted]=useState(false); const [missing,setMissing]=useState(false);
  const expired=id==='req-2';
  if(submitted) return <StitchPage><Card><Ionicons name="information-circle-outline" size={40} color={colors.primary}/><Heading>{t('stitch.previewResponse')}</Heading><Copy>{t('stitch.previewResponseBody')}</Copy><Action label={t('navigation.alerts')} onPress={()=>router.replace('/(consumer)/alerts')}/></Card></StitchPage>;
  return <StitchPage>
    <Card>
      <View style={[u.row,{alignItems:'flex-start'}]}><View style={s.warningIcon}><Ionicons name="warning-outline" size={24} color={colors.warning}/></View><View style={{flex:1,gap:4}}><Heading style={{fontSize:18,lineHeight:24}}>{t('stitch.authorization')}</Heading><Copy style={u.muted}>{t('stitch.authorizationBody')}</Copy></View></View>
      <View style={s.deadline}><View style={[u.between,{flexWrap:'wrap'}]}><View style={u.row}><Ionicons name="time-outline" size={18} color={colors.danger}/><Label style={{color:colors.danger}}>{t('stitch.responseWindow')}</Label></View><Label style={{color:colors.danger}}>{expired?t('stitch.expired'):'09:44 '+t('stitch.remaining')}</Label></View><Progress value={expired?0:68} color={colors.danger}/><Copy style={{fontSize:12,lineHeight:18,color:colors.danger}}>{t('stitch.noResponse')}</Copy></View>
      <View style={u.inset}><DetailRow label={t('stitch.vehicle')} value="Toyota Land Cruiser Prado (2020)"/><DetailRow label={t('stitch.plate')} value="1842AA10"/><DetailRow label={t('stitch.vin')} value="JTEBU5JR8K5099241"/><DetailRow label={t('stitch.reference')} value="#REQ-88219"/><DetailRow label={t('stitch.channel')} value="App & SMS"/></View>
      <Action icon="checkmark-circle-outline" label={t('stitch.yes')} disabled={expired} onPress={()=>{setAnswer('yes');setPin('');}} style={answer==='yes'?{borderColor:colors.accent,borderWidth:2}:undefined}/>
      <Action danger icon="close-circle-outline" label={t('stitch.no')} disabled={expired} onPress={()=>{setAnswer('no');setPin('');}} style={answer==='no'?{backgroundColor:colors.dangerBackground}:undefined}/>
    </Card>
    <Card>
      <View style={u.row}><Ionicons name="keypad-outline" size={20} color={colors.primary}/><Heading style={{fontSize:17}}>{t('stitch.security')}</Heading></View><View style={u.divider}/><Copy style={u.muted}>{t(answer?'stitch.pinHint':'stitch.chooseAnswer')}</Copy>
      <View accessibilityLabel={`${pin.length} PIN digits entered`} style={s.pinDots}>{Array.from({length:6},(_,i)=><View key={i} style={[s.dot,i<pin.length && s.filledDot]}/>)}</View>
      <View style={s.keypad}>{['1','2','3','4','5','6','7','8','9','clear','0','delete'].map(key=><Pressable key={key} accessibilityRole="button" accessibilityLabel={key==='clear'?t('stitch.clear'):key==='delete'?t('stitch.backspace'):key} disabled={!answer || expired} onPress={()=>setPin(value=>key==='clear'?'':key==='delete'?value.slice(0,-1):value.length<6?value+key:value)} style={({pressed})=>[s.key,{opacity:!answer||expired?0.5:pressed?0.7:1}]}>{key==='delete'?<Ionicons name="backspace-outline" size={20} color={colors.primary}/>:<Copy style={[s.keyText,key==='clear'&&{fontSize:12,color:colors.textMuted}]}>{key==='clear'?t('stitch.clear'):key}</Copy>}</Pressable>)}</View>
      {answer && <Action label={t(answer==='yes'?'stitch.authorize':'stitch.refuse')} disabled={pin.length<4||expired} onPress={()=>{if(runtime.isDemo){setSubmitted(true);setPin('');}}} icon="lock-open-outline"/>}
      <Notice icon="shield-checkmark-outline" tone="warning">{t('stitch.validity')}</Notice>
    </Card>
    <Pressable accessibilityRole="button" onPress={()=>setMissing(true)}><View style={[u.inset,u.row]}><Ionicons name="medical" size={23} color={colors.danger}/><View style={{flex:1}}><Copy style={u.muted}>{t('stitch.missingHint')}</Copy><Label style={{color:colors.danger}}>{t('stitch.reportMissing')}</Label></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted}/></View></Pressable>
    {missing&&<Notice>{t('stitch.missingUnavailable')}</Notice>}
    <Copy style={{fontSize:11,color:colors.textMuted,textAlign:'center'}}>{t('stitch.preview')}</Copy>
  </StitchPage>;
}
const s=StyleSheet.create({warningIcon:{width:38,height:38,backgroundColor:colors.warningBackground,borderWidth:1,borderColor:'#FFDF94',borderRadius:20,alignItems:'center',justifyContent:'center'},deadline:{borderWidth:1,borderColor:'#FFBFB8',borderRadius:6,backgroundColor:colors.dangerBackground,padding:12,gap:8},pinDots:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:6,minHeight:48,flexDirection:'row',gap:12,justifyContent:'center',alignItems:'center'},dot:{height:13,width:13,borderRadius:7,borderWidth:2,borderColor:colors.border,backgroundColor:'white'},filledDot:{backgroundColor:colors.primary,borderColor:colors.primary},keypad:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{width:'31.5%',flexGrow:1,minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:6,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},keyText:{fontSize:20,lineHeight:28,fontWeight:'700'}});
