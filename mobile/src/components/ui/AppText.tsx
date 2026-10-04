import { Text, type TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Props = TextProps & { variant?: keyof typeof typography };

export function AppText({ variant = 'body', style, ...props }: Props) {
  const flattened = StyleSheet.flatten([typography[variant], style]);
  const weight = flattened?.fontWeight;
  const fontFamily = weight === '700' || weight === '800' || weight === 'bold' ? 'PublicSans-Bold' : weight === '600' || weight === '500' ? 'PublicSans-SemiBold' : 'PublicSans-Regular';
  return <Text {...props} style={[styles.base, typography[variant], style, { fontFamily }]} />;
}

const styles = StyleSheet.create({ base: { color: colors.text } });
