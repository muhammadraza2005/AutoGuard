import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, DetailRow, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';
import { runtime } from '@/config/runtime';

export default function RegistryScreen({ clearanceOnly=false }: { clearanceOnly?: boolean }) {
  const {t}=useTranslation(); const [identifier,setIdentifier]=useState('1842AA10'); const [reason,setReason]=useState(0); const [result,setResult]=useState(runtime.isDemo); const [consumed,setConsumed]=useState(false); const [details,setDetails]=useState(false); const [receipt,setReceipt]=useState(false);
  const reasons=t('stitch.reasons',{returnObjects:true}) as string[]; const checks=t('stitch.checks',{returnObjects:true}) as string[];
  return <StitchPage>
    <Notice icon="shield-checkmark-outline"><Label>{t('stitch.audit')}</Label>{'\n'}{t('stitch.auditBody')}</Notice>
    {!clearanceOnly&&<Card><View style={u.row}><Ionicons name="clipboard-outline" size={20} color={colors.primary}/><Heading style={{fontSize:16,flex:1}}>{t('stitch.registrySearch')}</Heading></View><View style={u.divider}/><Label>{t('stitch.reason')} <Copy style={{color:colors.danger}}>*</Copy></Label><Pressable accessibilityRole="button" onPress={()=>{setReason((reason+1)%reasons.length);setResult(false);}} style={[u.inset,u.between,{minHeight:48}]}><Copy style={{flex:1}}>{reasons[reason]}</Copy><Ionicons name="chevron-down" size={16} color={colors.textMuted}/></Pressable><Label>{t('stitch.plate')} / {t('stitch.vin')}</Label><TextInput style={u.input} value={identifier} autoCapitalize="characters" onChangeText={value=>{setIdentifier(value);setResult(false);}}/><Action label={t('stitch.lookup')} icon="search-outline" disabled={!identifier.trim()} onPress={()=>{if(runtime.isDemo)setResult(true);}}/></Card>}
    {result&&<>
      {!clearanceOnly&&<Card><View style={u.between}><Label>{t('stitch.enteredRecord')}</Label><Copy style={{color:colors.warning,fontSize:10,maxWidth:100}}>{t('stitch.awaiting')}</Copy></View><View style={[u.inset,{borderLeftWidth:4,borderLeftColor:colors.accent}]}><Heading style={{fontSize:23,letterSpacing:1}}>{identifier}</Heading><Copy>Toyota Land Cruiser Prado (2020)</Copy><View style={[u.row,{flexWrap:'wrap'}]}><Copy style={u.badge}>{t('stitch.activeRecord')}</Copy><Copy style={u.badge}>{t('stitch.resale')}</Copy></View><DetailRow label={t('stitch.vin')} value="JTEBU5JR8K5099241"/><DetailRow label={t('stitch.ownerIdentity')} value={t('stitch.demoOwner')}/></View></Card>}
      <Card><View style={u.row}><Ionicons name="document-text-outline" size={20} color={colors.primary}/><Heading style={{fontSize:16,flex:1}}>{t('stitch.clearanceRequest')}</Heading></View><View style={u.inset}><DetailRow label={t('stitch.operation')} value={t('stitch.transfer')}/><DetailRow label={t('stitch.org')} value={t('stitch.demoOrg')}/></View><Label>{t('stitch.prerequisites')}</Label>{checks.map((check,i)=><View key={check} style={u.row}><Ionicons name="checkmark-circle" size={17} color={colors.success}/><Copy style={{fontSize:12,flex:1}}>{check}: <Copy style={{fontSize:12,color:colors.success}}>{t(i===2?'stitch.consent':'stitch.passed')}</Copy></Copy></View>)}
        <View style={{borderWidth:1,borderColor:'#ABD1BB',backgroundColor:colors.successBackground,borderRadius:6,padding:14,gap:10}}><View style={u.row}><Ionicons name="key-outline" size={20} color={colors.success}/><Label style={{color:colors.success}}>{t('stitch.token')}</Label></View><Copy style={{fontSize:11,color:colors.textMuted}}>{t('stitch.tokenHint')}</Copy><View style={[u.between,{backgroundColor:'white',padding:12,borderRadius:4}]}><View style={{flex:1,gap:6}}><Copy style={{fontSize:11}}>{t('stitch.tokenRef')}</Copy><Label>#CLR-9941-KSH</Label></View><Ionicons name="qr-code" size={48} color={colors.primary}/></View></View>
        <Action label={t(consumed?'stitch.consumed':'stitch.consume')} icon="checkmark-circle-outline" disabled={consumed} onPress={()=>setConsumed(true)}/><Action secondary icon="download-outline" label={t('stitch.export')} onPress={()=>setReceipt(!receipt)}/>{receipt&&<Notice>#CLR-9941-KSH · {t('stitch.tokenHint')}</Notice>}
      </Card>
    </>}
    <View style={u.between}><Heading style={{fontSize:16}}>{t('stitch.incidents')}</Heading><Ionicons name="warning-outline" size={20} color={colors.danger}/></View><Card style={{borderLeftWidth:4,borderLeftColor:colors.danger}}><Label>0941AB04</Label><Copy style={u.muted}>{t('stitch.anomaly')}</Copy><Action secondary label={t('stitch.review')} icon="chevron-forward" onPress={()=>setDetails(!details)}/>{details&&<Notice>{t('stitch.incidentDetail')}</Notice>}</Card>
    <Copy style={{fontSize:11,textAlign:'center',color:colors.textMuted}}>{t('stitch.preview')}</Copy>
  </StitchPage>;
}
