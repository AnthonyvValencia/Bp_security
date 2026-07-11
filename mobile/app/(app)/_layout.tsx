import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useAlertasTiempoRealGlobal } from '@/src/features/panic/hooks/usePanicAlertas';
import { colors } from '@/src/shared/theme/colors';

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);

  // A nivel del layout (no por pantalla): mantiene el historial de alertas
  // al día en tiempo real sin importar en qué pantalla esté el usuario.
  useAlertasTiempoRealGlobal();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}
    />
  );
}
