import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
        styles.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ card: { borderWidth: StyleSheet.hairlineWidth, padding: 16 } });
