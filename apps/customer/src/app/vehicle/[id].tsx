import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HostBadge } from '@/components/HostBadge';
import { CarViewer } from '@/components/three/CarViewer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useVehicle } from '@/data/api';
import { money } from '@/lib/format';
import { useBookingStore } from '@/store/booking';
import { alpha, useTheme } from '@/theme/ThemeProvider';

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: v } = useVehicle(id);
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [colorIdx, setColorIdx] = useState(0);
  const favorite = useBookingStore((s) => (id ? s.favorites.includes(id) : false));
  const toggleFavorite = useBookingStore((s) => s.toggleFavorite);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const stageH = height * 0.48;
  // parallax: the 3D stage scrolls at ~half speed and fades as content slides over it
  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, stageH], [0, stageH * 0.45], 'clamp') }],
    opacity: interpolate(scrollY.value, [0, stageH * 0.8], [1, 0.2], 'clamp'),
  }));

  if (!v) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  const paint = v.colors[colorIdx];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={[alpha(paint, 0.35), colors.background]} style={[StyleSheet.absoluteFill, { height: stageH }]} />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* 3D stage lives inside the scroll so it receives drag/pinch; horizontal drags rotate, vertical scrolls */}
        <Animated.View style={[{ height: stageH, paddingTop: insets.top + 30 }, stageStyle]}>
          <CarViewer bodyStyle={v.bodyStyle} color={paint} accent={colors.accent} />
        </Animated.View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, backgroundColor: colors.background, paddingTop: spacing.sm }}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text variant="tiny" color={colors.accent}>{v.make.toUpperCase()} · {v.year}</Text>
              <Text variant="h1">{v.model}</Text>
              <Text variant="small" muted>★ {v.rating.toFixed(2)} · {v.trips} trips · {v.location}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Text variant="small" muted style={{ marginBottom: 10 }}>Paint · drag the car to rotate, pinch to zoom</Text>
            <View style={styles.swatches}>
              {v.colors.map((c, i) => (
                <PressableScale
                  key={c}
                  onPress={() => setColorIdx(i)}
                  style={[
                    styles.swatchRing,
                    { borderColor: i === colorIdx ? colors.accent : 'transparent' },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: c, borderColor: colors.border }]} />
                </PressableScale>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {[
                { icon: 'flash', label: 'Power', value: v.specs.power },
                { icon: 'speedometer', label: 'Top speed', value: v.specs.topSpeed },
                { icon: 'water', label: 'Economy', value: v.specs.economy },
                { icon: 'people', label: 'Seats', value: `${v.seats}` },
                { icon: 'briefcase', label: 'Luggage', value: v.specs.luggage },
                { icon: 'cog', label: 'Gearbox', value: v.transmission },
              ].map((s) => (
                <Card key={s.label} style={{ width: 112, gap: 6, padding: 14 }}>
                  <Ionicons name={s.icon as never} size={18} color={colors.accent} />
                  <Text variant="tiny" muted>{s.label.toUpperCase()}</Text>
                  <Text variant="h3" numberOfLines={1}>{s.value}</Text>
                </Card>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280).springify()}>
            <Text variant="h2" style={{ marginBottom: 12 }}>Highlights</Text>
            <View style={styles.features}>
              {v.features.map((f) => (
                <View key={f} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  <Text variant="small">{f}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <Text variant="h2" style={{ marginBottom: 12 }}>Hosted by</Text>
            <PressableScale
              scaleTo={0.98}
              onPress={() => router.push({ pathname: '/host/[id]', params: { id: v.host.id } })}
            >
              <Card style={{ gap: 12 }}>
                <View style={styles.hostTop}>
                  <HostBadge host={v.host} size="lg" />
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
                {!!v.host.responseMinutes && (
                  <Text variant="small" muted>⚡ Usually responds within {v.host.responseMinutes} min</Text>
                )}
                <Text variant="small" muted numberOfLines={2}>{v.host.bio}</Text>
              </Card>
            </PressableScale>
          </Animated.View>

          <Card style={{ gap: 8 }}>
            <Text variant="h3">Rental terms</Text>
            <Text variant="small" muted>Refundable deposit {money(v.deposit)} · 200 km/day included · Free cancellation up to 24h before pickup · Valid Sri Lankan or international licence required.</Text>
          </Card>
        </View>
      </Animated.ScrollView>

      {/* floating top controls */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} style={[styles.round, { backgroundColor: alpha(colors.surface, 0.8), borderColor: colors.border }]}>
          <Ionicons name="chevron-down" size={22} color={colors.text} />
        </PressableScale>
        <PressableScale
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toggleFavorite(v.id);
          }}
          style={[styles.round, { backgroundColor: alpha(colors.surface, 0.8), borderColor: colors.border }]}
        >
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? '#FF4D6D' : colors.text} />
        </PressableScale>
      </View>

      {/* sticky price + CTA */}
      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={[styles.cta, { paddingBottom: insets.bottom + 12, backgroundColor: alpha(colors.background, 0.96), borderColor: colors.border }]}
      >
        <View>
          <Text variant="h2">{money(v.dailyRate)}</Text>
          <Text variant="small" muted>per day · taxes incl.</Text>
        </View>
        <Button
          title="Book now"
          style={{ flex: 1, marginLeft: 20 }}
          onPress={() => router.push({ pathname: '/booking/[id]', params: { id: v.id, color: paint } })}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  hostTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swatches: { flexDirection: 'row', gap: 10 },
  swatchRing: { padding: 3, borderRadius: 24, borderWidth: 2 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  topBar: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
