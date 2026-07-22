import { Redirect, Stack } from 'expo-router';

import { useAdminTiempoRealGlobal } from '@/src/features/admin/hooks/useAdmin';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useComunidadTiempoRealGlobal, useMiComunidad } from '@/src/features/communities/hooks/useComunidades';
import { useNotificacionesTiempoReal } from '@/src/features/notifications/hooks/useNotificaciones';
import { useAlertasTiempoRealGlobal } from '@/src/features/panic/hooks/usePanicAlertas';
import { colors } from '@/src/shared/theme/colors';

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);
  const { data: comunidad } = useMiComunidad();

  // A nivel del layout (no por pantalla): mantiene el historial de alertas
  // al día en tiempo real sin importar en qué pantalla esté el usuario.
  useAlertasTiempoRealGlobal();
  // Ídem para el ciclo de vida de la comunidad (suspendida/eliminada por
  // el admin): la app reacciona al instante, sin reiniciar.
  useComunidadTiempoRealGlobal();
  // Ídem para el panel del admin (métricas, actividad y usuarios): se
  // suscribe solo si el usuario es administrador.
  useAdminTiempoRealGlobal();
  // Ídem para las insignias rojas del home (solicitudes, alertas, reportes y
  // chat sin leer): los contadores se refrescan en cuanto ocurre el hecho.
  useNotificacionesTiempoReal(comunidad?.id);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}
    />
  );
}
