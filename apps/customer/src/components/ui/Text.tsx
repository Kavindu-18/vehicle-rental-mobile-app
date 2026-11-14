import { Text as RNText, type TextProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny';

export function Text({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const { colors, font } = useTheme();
  return (
    <RNText
      {...rest}
      style={[font[variant], { color: color ?? (muted ? colors.muted : colors.text) }, style]}
    />
  );
}
