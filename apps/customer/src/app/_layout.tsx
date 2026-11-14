import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { brand } from '@/theme/brand';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }));
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: brand.theme.background }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <StatusBar style={brand.theme.mode === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: brand.theme.background },
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="vehicle/[id]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="booking/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="booking/success" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="host/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="become-host" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
