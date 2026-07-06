import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useCerrarSesion } from '@/src/features/auth/hooks/useCerrarSesion';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function DashboardScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const { mutate: cerrarSesion, isPending } = useCerrarSesion();

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.saludo}>Hola, {usuario?.nombres} 👋</Text>
      <Text style={styles.subtitulo}>BP Security — el botón de pánico llega en la Fase 3</Text>

      <Link href="/(app)/communities" style={styles.enlace}>
        Comunidades
      </Link>
      <Link href="/(app)/perfil" style={styles.enlace}>
        Ver mi perfil
      </Link>

      <View style={styles.separador} />

      <Boton
        titulo="Cerrar sesión"
        variante="secundario"
        cargando={isPending}
        onPress={() =>
          cerrarSesion(undefined, { onSuccess: () => router.replace('/(auth)/login') })
        }
      />
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  saludo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.texto,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  enlace: {
    color: colors.acento,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  separador: {
    height: 16,
  },
});
