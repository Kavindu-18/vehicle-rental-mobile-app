import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { HostBadge } from '@/components/HostBadge';
import { VehicleCard } from '@/components/VehicleCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useVehicles } from '@/data/api';
import { categories, hostFilters } from '@/data/demo';
import type { Host } from '@/data/types';
import { brand } from '@/theme/brand';
import { alpha, useTheme } from '@/theme/ThemeProvider';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Explore() {
  const { colors, spacing, radius } = useTheme();
  const { data: vehicles, isLoading, error } = useVehicles();
  const router = useRouter();
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [hostFilter, setHostFilter] = useState<(typeof hostFilters)[number]>('Everyone');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (vehicles ?? []).filter(
      (v) =>
        (category === 'All' || v.category === category) &&
        (hostFilter === 'Everyone' || (hostFilter === 'Companies') === (v.host.kind === 'company')) &&
        (!q || `${v.make} ${v.model} ${v.location} ${v.host.name}`.toLowerCase().includes(q)),
    );
  }, [vehicles, category, hostFilter, query]);

  const topHosts = useMemo(() => {
    const byId = new Map<string, Host & { cars: number }>();
    for (const v of vehicles ?? []) {
      const h = byId.get(v.host.id);
      byId.set(v.host.id, { ...v.host, cars: (h?.cars ?? 0) + 1 });
    }
    return [...byId.values()].sort((a, b) => b.rating - a.rating);
  }, [vehicles]);

  const header = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.md }}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.headRow}>
        <View>
          <Text muted>{greeting()} 👋</Text>
          <Text variant="h1">Find your{'\n'}perfect drive</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text variant="h3" color="#fff">{brand.name[0]}</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill }]}
      >
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search car, host or city"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        <View style={[styles.filterBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="options" size={18} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(500)}>
        <View style={[styles.promo, { backgroundColor: alpha(colors.accent, 0.12), borderColor: alpha(colors.accent, 0.4), borderRadius: radius.lg }]}>
          <View style={{ flex: 1 }}>
            <Text variant="tiny" color={colors.accent}>WEEKEND DEAL</Text>
            <Text variant="h3">15% off 3+ day rentals</Text>
            <Text variant="small" muted>Use code DRIVE15 at checkout</Text>
          </View>
          <Text style={{ fontSize: 38 }}>🏝️</Text>
        </View>
      </Animated.View>

      <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill }]}>
        {hostFilters.map((f) => (
          <PressableScale key={f} onPress={() => setHostFilter(f)} style={{ flex: 1 }}>
            <View style={[styles.segmentItem, { borderRadius: radius.pill, backgroundColor: hostFilter === f ? colors.surfaceAlt : 'transparent' }]}>
              <Text variant="small" color={hostFilter === f ? colors.text : colors.muted}>{f}</Text>
            </View>
          </PressableScale>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="h2">Top hosts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {topHosts.map((h, i) => (
            <Animated.View key={h.id} entering={FadeInRight.delay(150 + i * 60)}>
              <PressableScale
                onPress={() => router.push({ pathname: '/host/[id]', params: { id: h.id } })}
                style={[styles.hostCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
              >
                <HostBadge host={h} />
                <Text variant="tiny" muted>{h.cars} car{h.cars > 1 ? 's' : ''} · {h.city}</Text>
              </PressableScale>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {categories.map((c, i) => (
          <Animated.View key={c} entering={FadeInRight.delay(220 + i * 50)}>
            <Chip label={c} active={category === c} onPress={() => setCategory(c)} />
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.headRow}>
        <Text variant="h2">Available now</Text>
        <Text variant="small" muted>{filtered.length} cars</Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => <VehicleCard vehicle={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <Text muted style={{ textAlign: 'center', marginTop: 40 }}>
              {error ? 'Could not load vehicles. Check your connection.' : 'No cars match — try another category.'}
            </Text>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', height: 56, paddingLeft: 18, paddingRight: 6, borderWidth: 1, gap: 10 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  filterBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  promo: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1 },
  segment: { flexDirection: 'row', padding: 4, borderWidth: 1 },
  segmentItem: { height: 38, alignItems: 'center', justifyContent: 'center' },
  hostCard: { padding: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth, width: 200 },
});
