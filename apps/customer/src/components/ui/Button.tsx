import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { alpha, useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { colors, radius } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[{ borderRadius: radius.pill, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={isPrimary ? [colors.primary, alpha(colors.primary, 0.75)] : [colors.surfaceAlt, colors.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.btn,
          { borderRadius: radius.pill, borderColor: isPrimary ? alpha(colors.accent, 0.35) : colors.border },
          isPrimary && { shadowColor: colors.primary },
        ]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text variant="h3" color={isPrimary ? '#fff' : colors.text}>{title}</Text>}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
