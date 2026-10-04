import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';

export default function DashboardScreen() {
  const {t}=useTranslation(); const labels=t('stitch.metrics',{returnObjects:true}) as string[];
  return <StitchPage><View style={{gap:4}}><Heading>{t('stitch.dashboard')}</Heading><Copy style={u.muted}>{t('stitch.dashboardBody')}</Copy></View><View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{['1,204','583','12','45'].map((value,i)=><Card key={value} style={{width:'48%',flexGrow:1,borderTopWidth:3,borderTopColor:i===2?colors.danger:colors.primary}}><Ionicons name={(['car-outline','search-outline','warning-outline','cube-outline'] as const)[i]} size={23} color={i===2?colors.danger:colors.primary}/><Heading style={{fontSize:27,lineHeight:32}}>{value}</Heading><Copy style={{fontSize:12,color:colors.textMuted}}>{labels[i]}</Copy></Card>)}</View><Heading style={{fontSize:17}}>{t('stitch.recent')}</Heading><Card>{['duplicate','syncFailure'].map((key,i)=><View key={key} style={{gap:10}}>{i>0&&<View style={u.divider}/>}<View style={u.row}><Ionicons name="warning-outline" size={20} color={i===0?colors.danger:colors.warning}/><Label>{t('stitch.'+key)}</Label></View><Copy style={{fontSize:11,color:colors.textMuted}}>#{i===0?'INC-0042':'SYNC-0017'}</Copy></View>)}</Card><Copy style={{fontSize:11,color:colors.textMuted,textAlign:'center'}}>{t('stitch.preview')}</Copy></StitchPage>;
}
export function UsersScreen() {
  const {t}=useTranslation(); const [query,setQuery]=useState(''); const [notice,setNotice]=useState(false);
  const users=[{name:t('navigation.agent'),org:'Example enrollment organization'},{name:t('navigation.institutional'),org:'Example registry organization'}];
  return <StitchPage><Heading>{t('stitch.users')}</Heading><Copy style={u.muted}>{t('stitch.staff')}</Copy><View style={[u.inset,u.row]}><Ionicons name="search-outline" size={18} color={colors.textMuted}/><TextInput accessibilityLabel={t('stitch.searchUsers')} style={{flex:1,minHeight:32,fontFamily:'PublicSans-Regular',fontSize:14,color:colors.primary}} value={query} onChangeText={setQuery} placeholder={t('stitch.searchUsers')}/></View>{users.filter(user=>user.name.toLowerCase().includes(query.toLowerCase())).map(user=><Card key={user.name}><View style={u.row}><Ionicons name="person-outline" size={22} color={colors.primary}/><Label>{user.name}</Label></View><View style={u.divider}/><Copy style={u.muted}>{user.org}</Copy></Card>)}<Action label={t('stitch.addUser')} icon="add-outline" onPress={()=>setNotice(true)}/>{notice&&<Notice>{t('stitch.integrationNeeded')}</Notice>}</StitchPage>;
}
