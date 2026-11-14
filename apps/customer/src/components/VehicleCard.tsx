import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { Vehicle } from '@/data/types';
import { money } from '@/lib/format';
import { alpha, useTheme } from '@/theme/ThemeProvider';
import { HostBadge } from './HostBadge';
import { CarSilhouette } from './three/CarSilhouette';
import { PressableScale } from './ui/PressableScale';
import { Text } from './ui/Text';

export function VehicleCard({ vehicle, index = 0 }: { vehicle: Vehicle; index?: number }) {
  const { colors, radius } = useTheme();
  const router = useRouter();
  const paint = vehicle.colors[0];
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(16)}>
      <PressableScale
        onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } })}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}
      >
        <LinearGradient
          colors={[alpha(paint === '#FFFFFF' || paint === '#F2F2F2' ? colors.primary : paint, 0.35), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
        />
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text variant="tiny" color={colors.accent}>{vehicle.category.toUpperCase()}</Text>
            <Text variant="h2" numberOfLines={1}>{vehicle.model}</Text>
            <Text variant="small" muted>{vehicle.make} · {vehicle.year}</Text>
          </View>
          <View style={[styles.rating, { backgroundColor: alpha(colors.text, 0.08) }]}>
            <Text variant="small">★ {vehicle.rating.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.car}>
          <CarSilhouette bodyStyle={vehicle.bodyStyle} color={paint} width={250} />
        </View>

        <View style={styles.bottom}>
          <View style={styles.specs}>
            {[`${vehicle.seats} seats`, vehicle.transmission, vehicle.fuel].map((s) => (
              <View key={s} style={[styles.spec, { borderColor: colors.border }]}>
                <Text variant="tiny" muted>{s}</Text>
              </View>
            ))}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="h3">{money(vehicle.dailyRate)}</Text>
            <Text variant="tiny" muted>per day</Text>
          </View>
        </View>

        <View style={[styles.hostRow, { borderColor: colors.border }]}>
          <HostBadge host={vehicle.host} />
          <Text variant="tiny" muted>📍 {vehicle.location}</Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rating: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  car: { alignItems: 'center', marginVertical: 14 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  specs: { flexDirection: 'row', gap: 6, flexShrink: 1, flexWrap: 'wrap' },
  spec: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  hostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
});
