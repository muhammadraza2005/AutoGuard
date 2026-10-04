import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';
import { runtime } from '@/config/runtime';
import { useSession } from './SessionProvider';
import { sections, type AppSection } from './access';

const routes={consumer:'/(consumer)',agent:'/agent',institutional:'/institutional',administration:'/administration'} as const;
export default function AccountScreen({section='consumer'}:{section?:AppSection}) {
  const {t,i18n}=useTranslation(); const router=useRouter(); const {setPreviewSection}=useSession(); const [notice,setNotice]=useState(false);
  return <StitchPage><Heading>{t('account.title')}</Heading><Card><View style={u.row}><View style={{width:44,height:44,borderRadius:6,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'}}><Ionicons name="person-outline" size={25} color={colors.primary}/></View><View><Label>{t('navigation.'+section)}</Label><Copy style={{fontSize:12,color:colors.textMuted}}>{t('stitch.preview')}</Copy></View></View></Card><Label>{t('stitch.preferences')}</Label><Card><View style={u.between}><Label>{t('stitch.language')}</Label><View style={u.row}>{['en','fr'].map(lang=><Pressable accessibilityRole="button" key={lang} onPress={()=>void i18n.changeLanguage(lang)} style={{minWidth:48,minHeight:40,alignItems:'center',justifyContent:'center',borderRadius:4,backgroundColor:i18n.language===lang?colors.primary:colors.surface}}><Label style={{color:i18n.language===lang?'white':colors.primary}}>{lang.toUpperCase()}</Label></Pressable>)}</View></View><View style={u.divider}/><View style={u.between}><Copy style={u.muted}>{t('stitch.phoneLabel')}</Copy><Label>+243 000 000 000</Label></View><Copy style={{fontSize:12,color:colors.textMuted}}>{t('stitch.phoneChange')}</Copy></Card>
    {section==='consumer'&&<><Label>{t('stitch.delegation')}</Label><Card>{['backupContacts','sellers'].map((key,i)=><View key={key}>{i>0&&<View style={u.divider}/>}<Pressable accessibilityRole="button" onPress={()=>setNotice(true)} style={[u.between,{minHeight:48}]}><Copy>{t('stitch.'+key)}</Copy><Ionicons name="chevron-forward" size={18} color={colors.textMuted}/></Pressable></View>)}</Card></>}
    {notice&&<Notice>{t('stitch.integrationNeeded')}</Notice>}
    {runtime.isDemo&&<><Label>{t('account.previewRole')}</Label><Copy style={{fontSize:12,color:colors.textMuted}}>{t('account.previewHelp')}</Copy><Card>{sections.map((target,i)=><View key={target}>{i>0&&<View style={u.divider}/>}<Pressable accessibilityRole="button" onPress={()=>{setPreviewSection(target);router.push(routes[target]);}} style={[u.between,{minHeight:48}]}><Label>{t('navigation.'+target)}</Label><Ionicons name="chevron-forward" size={18} color={colors.textMuted}/></Pressable></View>)}<Action secondary label={t('stitch.protect')} onPress={()=>router.push('/welcome')}/></Card></>}
    <Action secondary label={t('stitch.signOut')} icon="log-out-outline" onPress={()=>router.replace('/welcome')}/>
  </StitchPage>;
}
