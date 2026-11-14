import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarSilhouette } from '@/components/three/CarSilhouette';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { money } from '@/lib/format';
import { useBookingStore } from '@/store/booking';
import { alpha, useTheme } from '@/theme/ThemeProvider';

function Confetti({ color, i }: { color: string; i: number }) {
  const { width } = useWindowDimensions();
  const y = useSharedValue(-40);
  const r = useSharedValue(0);
  const x = ((i * 97) % width) - width / 2;
  useEffect(() => {
    y.value = withDelay(i * 35, withTiming(900, { duration: 2200 + (i % 5) * 300, easing: Easing.in(Easing.quad) }));
    r.value = withRepeat(withTiming(360, { duration: 900 }), -1);
  }, [i, r, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x }, { translateY: y.value }, { rotate: `${r.value}deg` }],
  }));
  return <Animated.View style={[styles.confetti, { backgroundColor: color, height: i % 2 ? 14 : 8 }, style]} />;
}

export default function Success() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useBookingStore((s) => s.trips.find((t) => t.id === id));
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 140 });
    pulse.value = withDelay(500, withRepeat(withSequence(withTiming(1.25, { duration: 900 }), withTiming(1, { duration: 900 })), -1));
  }, [pulse, scale]);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value - 0.5 }));

  const palette = [colors.primary, colors.accent, '#FFD23F', '#FF5A8A', '#FFFFFF'];

  return (
    <Screen>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ alignItems: 'center' }}>
          {Array.from({ length: 36 }, (_, i) => (
            <Confetti key={i} i={i} color={palette[i % palette.length]} />
          ))}
        </View>
      </View>

      <View style={[styles.body, { padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={{ alignItems: 'center', gap: 20, marginTop: 60 }}>
          <View style={styles.checkWrap}>
            <Animated.View style={[styles.halo, { backgroundColor: alpha(colors.accent, 0.25) }, haloStyle]} />
            <Animated.View style={[styles.check, { backgroundColor: colors.accent }, checkStyle]}>
              <Ionicons name="checkmark" size={56} color={colors.background} />
            </Animated.View>
          </View>
          <Animated.View entering={FadeInDown.delay(300)} style={{ alignItems: 'center', gap: 6 }}>
            <Text variant="h1">You're all set!</Text>
            <Text muted style={{ textAlign: 'center' }}>Booking {id} is confirmed.{'\n'}We've sent the details to your email.</Text>
          </Animated.View>
        </View>

        {trip && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Card style={{ alignItems: 'center', gap: 10 }}>
              <CarSilhouette bodyStyle={trip.vehicle.bodyStyle} color={trip.color} width={200} />
              <Text variant="h3">{trip.vehicle.make} {trip.vehicle.model}</Text>
              <Text variant="small" muted>
                {format(new Date(trip.start), 'd MMM')} → {format(new Date(trip.end), 'd MMM')} · {trip.pickup}
              </Text>
              <Text variant="h2" color={colors.accent}>{money(trip.total)}</Text>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(700)} style={{ gap: 10 }}>
          <Button title="View my trips" onPress={() => router.replace('/(tabs)/trips')} />
          <Button title="Back to explore" variant="ghost" onPress={() => router.replace('/(tabs)')} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'space-between' },
  checkWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  check: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute', top: 0, width: 8, borderRadius: 2 },
});
