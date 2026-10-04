import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors } from '@/theme/tokens';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router/js-tabs';
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function StitchTabBar({state, descriptors, navigation, accent = false}: BottomTabBarProps & {accent?: boolean}) {
  const insets = useSafeAreaInsets();
  const hidden = ['alert-detail','fee-summary','list-for-sale','outcome','payment','vehicle-detail','waiting','scan-qr'];
  const current = state.routes[state.index].name;
  const active = current === 'alert-detail' ? 'alerts' : hidden.includes(current) ? 'index' : current;
  return <View style={[s.bar,{paddingBottom:Math.max(insets.bottom,4)}]}>{state.routes.filter(route => !hidden.includes(route.name)).map(route => {
    const {options} = descriptors[route.key];
    const selected = route.name === active;
    const color = selected ? accent ? colors.primary : colors.accent : colors.textMuted;
    return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{selected}} accessibilityLabel={options.title} onPress={() => {
      const event = navigation.emit({type:'tabPress',target:route.key,canPreventDefault:true});
      if (!event.defaultPrevented) navigation.navigate(route.name);
    }} style={[s.item,selected && s.selected,selected && accent && {backgroundColor:colors.accent}]}>
      <View>{options.tabBarIcon?.({focused:selected,color,size:21})}{route.name === 'alerts' && <View style={s.dot}><AppText style={s.dotText}>1</AppText></View>}</View>
      <AppText style={[s.label,selected && s.activeLabel,selected && accent && {color:colors.primary}]}>{options.title ?? route.name}</AppText>
    </Pressable>;
  })}</View>;
}
const s=StyleSheet.create({bar:{flexDirection:'row',justifyContent:'space-around',gap:3,padding:6,borderTopWidth:1,borderTopColor:colors.border,backgroundColor:'white'},item:{flex:1,maxWidth:100,minHeight:50,alignItems:'center',justifyContent:'center',paddingHorizontal:3,paddingVertical:4,gap:3,borderRadius:5},selected:{backgroundColor:colors.primary},label:{fontSize:10,lineHeight:14,color:colors.textMuted,textAlign:'center'},activeLabel:{color:'white',fontWeight:'600'},dot:{position:'absolute',right:-7,top:-3,backgroundColor:colors.danger,width:13,height:13,borderRadius:7,alignItems:'center',justifyContent:'center'},dotText:{fontSize:9,lineHeight:12,color:'white'}});
