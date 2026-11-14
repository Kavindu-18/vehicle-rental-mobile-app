import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, useTheme } from '@/theme/ThemeProvider';

/** Full-bleed screen with the brand's ambient glow in the top corner. */
export function Screen({ children, padTop = true }: { children: ReactNode; padTop?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: padTop ? insets.top : 0 }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[alpha(colors.primary, 0.28), 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
