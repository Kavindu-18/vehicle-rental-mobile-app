import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const APressable = Animated.createAnimatedComponent(Pressable);

/** Springy press feedback + light haptic — used for every tappable surface. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  haptic = true,
  onPress,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <APressable
      {...rest}
      onPressIn={() => (scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 300 }))}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </APressable>
  );
}
