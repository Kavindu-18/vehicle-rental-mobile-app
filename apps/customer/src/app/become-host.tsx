import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { applyAsHost, type HostKind } from '@/data/host';
import { brand } from '@/theme/brand';
import { alpha, useTheme } from '@/theme/ThemeProvider';

const KINDS: { kind: HostKind; icon: string; title: string; sub: string }[] = [
  { kind: 'individual', icon: 'person', title: 'I own a car', sub: 'Earn when you are not driving it' },
  { kind: 'company', icon: 'business', title: 'Rental company', sub: 'List your whole fleet, add staff' },
];

export default function BecomeHost() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<HostKind>('individual');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [regNo, setRegNo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid = name.trim().length > 1 && city.trim().length > 1 && phone.trim().length >= 9 && (kind === 'individual' || regNo.trim().length > 2);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await applyAsHost({ kind, name: name.trim(), city: city.trim(), phone: phone.trim(), businessRegNo: regNo.trim() || null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View style={[styles.done, { padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
          <Animated.View entering={ZoomIn.springify()} style={[styles.doneIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="paper-plane" size={44} color={colors.background} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(200)} style={{ alignItems: 'center', gap: 8 }}>
            <Text variant="h1">Application sent</Text>
            <Text muted style={{ textAlign: 'center', lineHeight: 22 }}>
              Our team will verify your details within 24 hours.{'\n'}Next you'll upload {kind === 'company' ? 'your business registration' : 'your NIC'} and vehicle papers, then add your first car.
            </Text>
          </Animated.View>
          <Button title="Done" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  const field = (label: string, value: string, set: (s: string) => void, props: Partial<React.ComponentProps<typeof TextInput>> = {}) => (
    <View style={{ gap: 6 }}>
      <Text variant="tiny" muted>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
        {...props}
      />
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <PressableScale onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="close" size={22} color={colors.text} />
          </PressableScale>

          <Animated.View entering={FadeInDown.springify()} style={{ gap: 8 }}>
            <Text variant="h1">Earn with{'\n'}{brand.name}</Text>
            <Text muted>Thousands of travellers are looking for cars in Sri Lanka every day.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).springify()} style={{ flexDirection: 'row', gap: 10 }}>
            {KINDS.map((k) => {
              const on = kind === k.kind;
              return (
                <PressableScale
                  key={k.kind}
                  onPress={() => setKind(k.kind)}
                  style={[styles.kind, { borderRadius: radius.lg, backgroundColor: on ? alpha(colors.primary, 0.15) : colors.surface, borderColor: on ? colors.primary : colors.border }]}
                >
                  <Ionicons name={k.icon as never} size={26} color={on ? colors.primary : colors.muted} />
                  <Text variant="h3">{k.title}</Text>
                  <Text variant="small" muted>{k.sub}</Text>
                </PressableScale>
              );
            })}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).springify()} style={{ gap: 14 }}>
            {field(kind === 'company' ? 'Company name' : 'Your name', name, setName, { placeholder: kind === 'company' ? 'e.g. Lanka Car Hire (Pvt) Ltd' : 'e.g. Ruwan Silva' })}
            {kind === 'company' && field('Business registration no.', regNo, setRegNo, { placeholder: 'PV 00123456', autoCapitalize: 'characters' })}
            {field('City', city, setCity, { placeholder: 'Colombo, Kandy, Galle…' })}
            {field('Mobile number', phone, setPhone, { placeholder: '07X XXX XXXX', keyboardType: 'phone-pad' })}
          </Animated.View>

          <Card style={{ gap: 10 }}>
            {[
              ['shield-checkmark', 'Every renter is ID and licence verified'],
              ['card', 'Payouts straight to your bank account'],
              ['calendar', 'You control your calendar and prices'],
            ].map(([icon, label]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon as never} size={18} color={colors.accent} />
                <Text variant="small">{label}</Text>
              </View>
            ))}
          </Card>

          {error && <Text variant="small" color="#FF5A6E">{error}</Text>}
          <Button title="Submit application" disabled={!valid} loading={busy} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  kind: { flex: 1, padding: 16, gap: 6, borderWidth: 1.5 },
  input: { height: 52, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 120 },
  doneIcon: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
});
