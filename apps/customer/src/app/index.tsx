import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarViewer } from '@/components/three/CarViewer';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { BodyStyle } from '@/data/types';
import { brand } from '@/theme/brand';
import { alpha, useTheme } from '@/theme/ThemeProvider';

const SEEN_KEY = 'onboarding-seen';

const SLIDES: { title: string; body: string; body3d: BodyStyle; color: string }[] = [
  { title: 'Pick your ride\nin full 3D', body: 'Spin, zoom and repaint every car before you book. What you see is what you drive.', body3d: 'sport', color: '#C1121F' },
  { title: 'Booked in\n60 seconds', body: 'Choose dates, add a driver or insurance, pay securely with PayHere. Done.', body3d: 'sedan', color: '#C9CCD3' },
  { title: 'Delivered to\nyour door', body: 'Track your car live as it arrives — anywhere from Colombo to Ella.', body3d: 'suv', color: '#4A5A3C' },
];

export default function Onboarding() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [seen, setSeen] = useState<boolean | null>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY).then((v) => setSeen(v === '1')).catch(() => setSeen(false));
  }, []);

  if (seen === null) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (seen) return <Redirect href="/(tabs)" />;

  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  const finish = async () => {
    await AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ height: height * 0.58 }}>
        <CarViewer bodyStyle={slide.body3d} color={slide.color} accent={colors.accent} wheelSpeed={2} />
        <LinearGradient colors={['transparent', colors.background]} style={styles.fade} pointerEvents="none" />
        <Animated.View entering={FadeIn.delay(300)} style={[styles.brand, { top: insets.top + 12 }]}>
          <Text variant="h3">{brand.name}</Text>
          <Pressable onPress={finish} hitSlop={12}>
            <Text variant="small" muted>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>

      <View style={[styles.copy, { paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <Animated.View key={i} entering={FadeInDown.springify().damping(18)} exiting={FadeOutUp.duration(150)}>
          <Text variant="hero">{slide.title}</Text>
          <Text muted style={{ marginTop: 14, lineHeight: 22 }}>{slide.body}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={{ gap: 24 }}>
          <View style={styles.dots}>
            {SLIDES.map((_, d) => (
              <View
                key={d}
                style={[
                  styles.dot,
                  { backgroundColor: d === i ? colors.accent : alpha(colors.text, 0.2), width: d === i ? 28 : 8 },
                ]}
              />
            ))}
          </View>
          <Button title={last ? `Start with ${brand.name}` : 'Next'} onPress={() => (last ? finish() : setI(i + 1))} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  brand: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copy: { flex: 1, justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
});
