import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCerrarSesion } from '@/src/features/auth/hooks/useCerrarSesion';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useMiComunidad, useMuroComunidad } from '@/src/features/communities/hooks/useComunidades';
import { MuroIncidenciaCard } from '@/src/features/communities/components/MuroIncidenciaCard';
import { useResumenNotificaciones } from '@/src/features/notifications/hooks/useNotificaciones';
import { BotonPanico } from '@/src/features/panic/components/BotonPanico';
import { EstadoColaBanner } from '@/src/features/panic/components/EstadoColaBanner';
import { PanelAlertaEnviada } from '@/src/features/panic/components/PanelAlertaEnviada';
import { useDeteccionSacudida } from '@/src/features/panic/hooks/useDeteccionSacudida';
import { usePanicStore } from '@/src/features/panic/store/panicStore';
import { AccionRapida } from '@/src/shared/components/AccionRapida';
import { FondoCuadricula } from '@/src/shared/components/FondoCuadricula';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { TituloSeccion } from '@/src/shared/components/TituloSeccion';
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

/** Fecha legible ("julio de 2026") en vez del volcado completo con hora. */
function mesYAnio(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
}

/**
 * Punto "en vivo" con un halo que late hacia afuera. Señal barata pero muy
 * reconocible de que la red está activa en tiempo real.
 */
function IndicadorPulso({ color }: { color: string }) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulso, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );

    animacion.start();

    return () => animacion.stop();
  }, [pulso]);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const opacidad = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={styles.puntoContenedor}>
      <Animated.View
        style={[
          styles.puntoHalo,
          { backgroundColor: color, transform: [{ scale: escala }], opacity: opacidad },
        ]}
      />
      <View style={[styles.punto, { backgroundColor: color }]} />
    </View>
  );
}

