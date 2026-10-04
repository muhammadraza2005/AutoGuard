import { Text, type TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Props = TextProps & { variant?: keyof typeof typography };

export function AppText({ variant = 'body', style, ...props }: Props) {
  return <Text {...props} style={[styles.base, typography[variant], style]} />;
}

const styles = StyleSheet.create({ base: { color: colors.text } });

