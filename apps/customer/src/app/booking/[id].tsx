import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarSilhouette } from '@/components/three/CarSilhouette';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAddons, useVehicle } from '@/data/api';
import { createBooking } from '@/data/booking';
import { daysBetween, money } from '@/lib/format';
import { useBookingStore } from '@/store/booking';
import { alpha, useTheme } from '@/theme/ThemeProvider';

const PROMOS: Record<string, number> = { DRIVE15: 0.15 };
const DAYS = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i + 1));

export default function Checkout() {
  const { id, color } = useLocalSearchParams<{ id: string; color?: string }>();
  const { data: v } = useVehicle(id);
  const { data: addons = [] } = useAddons(v?.host.id);
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addTrip = useBookingStore((s) => s.addTrip);

  const [start, setStart] = useState(DAYS[0]);
  const [end, setEnd] = useState(DAYS[3]);
  const [picking, setPicking] = useState<'start' | 'end'>('start');
  const [delivery, setDelivery] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [promo, setPromo] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const days = daysBetween(start, end);
  const price = useMemo(() => {
    if (!v) return null;
    const base = v.dailyRate * days;
    const extras = addons.filter((a) => selected.includes(a.id)).reduce((s, a) => s + a.pricePerDay * days, 0);
    const discountRate = days >= 3 ? PROMOS[promo.trim().toUpperCase()] ?? 0 : 0;
    const discount = base * discountRate;
    const total = base + extras - discount;
    return { base, extras, discount, total };
  }, [v, days, addons, selected, promo]);

  if (!v || !price) return <Screen><View /></Screen>;
  const paint = color ?? v.colors[0];

  const pickDay = (d: Date) => {
    Haptics.selectionAsync();
    if (picking === 'start') {
      setStart(d);
      if (d >= end) setEnd(addDays(d, 1));
      setPicking('end');
    } else {
      if (d <= start) {
        setStart(d);
        setEnd(addDays(d, 1));
      } else setEnd(d);
      setPicking('start');
    }
  };

  const pay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const booking = await createBooking({
        vehicle: v,
        color: paint,
        start,
        end,
        delivery,
        addonIds: selected,
        promo: promo.trim().toUpperCase() || null,
        total: price.total,
      });
      addTrip(booking);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/booking/success', params: { id: booking.id } });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPayError(e instanceof Error ? e.message : 'Payment failed, please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Screen>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <PressableScale onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressableScale>
        <Text variant="h3">Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.carRow}>
            <CarSilhouette bodyStyle={v.bodyStyle} color={paint} width={120} />
            <View style={{ flex: 1 }}>
              <Text variant="h3">{v.make} {v.model}</Text>
              <Text variant="small" muted>{v.seats} seats · {v.transmission} · {v.fuel}</Text>
              <Text variant="small" muted>Hosted by {v.host.name}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Date range */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ gap: 12 }}>
          <Text variant="h2">When?</Text>
          <View style={styles.rangeRow}>
            {(['start', 'end'] as const).map((k) => (
              <PressableScale
                key={k}
                onPress={() => setPicking(k)}
                style={[
                  styles.rangeBox,
                  { borderRadius: radius.md, backgroundColor: colors.surface, borderColor: picking === k ? colors.accent : colors.border },
                ]}
              >
                <Text variant="tiny" muted>{k === 'start' ? 'PICK-UP' : 'RETURN'}</Text>
                <Text variant="h3">{format(k === 'start' ? start : end, 'EEE, d MMM')}</Text>
                <Text variant="small" muted>10:00 AM</Text>
              </PressableScale>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DAYS.map((d) => {
              const isEdge = isSameDay(d, start) || isSameDay(d, end);
              const inRange = d > start && d < end;
              return (
                <PressableScale
                  key={d.toISOString()}
                  onPress={() => pickDay(d)}
                  style={[
                    styles.day,
                    {
                      borderRadius: radius.md,
                      backgroundColor: isEdge ? colors.primary : inRange ? alpha(colors.primary, 0.22) : colors.surface,
                      borderColor: isEdge ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text variant="tiny" color={isEdge ? '#fff' : colors.muted}>{format(d, 'EEE').toUpperCase()}</Text>
                  <Text variant="h3" color={isEdge ? '#fff' : colors.text}>{format(d, 'd')}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Pickup method */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ gap: 12 }}>
          <Text variant="h2">Where?</Text>
          <View style={styles.rangeRow}>
            {[
              { k: false, icon: 'business', title: 'Host pick-up', sub: v.location },
              { k: true, icon: 'navigate', title: 'Deliver to me', sub: 'Live-tracked' },
            ].map((o) => (
              <PressableScale
                key={String(o.k)}
                onPress={() => setDelivery(o.k)}
                style={[styles.rangeBox, { borderRadius: radius.md, backgroundColor: colors.surface, borderColor: delivery === o.k ? colors.accent : colors.border }]}
              >
                <Ionicons name={o.icon as never} size={20} color={delivery === o.k ? colors.accent : colors.muted} />
                <Text variant="h3">{o.title}</Text>
                <Text variant="small" muted>{o.sub}</Text>
              </PressableScale>
            ))}
          </View>
        </Animated.View>

        {/* Add-ons */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ gap: 10 }}>
          <Text variant="h2">Extras</Text>
          {addons.map((a) => {
            const on = selected.includes(a.id);
            return (
              <PressableScale
                key={a.id}
                scaleTo={0.98}
                onPress={() => setSelected((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id]))}
                style={[styles.addon, { borderRadius: radius.md, backgroundColor: on ? alpha(colors.primary, 0.14) : colors.surface, borderColor: on ? colors.primary : colors.border }]}
              >
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{a.name}</Text>
                  <Text variant="small" muted>{a.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text variant="small">+{money(a.pricePerDay)}/d</Text>
                  <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={on ? colors.accent : colors.muted} />
                </View>
              </PressableScale>
            );
          })}
        </Animated.View>

        {/* Promo */}
        <View style={[styles.promo, { borderRadius: radius.pill, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="pricetag" size={18} color={colors.muted} />
          <TextInput
            value={promo}
            onChangeText={setPromo}
            placeholder="Promo code (try DRIVE15)"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
          />
          {price.discount > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
        </View>

        {/* Summary */}
        <Animated.View layout={LinearTransition.springify()}>
          <Card style={{ gap: 10 }}>
            <Row label={`${money(v.dailyRate)} × ${days} day${days > 1 ? 's' : ''}`} value={money(price.base)} />
            {price.extras > 0 && <Row label="Extras" value={money(price.extras)} />}
            {price.discount > 0 && <Row label="Promo discount" value={`− ${money(price.discount)}`} accent={colors.accent} />}
            <Row label="Refundable deposit (held)" value={money(v.deposit)} muted />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
            <Row label="Total to pay" value={money(price.total)} bold />
          </Card>
        </Animated.View>
        {payError && <Text color="#FF5A6E" variant="small">{payError}</Text>}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 12, backgroundColor: alpha(colors.background, 0.96), borderColor: colors.border }]}>
        <Button title={`Pay ${money(price.total)} with PayHere`} loading={paying} onPress={pay} />
        <Text variant="tiny" muted style={{ textAlign: 'center', marginTop: 8 }}>🔒 Secured payment · Visa · Mastercard · Amex · eZ Cash</Text>
      </View>
    </Screen>
  );
}

function Row({ label, value, bold, muted, accent }: { label: string; value: string; bold?: boolean; muted?: boolean; accent?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant={bold ? 'h3' : 'small'} muted={muted || (!bold && !accent)} color={accent}>{label}</Text>
      <Text variant={bold ? 'h2' : 'small'} muted={muted} color={accent}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  carRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rangeRow: { flexDirection: 'row', gap: 10 },
  rangeBox: { flex: 1, padding: 14, gap: 4, borderWidth: 1.5 },
  day: { width: 58, height: 72, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1 },
  addon: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: 1 },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 18, borderWidth: 1 },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
});
