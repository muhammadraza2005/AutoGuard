import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Copy, Heading, Label, Action, Notice, Progress, StitchPage, stitchStyles as u } from '@/components/ui/Stitch';
import { colors } from '@/theme/tokens';

export function EnrollmentListScreen() {
  const {t}=useTranslation();const router=useRouter();
  return <StitchPage><Heading>{t('agent.title')}</Heading><Notice icon="file-tray-full-outline">{t('stitch.draftNotice')}</Notice><Action icon="add-circle-outline" label={t('stitch.newEnrollment')} onPress={()=>router.push('/agent/new-enrollment')}/><Label>{t('stitch.enrollmentList')}</Label>{['1842AA10','0941AB04'].map((plate,i)=><Card key={plate}><View style={u.between}><Label style={{fontSize:17,letterSpacing:1}}>{plate}</Label><Copy style={u.badge}>{t(i===0?'stitch.draft':'stitch.pending')}</Copy></View><Copy style={u.muted}>Toyota {i===0?'Land Cruiser Prado (2021)':'Hilux (2020)'}</Copy><Progress value={i===0?60:40}/><Action secondary label={t('stitch.review')} icon="arrow-forward" onPress={()=>router.push('/agent/new-enrollment')}/></Card>)}</StitchPage>;
}
export function SealStockScreen() {
  const {t}=useTranslation();const [notice,setNotice]=useState(false);
  return <StitchPage><View style={{gap:4}}><Heading>{t('stock.title')}</Heading><Copy style={u.muted}>{t('stitch.stockBody')}</Copy></View><Card style={{backgroundColor:colors.primary}}><Ionicons name="cube-outline" size={28} color={colors.accent}/><Heading style={{color:'white',fontSize:30,lineHeight:38}}>92</Heading><Copy style={{color:'white'}}>{t('stitch.available')}</Copy></Card><Label>{t('stitch.batches')}</Label>{['B-2026-KSH','B-2026-X2'].map((batch,i)=><Card key={batch}><View style={u.between}><Label>{batch}</Label><Copy style={u.badge}>{t(i===0?'stitch.active':'stitch.pending')}</Copy></View><View style={u.between}><Copy style={u.muted}>{t('stitch.remaining')}</Copy><Label>{i===0?'42 / 100':'50 / 50'}</Label></View><Progress value={i===0?42:100} color={colors.primary}/></Card>)}<Action secondary icon="warning-outline" label={t('stitch.lost')} onPress={()=>setNotice(true)}/>{notice&&<Notice>{t('stitch.integrationNeeded')}</Notice>}</StitchPage>;
}
