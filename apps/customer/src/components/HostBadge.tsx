import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import type { Host } from '@/data/types';
import { alpha, useTheme } from '@/theme/ThemeProvider';
import { Text } from './ui/Text';

/** Avatar + name + verified tick + "Company"/"Private owner" — the trust signal on every listing. */
export function HostBadge({ host, size = 'sm' }: { host: Host; size?: 'sm' | 'lg' }) {
  const { colors } = useTheme();
  const lg = size === 'lg';
  const d = lg ? 56 : 26;
  const isCompany = host.kind === 'company';
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          { width: d, height: d, borderRadius: isCompany ? d * 0.28 : d / 2, backgroundColor: isCompany ? colors.primary : alpha(colors.accent, 0.85) },
        ]}
      >
        <Text variant={lg ? 'h2' : 'tiny'} color={isCompany ? '#fff' : colors.background}>
          {host.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </Text>
      </View>
      <View style={{ flexShrink: 1 }}>
        <View style={styles.nameRow}>
          <Text variant={lg ? 'h2' : 'small'} numberOfLines={1}>{host.name}</Text>
          {host.verified && <Ionicons name="checkmark-circle" size={lg ? 20 : 14} color={colors.accent} />}
        </View>
        <Text variant={lg ? 'small' : 'tiny'} muted>
          {isCompany ? 'Rental company' : 'Private owner'} · ★ {host.rating.toFixed(2)}
          {lg ? ` · ${host.reviewCount} reviews` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
