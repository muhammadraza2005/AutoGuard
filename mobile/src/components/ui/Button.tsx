import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { AppText } from './AppText';
import { colors, radius } from '@/theme/tokens';

type Props = PressableProps & { label: string; variant?: 'primary' | 'secondary' };

export function Button({ label, variant = 'primary', disabled, style, ...props }: Props) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        { opacity: disabled ? 0.45 : state.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText variant="label" style={{ color: variant === 'primary' ? colors.background : colors.primary, textAlign: 'center' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.button, borderWidth: 1 },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.background, borderColor: colors.border },
});
