import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HostBadge } from '@/components/HostBadge';
import { VehicleCard } from '@/components/VehicleCard';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useHost } from '@/data/api';
import { useTheme } from '@/theme/ThemeProvider';

export default function HostProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { host, listings } = useHost(id);
  const { colors, spacing } = useTheme();
  const router = useRouter();

  if (!host) return <Screen><View /></Screen>;

  const header = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.md }}>
      <PressableScale onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </PressableScale>

      <Animated.View entering={FadeInDown.springify()} style={{ gap: 14 }}>
        <HostBadge host={host} size="lg" />
        <Text muted style={{ lineHeight: 22 }}>{host.bio}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.stats}>
        {[
          { label: 'Rating', value: `★ ${host.rating.toFixed(2)}` },
          { label: 'Reviews', value: String(host.reviewCount) },
          { label: 'Responds', value: host.responseMinutes ? `${host.responseMinutes} min` : '—' },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text variant="h3" color={colors.accent}>{s.value}</Text>
            <Text variant="tiny" muted>{s.label.toUpperCase()}</Text>
          </Card>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).springify()}>
        <Card style={{ gap: 8 }}>
          {[
            host.verified ? ['shield-checkmark', host.kind === 'company' ? 'Business registration verified' : 'Identity verified'] : ['time', 'Verification in progress'],
            ['location', `Based in ${host.city}`],
            ['chatbubbles', 'Message the host after booking'],
          ].map(([icon, label]) => (
            <View key={label} style={styles.trust}>
              <Ionicons name={icon as never} size={18} color={colors.accent} />
              <Text variant="small">{label}</Text>
            </View>
          ))}
        </Card>
      </Animated.View>

      <Text variant="h2">{listings.length} car{listings.length === 1 ? '' : 's'} available</Text>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={listings}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => <VehicleCard vehicle={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  stats: { flexDirection: 'row', gap: 10 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
});
