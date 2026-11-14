import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, StyleSheet, View } from 'react-native';
import { VehicleCard } from '@/components/VehicleCard';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useVehicles } from '@/data/api';
import { useBookingStore } from '@/store/booking';
import { alpha, useTheme } from '@/theme/ThemeProvider';

export default function Favorites() {
  const favorites = useBookingStore((s) => s.favorites);
  const { data = [] } = useVehicles();
  const { colors, spacing } = useTheme();
  const saved = data.filter((v) => favorites.includes(v.id));

  return (
    <Screen>
      <FlatList
        data={saved}
        keyExtractor={(v) => v.id}
        renderItem={({ item, index }) => <VehicleCard vehicle={item} index={index} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130, gap: spacing.md, flexGrow: 1 }}
        ListHeaderComponent={<Text variant="h1" style={{ marginBottom: spacing.sm }}>Saved</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.icon, { backgroundColor: alpha('#FF4D6D', 0.15) }]}>
              <Ionicons name="heart" size={40} color="#FF4D6D" />
            </View>
            <Text variant="h2">Nothing saved yet</Text>
            <Text muted style={{ textAlign: 'center' }}>Tap the heart on any car to keep it here.</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  icon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