export function HomeCiudadano() {
  const usuario = useAuthStore((state) => state.usuario);
  const { mutate: cerrarSesion } = useCerrarSesion();
  const { data: comunidad } = useMiComunidad();
  const { data: muro } = useMuroComunidad(comunidad?.id ?? 0);
  // Contadores de pendientes (insignias rojas); se mantienen en vivo desde
  // el layout con useNotificacionesTiempoReal.
  const { data: resumen } = useResumenNotificaciones();

  const cola = usePanicStore((state) => state.cola);
  const alertaEnCurso = usePanicStore((state) => state.alertaEnCurso);
  const hidratar = usePanicStore((state) => state.hidratar);
  const sincronizarPendientes = usePanicStore((state) => state.sincronizarPendientes);
  const activar = usePanicStore((state) => state.activar);

  useEffect(() => {
    void hidratar();
    void sincronizarPendientes();
  }, [hidratar, sincronizarPendientes]);

  // El liderazgo se determina por ser el lider_id de la comunidad (igual que
  // las Policies del backend), no por el rol: aprobar una comunidad asigna
  // lider_id pero no cambia el rol del usuario.
  const esLider = comunidad?.lider?.id === usuario?.id;
  // El estado llega en tiempo real (evento comunidad.actualizada): al
  // suspender desde el panel admin, estos bloqueos aplican al instante.
  const comunidadSuspendida = comunidad?.estado === 'suspendida';

  const avisarSuspendida = () =>
    Alert.alert('Comunidad suspendida', 'La comunidad se encuentra suspendida.');

  const manejarActivacion = async () => {
    if (comunidadSuspendida) {
      avisarSuspendida();

      return;
    }

    const ubicacion = await obtenerUbicacionActual();

    await activar(ubicacion);
  };

  // Segunda vía de activación: sacudir el teléfono con fuerza dispara el mismo
  // flujo que mantener el botón. Se apaga mientras hay una alerta en curso o la
  // comunidad está suspendida, para no reenviar ni gastar batería en vano.
  useDeteccionSacudida({
    habilitado: !alertaEnCurso && !comunidadSuspendida,
    onSacudida: () => void manejarActivacion(),
  });

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

  const abrirChat = () => {
    if (!comunidad) {
      Alert.alert(
        'Sin comunidad',
        'Únete a una comunidad para participar en su chat vecinal.',
      );

      return;
    }

    if (comunidadSuspendida) {
      avisarSuspendida();

      return;
    }

    router.push('/(app)/chat');
  };

  const abrirReportar = () => {
    if (comunidadSuspendida) {
      avisarSuspendida();

      return;
    }

    router.push('/(app)/reports/create');
  };

  return (
    <PantallaSegura>
      <FondoCuadricula />
      {/* Resplandor ambiental cian, en continuidad con las pantallas de auth. */}
      <LinearGradient
        colors={[colors.acento + '14', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.resplandorAmbiental}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={styles.contenedor} showsVerticalScrollIndicator={false}>
        {/* Encabezado como tarjeta elevada con degradado de superficie, igual
            que las tarjetas de login/registro, para dar peso y jerarquía. */}
        <LinearGradient
          colors={[colors.superficie, colors.superficieAlterna]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.encabezado}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{usuario?.nombres.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.encabezadoTextos}>
            <Text style={styles.saludoEtiqueta}>{saludoSegunHora()}</Text>
            <Text style={styles.saludo} numberOfLines={1}>
              {usuario?.nombres} {usuario?.apellidos ?? ''}
            </Text>

            <View style={styles.encabezadoMeta}>
              <View style={[styles.pastillaRol, esLider && styles.pastillaRolLider]}>
                <Ionicons
                  name={esLider ? 'shield-checkmark' : 'person'}
                  size={11}
                  color={esLider ? colors.primario : colors.acento}
                />
                <Text style={[styles.pastillaRolTexto, esLider && styles.pastillaRolTextoLider]}>
                  {esLider ? 'LÍDER' : 'CIUDADANO'}
                </Text>
              </View>
              {usuario?.miembro_desde ? (
                <Text style={styles.miembroDesde}>Desde {mesYAnio(usuario.miembro_desde)}</Text>
              ) : null}
            </View>
          </View>

          {/* Cerrar sesión como ícono discreto: el rojo queda reservado para la
              emergencia (banner de suspensión y botón de pánico). */}
          <Pressable
            style={styles.botonSalir}
            hitSlop={8}
            onPress={() =>
              cerrarSesion(undefined, { onSuccess: () => router.replace('/(auth)/login') })
            }
          >
            <Ionicons name="log-out-outline" size={20} color={colors.textoSecundario} />
          </Pressable>
        </LinearGradient>

        {comunidad && comunidadSuspendida ? (
          <View style={[styles.bannerRed, styles.bannerSuspendida]}>
            <View style={styles.bannerRedFila}>
              <IndicadorPulso color={colors.peligro} />
              <View style={styles.bannerTextos}>
                <Text style={styles.bannerRedTexto}>Comunidad suspendida</Text>
                <Text style={styles.bannerSubtexto}>El botón de pánico está en pausa</Text>
              </View>
            </View>
            <View style={[styles.pastillaEstado, styles.pastillaEstadoRoja]}>
              <Text style={styles.pastillaEstadoTextoRojo}>SUSPENDIDA</Text>
            </View>
          </View>
        ) : comunidad ? (
          <View style={styles.bannerRed}>
            <View style={styles.bannerRedFila}>
              <IndicadorPulso color={colors.exito} />
              <View style={styles.bannerTextos}>
                <Text style={styles.bannerRedTexto}>{comunidad.nombre}</Text>
                <Text style={styles.bannerSubtexto}>
                  {comunidad.vecinos_conectados ?? 0} vecino(s) conectado(s)
                </Text>
              </View>
            </View>
            <View style={styles.pastillaEstado}>
              <Text style={styles.pastillaEstadoTexto}>EN LÍNEA</Text>
            </View>
          </View>
        ) : (
          <Link href="/(app)/communities" asChild>
            <Pressable style={styles.bannerSinComunidad}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.acento} />
              <Text style={styles.bannerSinComunidadTexto}>
                Aún no perteneces a una comunidad: el botón de pánico no alcanzará a ningún vecino.
                Toca para buscar o crear una.
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textoSecundario} />
            </Pressable>
          </Link>
        )}

        <View style={styles.centroPanico}>
          {alertaEnCurso ? (
            <PanelAlertaEnviada alerta={alertaEnCurso} tieneComunidad={Boolean(comunidad)} />
          ) : (
            <>
              <BotonPanico activando={false} onActivar={() => void manejarActivacion()} />
              <Text style={styles.pistaSacudida}>
                También puedes sacudir el teléfono con fuerza para enviar una alerta.
              </Text>
            </>
          )}
        </View>

        <EstadoColaBanner cola={cola} />

        <View style={styles.grid}>
          <AccionRapida icono="call" titulo="Llamar ECU 911" onPress={llamarEcu911} />
          <AccionRapida icono="location" titulo="Compartir GPS" onPress={() => void compartirGPS()} />
          <AccionRapida
            icono="chatbubbles"
            titulo="Chat vecinal"
            onPress={abrirChat}
            insignia={resumen?.chat_no_leidos}
          />
          <AccionRapida icono="warning" titulo="Reportar Novedad" onPress={abrirReportar} />
        </View>

        {comunidad ? (
          <View style={styles.seccionMuro}>
            <TituloSeccion icono="megaphone-outline" titulo="Muro de incidencias" />
            {!muro || muro.length === 0 ? (
              <Text style={styles.muroVacio}>No hay incidencias recientes en tu comunidad.</Text>
            ) : (
              // El muro llega ordenado de más reciente a más antiguo, así que
              // las primeras 5 son las últimas 5 incidencias.
              muro
                .slice(0, 5)
                .map((item) => <MuroIncidenciaCard key={`${item.tipo}-${item.id}`} item={item} />)
            )}
          </View>
        ) : null}

        <View style={styles.seccionSecundaria}>
          <TituloSeccion icono="apps-outline" titulo="Más opciones" />
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
            {/* Las solicitudes de ingreso se atienden dentro de "Mi comunidad",
                así que la insignia se propaga por toda la ruta hasta allí. */}
            <AccionRapida
              icono="people-outline"
              titulo="Comunidades"
              onPress={() => router.push('/(app)/communities')}
              insignia={resumen?.solicitudes_ingreso}
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
                // Esa pantalla gestiona alertas Y reportes, así que la insignia
                // suma ambos pendientes.
                insignia={(resumen?.alertas_abiertas ?? 0) + (resumen?.reportes_abiertos ?? 0)}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  resplandorAmbiental: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  contenedor: {
    padding: 24,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 14,
    marginBottom: 20,
    // Sombra suave tintada al fondo para dar elevación (no gris puro).
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
  },
  encabezadoTextos: {
    flex: 1,
  },
  saludoEtiqueta: {
    fontSize: 11,
    color: colors.acento,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  saludo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.texto,
    marginTop: 1,
  },
  encabezadoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  pastillaRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.acento + '1A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pastillaRolLider: {
    backgroundColor: colors.primario + '1F',
  },
  pastillaRolTexto: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.acento,
  },
  pastillaRolTextoLider: {
    color: colors.primario,
  },
  miembroDesde: {
    fontSize: 11,
    color: colors.textoSecundario,
    textTransform: 'capitalize',
  },
  botonSalir: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  bannerRed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.exito + '55',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  bannerRedFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerTextos: {
    flex: 1,
  },
  bannerRedTexto: {
    color: colors.texto,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerSubtexto: {
    color: colors.textoSecundario,
    fontSize: 11,
    marginTop: 1,
  },
  bannerSuspendida: {
    borderColor: colors.peligro + '66',
  },
  puntoContenedor: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntoHalo: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pastillaEstado: {
    backgroundColor: colors.exito + '1F',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pastillaEstadoRoja: {
    backgroundColor: colors.peligro + '1F',
  },
  pastillaEstadoTexto: {
    color: colors.exito,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pastillaEstadoTextoRojo: {
    color: colors.peligro,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerSinComunidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.acento + '0F',
    borderWidth: 1,
    borderColor: colors.acento + '40',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  bannerSinComunidadTexto: {
    flex: 1,
    color: colors.texto,
    fontSize: 12,
    lineHeight: 17,
  },
  centroPanico: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pistaSacudida: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  seccionMuro: {
    marginTop: 20,
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
});
