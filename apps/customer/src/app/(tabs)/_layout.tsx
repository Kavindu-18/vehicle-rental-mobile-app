import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { alpha, useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, color, accent }: { name: IconName; focused: boolean; color: ColorValue; accent: string }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={focused ? name : (`${name}-outline` as IconName)} size={23} color={color as string} />
      <View style={[styles.dot, { backgroundColor: focused ? accent : 'transparent' }]} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const icon = (name: IconName) => ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <TabIcon name={name} focused={focused} color={color} accent={colors.accent} />
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          marginHorizontal: 24,
          height: 66,
          borderRadius: 33,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          elevation: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: { height: 66, paddingTop: 10 },
        tabBarBackground: () => (
          <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.surface, 0.75) }]} />
        ),
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: icon('compass') }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: icon('car-sport') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Saved', tabBarIcon: icon('heart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
