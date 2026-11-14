import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const t = useDerivedValue(() => withTiming(active ? 1 : 0, { duration: 220 }));
  const anim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.surface, colors.primary]),
    borderColor: interpolateColor(t.value, [0, 1], [colors.border, colors.primary]),
  }));
  return (
    <PressableScale onPress={onPress}>
      <Animated.View style={[styles.chip, { borderRadius: radius.pill }, anim]}>
        <Text variant="small" color={active ? '#fff' : colors.muted}>{label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 18, height: 40, justifyContent: 'center', borderWidth: 1 },
});
