import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useComunidadTiempoRealGlobal } from '@/src/features/communities/hooks/useComunidades';
import { useAlertasTiempoRealGlobal } from '@/src/features/panic/hooks/usePanicAlertas';
import { colors } from '@/src/shared/theme/colors';

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);

  // A nivel del layout (no por pantalla): mantiene el historial de alertas
  // al día en tiempo real sin importar en qué pantalla esté el usuario.
  useAlertasTiempoRealGlobal();
  // Ídem para el ciclo de vida de la comunidad (suspendida/eliminada por
  // el admin): la app reacciona al instante, sin reiniciar.
  useComunidadTiempoRealGlobal();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}
    />
  );
}
