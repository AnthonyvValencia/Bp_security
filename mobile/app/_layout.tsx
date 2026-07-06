import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { queryClient } from '@/src/config/queryClient';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { colors } from '@/src/shared/theme/colors';

export default function RootLayout() {
  const estaHidratado = useAuthStore((state) => state.estaHidratado);
  const hidratar = useAuthStore((state) => state.hidratar);

  useEffect(() => {
    hidratar();
  }, [hidratar]);

  if (!estaHidratado) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.fondo,
        }}
      >
        <ActivityIndicator size="large" color={colors.acento} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}
      />
    </QueryClientProvider>
  );
}
