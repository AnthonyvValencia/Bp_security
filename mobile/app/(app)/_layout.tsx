import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { colors } from '@/src/shared/theme/colors';

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}
    />
  );
}
