import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useBookingStore } from '@/store/booking';
import { brand } from '@/theme/brand';
import { alpha, useTheme } from '@/theme/ThemeProvider';

const ITEMS = [
  { icon: 'id-card', label: 'Driving licence & NIC', hint: 'Verify once, book instantly' },
  { icon: 'card', label: 'Payment methods', hint: 'Cards & eZ Cash' },
  { icon: 'gift', label: 'Refer a friend', hint: 'Get LKR 5,000 credit' },
  { icon: 'language', label: 'Language', hint: 'English · සිංහල · தமிழ்' },
  { icon: 'notifications', label: 'Notifications', hint: 'Trip updates & offers' },
  { icon: 'chatbubbles', label: 'Help & support', hint: '24/7 roadside assistance' },
] as const;

export default function Profile() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const trips = useBookingStore((s) => s.trips.length);
  const saved = useBookingStore((s) => s.favorites.length);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 130 }}>
        <Text variant="h1">Profile</Text>
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.hero}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text variant="h1" color="#fff">G</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h2">Guest</Text>
              <Text variant="small" muted>Sign in to sync trips across devices</Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <PressableScale onPress={() => router.push('/become-host')} scaleTo={0.98}>
            <LinearGradient
              colors={[colors.primary, alpha(colors.accent, 0.8)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hostCta, { borderRadius: radius.lg }]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="h3" color="#fff">List your car on {brand.name}</Text>
                <Text variant="small" color="rgba(255,255,255,0.85)">Own a car or a rental company? Start earning.</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={36} color="#fff" />
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        <View style={styles.stats}>
          {[
            { label: 'Trips', value: trips },
            { label: 'Saved', value: saved },
            { label: 'Points', value: trips * 250 },
          ].map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(80 + i * 60).springify()} style={{ flex: 1 }}>
              <Card style={{ alignItems: 'center', gap: 2 }}>
                <Text variant="h2" color={colors.accent}>{s.value}</Text>
                <Text variant="tiny" muted>{s.label.toUpperCase()}</Text>
              </Card>
            </Animated.View>
          ))}
        </View>

        <Card style={{ padding: 0 }}>
          {ITEMS.map((it, i) => (
            <PressableScale key={it.label} scaleTo={0.98} style={[styles.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
              <View style={[styles.itemIcon, { backgroundColor: alpha(colors.primary, 0.15), borderRadius: radius.sm }]}>
                <Ionicons name={it.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3">{it.label}</Text>
                <Text variant="small" muted>{it.hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </PressableScale>
          ))}
        </Card>

        <PressableScale
          onPress={async () => {
            await AsyncStorage.removeItem('onboarding-seen');
            router.replace('/');
          }}
          style={{ alignItems: 'center', padding: 8 }}
        >
          <Text variant="small" muted>Replay intro · {brand.name} v1.0</Text>
        </PressableScale>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10 },
  hostCta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  itemIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
