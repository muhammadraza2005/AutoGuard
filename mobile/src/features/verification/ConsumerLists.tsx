import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';

export function AlertsScreen() {
  const {t}=useTranslation(); const router=useRouter();
  return <StitchPage><View style={{gap:4}}><Heading>{t('alerts.title')}</Heading><Copy style={u.muted}>{t('stitch.alertsBody')}</Copy></View>{['req-1','req-2'].map((id,i)=><Card key={id} style={i===0?{borderColor:'#FFDF94'}:undefined}><View style={u.between}><View style={u.row}><Ionicons name={i===0?'warning-outline':'time-outline'} size={20} color={i===0?colors.warning:colors.textMuted}/><Label>{t(i===0?'stitch.newAlert':'stitch.expired')}</Label></View>{i===0&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:colors.accent}}/>}</View><View style={u.inset}><Label style={{fontSize:16,letterSpacing:1}}>1842AA10</Label><Copy style={u.muted}>Toyota Land Cruiser Prado (2020)</Copy><Copy style={{fontSize:12,color:colors.textMuted}}>#{i===0?'REQ-88219':'REQ-88104'}</Copy></View><Action secondary={i>0} label={t('stitch.viewRequest')} icon="arrow-forward" onPress={()=>router.push({pathname:'/(consumer)/alert-detail',params:{id}})}/></Card>)}</StitchPage>;
}
export function VehiclesScreen() {
  const {t}=useTranslation(); const router=useRouter();
  return <StitchPage><View style={{gap:4}}><Heading>{t('vehicles.title')}</Heading><Copy style={u.muted}>{t('stitch.vehiclesBody')}</Copy></View>{[{id:'1',plate:'1842AA10',name:'Toyota Land Cruiser Prado (2020)'},{id:'2',plate:'9876CD02',name:'Ford Ranger (2021)'}].map((v,i)=><Pressable key={v.id} accessibilityRole="button" onPress={()=>router.push({pathname:'/(consumer)/vehicle-detail',params:{id:v.id}})}><Card><View style={u.between}><View style={u.row}><View style={{width:40,height:40,borderRadius:6,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'}}><Ionicons name="car-outline" size={25} color={colors.primary}/></View><Label style={{fontSize:18,letterSpacing:1}}>{v.plate}</Label></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted}/></View><Copy>{v.name}</Copy><View style={u.divider}/><View style={[u.between,{flexWrap:'wrap'}]}><Copy style={[u.badge,{backgroundColor:i===0?colors.warningBackground:'#E5EEFF',borderColor:i===0?'#FFDF94':'#B2C7EE',color:i===0?colors.warning:colors.primary}]}>{t(i===0?'stitch.notForSale':'stitch.forSale')}</Copy><Copy style={{fontSize:11,color:i===0?colors.success:colors.danger}}>{t('stitch.subscription')}: {t(i===0?'stitch.active':'stitch.overdue')}</Copy></View></Card></Pressable>)}</StitchPage>;
}
