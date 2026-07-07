import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useCerrarSesion } from '@/src/features/auth/hooks/useCerrarSesion';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useMiComunidad, useMuroComunidad } from '@/src/features/communities/hooks/useComunidades';
import { MuroIncidenciaCard } from '@/src/features/communities/components/MuroIncidenciaCard';
import { BotonPanico } from '@/src/features/panic/components/BotonPanico';
import { EstadoColaBanner } from '@/src/features/panic/components/EstadoColaBanner';
import { PanelAlertaEnviada } from '@/src/features/panic/components/PanelAlertaEnviada';
import { usePanicStore } from '@/src/features/panic/store/panicStore';
import { AccionRapida } from '@/src/shared/components/AccionRapida';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { obtenerUbicacionActual } from '@/src/shared/services/ubicacion';
import { colors } from '@/src/shared/theme/colors';

function saludoSegunHora(): string {
  const hora = new Date().getHours();

  if (hora < 12) {
    return 'Buenos días';
  }

  if (hora < 19) {
    return 'Buenas tardes';
  }

  return 'Buenas noches';
}

export default function DashboardScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const { mutate: cerrarSesion } = useCerrarSesion();
  const { data: comunidad } = useMiComunidad();
  const { data: muro } = useMuroComunidad(comunidad?.id ?? 0);

  const cola = usePanicStore((state) => state.cola);
  const alertaEnCurso = usePanicStore((state) => state.alertaEnCurso);
  const hidratar = usePanicStore((state) => state.hidratar);
  const sincronizarPendientes = usePanicStore((state) => state.sincronizarPendientes);
  const activar = usePanicStore((state) => state.activar);

  useEffect(() => {
    void hidratar();
    void sincronizarPendientes();
  }, [hidratar, sincronizarPendientes]);

  const esLider = usuario?.rol === 'lider' && comunidad?.lider?.id === usuario.id;
  const esAdmin = usuario?.rol === 'administrador';

  const manejarActivacion = async () => {
    const ubicacion = await obtenerUbicacionActual();

    await activar(ubicacion);
  };

  const llamarEcu911 = () => void Linking.openURL('tel:911');

  const compartirGPS = async () => {
    const ubicacion = await obtenerUbicacionActual();

    if (ubicacion.latitud === null || ubicacion.longitud === null) {
      Alert.alert('Ubicación no disponible', 'No pudimos obtener tu ubicación en este momento.');

      return;
    }

    await Share.share({
      message: `Esta es mi ubicación actual: https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`,
    });
  };

  const abrirChat = () =>
    Alert.alert('Próximamente', 'El chat vecinal estará disponible en una próxima actualización.');

  return (
    <PantallaSegura>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <View style={styles.encabezado}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{usuario?.nombres.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.encabezadoTextos}>
            <Text style={styles.saludo}>
              {saludoSegunHora()}, {usuario?.nombres}
            </Text>
            {usuario?.miembro_desde ? (
              <Text style={styles.miembroDesde}>
                Miembro desde: {new Date(usuario.miembro_desde).toLocaleString()}
              </Text>
            ) : null}
          </View>

          <Text style={styles.cerrarSesion} onPress={() => cerrarSesion(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
            CERRAR SESIÓN
          </Text>
        </View>

        {comunidad ? (
          <View style={styles.bannerRed}>
            <View style={styles.bannerRedFila}>
              <View style={styles.puntoVerde} />
              <Text style={styles.bannerRedTexto}>
                Red activa · {comunidad.vecinos_conectados ?? 0} vecino(s) conectado(s)
              </Text>
            </View>
            <Text style={styles.bannerOnline}>● ONLINE</Text>
          </View>
        ) : (
          <Link href="/(app)/communities" style={styles.bannerSinComunidad}>
            Aún no perteneces a una comunidad. Toca aquí para buscar o crear una.
          </Link>
        )}

        <View style={styles.centroPanico}>
          {alertaEnCurso ? (
            <PanelAlertaEnviada alerta={alertaEnCurso} />
          ) : (
            <BotonPanico activando={false} onActivar={() => void manejarActivacion()} />
          )}
        </View>

        <EstadoColaBanner cola={cola} />

        <View style={styles.grid}>
          <AccionRapida icono="call" titulo="Llamar ECU 911" onPress={llamarEcu911} />
          <AccionRapida icono="location" titulo="Compartir GPS" onPress={() => void compartirGPS()} />
          <AccionRapida icono="chatbubbles" titulo="Chat vecinal" onPress={abrirChat} />
          <AccionRapida
            icono="warning"
            titulo="Reportar Novedad"
            onPress={() => router.push('/(app)/reports/create')}
          />
        </View>

        {comunidad ? (
          <>
            <Text style={styles.muroTitulo}>MURO DE INCIDENCIAS</Text>
            {!muro || muro.length === 0 ? (
              <Text style={styles.muroVacio}>No hay incidencias recientes en tu comunidad.</Text>
            ) : (
              muro.map((item) => <MuroIncidenciaCard key={`${item.tipo}-${item.id}`} item={item} />)
            )}
          </>
        ) : null}

        <View style={styles.seccionSecundaria}>
          <Text style={styles.seccionTitulo}>MÁS OPCIONES</Text>
          <View style={styles.grid}>
            <AccionRapida
              icono="time-outline"
              titulo="Mi historial de alertas"
              onPress={() => router.push('/(app)/panic/historial')}
            />
            <AccionRapida
              icono="document-text-outline"
              titulo="Mis reportes"
              onPress={() => router.push('/(app)/reports')}
            />
            <AccionRapida
              icono="people-outline"
              titulo="Comunidades"
              onPress={() => router.push('/(app)/communities')}
            />
            <AccionRapida
              icono="person-outline"
              titulo="Ver mi perfil"
              onPress={() => router.push('/(app)/perfil')}
            />
            {esLider ? (
              <AccionRapida
                icono="shield-outline"
                titulo="Alertas de mi comunidad"
                onPress={() => router.push('/(app)/panic/comunidad')}
              />
            ) : null}
            {esAdmin ? (
              <AccionRapida
                icono="checkmark-done-outline"
                titulo="Aprobación de comunidades"
                onPress={() => router.push('/(app)/admin/communities-approval')}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.texto,
  },
  encabezadoTextos: {
    flex: 1,
  },
  saludo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.texto,
  },
  miembroDesde: {
    fontSize: 11,
    color: colors.textoSecundario,
    marginTop: 2,
  },
  cerrarSesion: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.peligro,
    letterSpacing: 0.5,
  },
  bannerRed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.exito,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  bannerRedFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  puntoVerde: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.exito,
  },
  bannerRedTexto: {
    color: colors.texto,
    fontSize: 12,
    fontWeight: '600',
  },
  bannerOnline: {
    color: colors.exito,
    fontSize: 11,
    fontWeight: '700',
  },
  bannerSinComunidad: {
    color: colors.acento,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  centroPanico: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  muroTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.acento,
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 12,
  },
  muroVacio: {
    color: colors.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  seccionSecundaria: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    paddingTop: 20,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textoSecundario,
    letterSpacing: 1,
    marginBottom: 12,
  },
});
