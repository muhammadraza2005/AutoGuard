import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, Progress, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';
import { runtime } from '@/config/runtime';

export default function CheckScreen() {
  const {sealCode}=useLocalSearchParams<{sealCode?:string}>();
  return <CheckContent key={sealCode??'plate'} sealCode={sealCode}/>;
}
function CheckContent({sealCode}:{sealCode?:string}) {
  const { t } = useTranslation(); const router = useRouter();
  const [mode,setMode] = useState<'plate'|'vin'|'seal'>(sealCode?'seal':'plate');
  const [identifier,setIdentifier] = useState(sealCode??(runtime.isDemo ? '1842AA10' : ''));
  const [result,setResult] = useState(runtime.isDemo&&!sealCode); const [refreshed,setRefreshed] = useState(false);
  return <StitchPage>
    <View style={{gap:4}}><Heading>{t('check.title')}</Heading><Copy style={u.muted}>{t('check.description')}</Copy></View>
    <Card>
      <View style={s.selector}>{(['plate','vin','seal'] as const).map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{selected:mode===item}} style={[s.tab,mode===item && s.selected]} onPress={() => {setMode(item);setResult(false);if(item==='seal') router.push('/(consumer)/scan-qr');}}>{item==='seal' && <Ionicons name="qr-code-outline" size={13} color={mode===item?'white':colors.textMuted} />}<Copy style={[s.tabLabel,mode===item && s.selectedText]}>{t(`stitch.${item==='seal'?'qr':item}`)}</Copy></Pressable>)}</View>
      <View style={{gap:8}}><Label>{t('stitch.identifier')}</Label><View style={s.inputRow}><TextInput accessibilityLabel={t('stitch.identifier')} value={identifier} onChangeText={value=>{setIdentifier(value.toUpperCase());setResult(false);setRefreshed(false);}} autoCapitalize="characters" style={s.input} placeholder={mode==='vin'?'JTEBU5JR8K5099241':mode==='seal'?'AG-KIN-88219':'1842AA10'} placeholderTextColor={colors.textMuted} /><Pressable accessibilityRole="button" accessibilityLabel={t('stitch.clear')} style={s.clear} onPress={()=>{setIdentifier('');setResult(false);}}><Ionicons name="close-circle-outline" size={19} color="#8A9DB6" /></Pressable></View>
        <View style={u.between}><Copy style={[s.hint,{flex:1}]}>{t('stitch.identifierHint')}</Copy><Pressable accessibilityRole="button" style={{minHeight:40,justifyContent:'center',flex:1}} onPress={()=>{setMode('seal');setIdentifier('');setResult(false);}}><Copy style={[s.hint,{textDecorationLine:'underline',textAlign:'right',color:colors.primary}]}>{t('stitch.manual')}</Copy></Pressable></View>
      </View>
      <Action label={t('stitch.check')} icon="search-outline" disabled={identifier.trim().length<4} onPress={()=>{if(runtime.isDemo) {setResult(true);setRefreshed(false);} else router.push({pathname:'/(consumer)/fee-summary',params:{type:mode,id:identifier}});}} />
      {runtime.isDemo && <View style={[u.inset,u.between,{backgroundColor:'#F8F9FF'}]}><View style={u.row}><Ionicons name="cash-outline" size={17} color={colors.primary}/><View><Copy style={s.hint}>{t('stitch.fee')}</Copy><Label>$2.00</Label></View></View><Copy style={s.quota}>{t('stitch.quota')}</Copy></View>}
    </Card>
    {result && runtime.isDemo && <Card>
      <View style={u.between}><View style={{gap:4,flex:1}}><Label style={{color:colors.textMuted,letterSpacing:1,fontSize:11}}>{t('stitch.activeQuery')}</Label><Label style={{fontSize:15,letterSpacing:1}}>Plate: {identifier}</Label></View><Copy style={u.badge}>● {t('stitch.inProgress')}</Copy></View>
      <Copy>Toyota Land Cruiser Prado (2020)</Copy><View style={u.divider}/>
      <View style={s.status}><View style={u.row}><Ionicons name="warning-outline" size={22} color={colors.warning}/><Label style={{color:colors.warning}}>{t('stitch.notForSale')}</Label></View><Copy>{t('stitch.notForSaleBody')}</Copy></View>
      <View style={[u.inset,u.row]}><Ionicons name="ribbon-outline" size={18} color={colors.success}/><View style={{flex:1}}><Copy style={s.hint}>{t('stitch.enrolled')}</Copy><Copy style={[s.hint,{color:'#8A9DB6'}]}>({t('stitch.recordOnly')})</Copy></View></View>
      <View style={[u.inset,{backgroundColor:'#F8F9FF',gap:12}]}><View style={u.between}><View style={[u.row,{flex:1}]}><Ionicons name="hourglass-outline" size={19} color="#DA7B00"/><Label style={{flex:1}}>{t('stitch.waiting')}</Label></View><Copy style={s.time}>04:32 {t('stitch.remaining')}</Copy></View><Progress value={45}/><View style={s.silence}><Copy style={{fontWeight:'600'}}>{t('stitch.silence')}</Copy></View><View style={u.row}><Ionicons name="checkmark-circle-outline" size={15} color={colors.success}/><Copy style={[s.hint,{color:colors.success,flex:1}]}>{t('stitch.notified')}</Copy></View><View style={u.row}><Ionicons name="time-outline" size={15} color="#8A9DB6"/><Copy style={[s.hint,{flex:1}]}>{t('stitch.backup')}</Copy></View></View>
      <Notice tone="danger" icon="shield-half-outline">{t('stitch.safety')}</Notice>
      <Action secondary label={t(refreshed?'stitch.refreshed':'stitch.refresh')} icon="refresh-outline" onPress={()=>setRefreshed(true)} style={{borderColor:colors.primary,borderWidth:2}}/>
      <Action secondary label={t('stitch.receipt')} icon="receipt-outline" onPress={()=>router.push({pathname:'/(consumer)/fee-summary',params:{type:mode,id:identifier}})}/>
      <Pressable accessibilityRole="button" onPress={()=>setResult(false)} style={{alignItems:'center',minHeight:40,justifyContent:'center'}}><Copy style={u.muted}>{t('stitch.cancel')}</Copy></Pressable>
    </Card>}
    {runtime.isDemo && <Copy style={s.preview}>{t('stitch.preview')}</Copy>}
  </StitchPage>;
}
const s=StyleSheet.create({selector:{flexDirection:'row',padding:4,gap:3,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:6},tab:{flex:1,minHeight:40,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:4,padding:3,borderRadius:4},selected:{backgroundColor:colors.primary},tabLabel:{fontSize:11,lineHeight:16,color:colors.textMuted,textAlign:'center'},selectedText:{color:'white',fontWeight:'600'},inputRow:{flexDirection:'row',borderWidth:1,borderColor:colors.border,borderRadius:6,alignItems:'center'},input:{flex:1,minHeight:48,paddingHorizontal:12,fontFamily:'PublicSans-Bold',fontSize:16,letterSpacing:1.5,color:colors.primary},clear:{width:40,minHeight:48,alignItems:'center',justifyContent:'center'},hint:{fontSize:11,lineHeight:17,color:colors.textMuted},quota:{fontSize:11,lineHeight:16,backgroundColor:'#E5EEFF',borderColor:'#B2C7EE',borderWidth:1,borderRadius:24,paddingVertical:6,paddingHorizontal:10,maxWidth:'59%'},status:{borderWidth:1,borderColor:'#F4C542',backgroundColor:colors.warningBackground,borderRadius:6,padding:12,gap:10},time:{backgroundColor:colors.warningBackground,borderWidth:1,borderColor:'#FFDF94',color:colors.warning,padding:6,borderRadius:4,fontSize:12,lineHeight:18,maxWidth:106,fontWeight:'600'},silence:{borderLeftWidth:4,borderLeftColor:'#DA7B00',backgroundColor:'white',padding:8},preview:{fontSize:11,color:colors.textMuted,textAlign:'center'}});
