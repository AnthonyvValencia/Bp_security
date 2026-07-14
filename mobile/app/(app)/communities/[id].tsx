import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import {
  useComunidad,
  useMiComunidad,
  useSalirComunidad,
  useSolicitarIngreso,
} from '@/src/features/communities/hooks/useComunidades';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export default function DetalleComunidadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comunidadId = Number(id);
  const usuario = useAuthStore((state) => state.usuario);

  const { data: comunidad, isLoading } = useComunidad(comunidadId);
  const { data: miComunidad } = useMiComunidad();
  const { mutate: solicitarIngreso, isPending } = useSolicitarIngreso();
  const { mutate: salir, isPending: saliendo } = useSalirComunidad();

  if (isLoading || !comunidad) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  const esLider = comunidad.lider?.id === usuario?.id;
  const esAdmin = usuario?.rol === 'administrador';
  const esMiembro = miComunidad?.id === comunidad.id;
  const yaTieneComunidad = Boolean(miComunidad);
  const suspendida = comunidad.estado === 'suspendida';

  const solicitar = () => {
    solicitarIngreso(comunidadId, {
      onSuccess: () => {
        Alert.alert('Solicitud enviada', 'El líder de la comunidad revisará tu solicitud.');
      },
      onError: (error) => {
        Alert.alert('No se pudo enviar', obtenerMensajeError(error, 'Intenta de nuevo.'));
      },
    });
  };

  const confirmarSalir = () => {
    Alert.alert(
      'Salir de la comunidad',
      `¿Seguro que quieres salir de "${comunidad.nombre}"? Perderás el acceso al chat, al muro y a las alertas vecinales.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () =>
            salir(undefined, {
              onSuccess: () => {
                Alert.alert('Saliste de la comunidad', undefined, [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              },
              onError: (error) => {
                Alert.alert('No se pudo salir', obtenerMensajeError(error, 'Intenta de nuevo.'));
              },
            }),
        },
      ],
    );
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconoGrande}>
          <Ionicons name="shield-checkmark" size={34} color={colors.acento} />
        </View>

        <Text style={styles.titulo}>{comunidad.nombre}</Text>
        <View style={styles.filaBarrio}>
          <Ionicons name="location-outline" size={14} color={colors.textoSecundario} />
          <Text style={styles.barrio}>{comunidad.barrio}</Text>
        </View>

        {suspendida ? (
          <View style={styles.badgeSuspendida}>
            <Ionicons name="pause-circle-outline" size={14} color={colors.peligro} />
            <Text style={styles.badgeSuspendidaTexto}>La comunidad se encuentra suspendida</Text>
          </View>
        ) : null}

        {comunidad.descripcion ? (
          <Text style={styles.descripcion}>{comunidad.descripcion}</Text>
        ) : null}

        <View style={styles.estadisticas}>
          <Estadistica
            icono="people-outline"
            valor={comunidad.total_miembros ?? 0}
            etiqueta="Miembros"
          />
          <Estadistica
            icono="pulse-outline"
            valor={comunidad.vecinos_conectados ?? 0}
            etiqueta="Conectados"
            acento
          />
        </View>

        <View style={styles.tarjetaLider}>
          <View style={styles.avatarLider}>
            <Text style={styles.avatarLiderTexto}>
              {comunidad.lider ? comunidad.lider.nombres.charAt(0).toUpperCase() : '—'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liderEtiqueta}>LÍDER DE LA COMUNIDAD</Text>
            <Text style={styles.liderNombre}>
              {comunidad.lider
                ? `${comunidad.lider.nombres} ${comunidad.lider.apellidos}`
                : 'Sin asignar'}
            </Text>
          </View>
          {esLider ? <Text style={styles.badgeTu}>TÚ</Text> : null}
        </View>

        <View style={styles.acciones}>
          {esLider ? (
            <>
              <FilaAccion
                icono="mail-unread-outline"
                titulo="Solicitudes de ingreso"
                onPress={() =>
                  router.push(`/(app)/communities/requests?comunidadId=${comunidad.id}`)
                }
              />
              <FilaAccion
                icono="people-outline"
                titulo="Gestionar miembros"
                onPress={() =>
                  router.push(`/(app)/communities/members?comunidadId=${comunidad.id}`)
                }
              />
            </>
          ) : null}

          {(esAdmin || esMiembro) && !esLider ? (
            <FilaAccion
              icono="people-outline"
              titulo="Ver miembros"
              onPress={() =>
                router.push(`/(app)/communities/members?comunidadId=${comunidad.id}`)
              }
            />
          ) : null}
        </View>

        {!esLider && !esMiembro ? (
          !yaTieneComunidad ? (
            <Boton titulo="Solicitar unirme" cargando={isPending} onPress={solicitar} />
          ) : (
            <Text style={styles.aviso}>Ya perteneces a una comunidad.</Text>
          )
        ) : null}

        {esMiembro && !esLider ? (
          <Pressable
            style={[styles.botonSalir, saliendo && styles.botonSalirDeshabilitado]}
            disabled={saliendo}
            onPress={confirmarSalir}
          >
            <Ionicons name="exit-outline" size={18} color={colors.peligro} />
            <Text style={styles.botonSalirTexto}>Salir de la comunidad</Text>
          </Pressable>
        ) : null}

        {esLider ? (
          <Text style={styles.notaLider}>
            Como líder no puedes salir de tu comunidad: un administrador debe reasignar el
            liderazgo o eliminarla.
          </Text>
        ) : null}
      </ScrollView>
    </PantallaSegura>
  );
}

function Estadistica({
  icono,
  valor,
  etiqueta,
  acento,
}: {
  icono: NombreIcono;
  valor: number;
  etiqueta: string;
  acento?: boolean;
}) {
  return (
    <View style={styles.estadistica}>
      <Ionicons name={icono} size={18} color={acento ? colors.exito : colors.acento} />
      <Text style={styles.estadisticaValor}>{valor}</Text>
      <Text style={styles.estadisticaEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function FilaAccion({
  icono,
  titulo,
  onPress,
}: {
  icono: NombreIcono;
  titulo: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.filaAccion} onPress={onPress}>
      <View style={styles.filaAccionIcono}>
        <Ionicons name={icono} size={18} color={colors.acento} />
      </View>
      <Text style={styles.filaAccionTexto}>{titulo}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textoSecundario} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  iconoGrande: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.superficie,
    borderWidth: 2,
    borderColor: colors.acento + '55',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.texto,
    textAlign: 'center',
  },
  filaBarrio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  barrio: {
    fontSize: 14,
    color: colors.textoSecundario,
  },
  badgeSuspendida: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.peligro,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  badgeSuspendidaTexto: {
    color: colors.peligro,
    fontSize: 12,
    fontWeight: '700',
  },
  descripcion: {
    fontSize: 14,
    color: colors.texto,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  estadisticas: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  estadistica: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    paddingVertical: 14,
  },
  estadisticaValor: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
  },
  estadisticaEtiqueta: {
    fontSize: 11,
    color: colors.textoSecundario,
    letterSpacing: 0.5,
  },
  tarjetaLider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  avatarLider: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLiderTexto: {
    color: colors.texto,
    fontSize: 16,
    fontWeight: '700',
  },
  liderEtiqueta: {
    fontSize: 10,
    color: colors.textoSecundario,
    letterSpacing: 0.5,
  },
  liderNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.texto,
  },
  badgeTu: {
    color: colors.acento,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  acciones: {
    gap: 10,
    marginBottom: 16,
  },
  filaAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    padding: 14,
  },
  filaAccionIcono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.superficieAlterna,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaAccionTexto: {
    flex: 1,
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  aviso: {
    color: colors.textoSecundario,
    textAlign: 'center',
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.peligro,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  botonSalirDeshabilitado: {
    opacity: 0.5,
  },
  botonSalirTexto: {
    color: colors.peligro,
    fontSize: 14,
    fontWeight: '700',
  },
  notaLider: {
    color: colors.textoTenue,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
});
