import Ionicons from '@expo/vector-icons/Ionicons';
import { differenceInCalendarDays, format } from 'date-fns';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CarSilhouette } from '@/components/three/CarSilhouette';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { money } from '@/lib/format';
import { useBookingStore } from '@/store/booking';
import { alpha, useTheme } from '@/theme/ThemeProvider';

export default function Trips() {
  const trips = useBookingStore((s) => s.trips);
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130, gap: spacing.md, flexGrow: 1 }}
        ListHeaderComponent={<Text variant="h1" style={{ marginBottom: spacing.sm }}>My trips</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: alpha(colors.primary, 0.15) }]}>
              <Ionicons name="car-sport" size={44} color={colors.primary} />
            </View>
            <Text variant="h2">No trips yet</Text>
            <Text muted style={{ textAlign: 'center' }}>Your upcoming and past rentals will appear here.</Text>
            <Button title="Find a car" onPress={() => router.navigate('/(tabs)')} style={{ alignSelf: 'stretch', marginTop: 12 }} />
          </View>
        }
        renderItem={({ item, index }) => {
          const daysAway = differenceInCalendarDays(new Date(item.start), new Date());
          return (
            <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
              <Card style={{ gap: 12 }}>
                <View style={styles.row}>
                  <View style={[styles.badge, { backgroundColor: alpha(colors.accent, 0.15) }]}>
                    <Text variant="tiny" color={colors.accent}>{item.status.toUpperCase()}</Text>
                  </View>
                  <Text variant="small" muted>{item.id}</Text>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="h3">{item.vehicle.make} {item.vehicle.model}</Text>
                    <Text variant="small" muted>{format(new Date(item.start), 'EEE d MMM')} → {format(new Date(item.end), 'EEE d MMM')}</Text>
                    <Text variant="small" muted>📍 {item.pickup}</Text>
                  </View>
                  <CarSilhouette bodyStyle={item.vehicle.bodyStyle} color={item.color} width={110} />
                </View>
                <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: 12 }]}>
                  <Text variant="small" color={colors.accent}>
                    {daysAway > 0 ? `Starts in ${daysAway} day${daysAway > 1 ? 's' : ''}` : 'Starts today'}
                  </Text>
                  <Text variant="h3">{money(item.total)}</Text>
                </View>
              </Card>
            </Animated.View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
