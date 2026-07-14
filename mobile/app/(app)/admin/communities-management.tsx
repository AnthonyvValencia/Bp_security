import { router } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  useAprobarComunidad,
  useComunidadesGestionables,
  useComunidadesPendientesAprobacion,
  useEliminarComunidad,
  useReactivarComunidad,
  useRechazarComunidad,
  useSuspenderComunidad,
} from '@/src/features/communities/hooks/useAdminComunidades';
import type { Comunidad, SolicitudMembresia } from '@/src/features/communities/types';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function GestionComunidadesScreen() {
  const { data: solicitudes, isLoading: cargandoPendientes } =
    useComunidadesPendientesAprobacion();
  const { data: comunidades, isLoading: cargandoActivas } = useComunidadesGestionables();

  const { mutate: aprobar, isPending: aprobando } = useAprobarComunidad();
  const { mutate: rechazar, isPending: rechazando } = useRechazarComunidad();
  const { mutate: suspender, isPending: suspendiendo } = useSuspenderComunidad();
  const { mutate: reactivar, isPending: reactivando } = useReactivarComunidad();
  const { mutate: eliminar, isPending: eliminando } = useEliminarComunidad();

  const enError = (error: unknown) =>
    Alert.alert('No se pudo completar', obtenerMensajeError(error, 'Intenta de nuevo.'));

  const confirmarEliminar = (comunidad: Comunidad) => {
    Alert.alert(
      'Eliminar comunidad',
      `¿Seguro que quieres eliminar "${comunidad.nombre}"? Sus miembros perderán el acceso.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminar(comunidad.id, { onError: enError }),
        },
      ],
    );
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Gestión de comunidades</Text>

        <Text style={styles.seccion}>PENDIENTES DE APROBACIÓN</Text>
        {cargandoPendientes ? (
          <ActivityIndicator color={colors.acento} />
        ) : !solicitudes || solicitudes.length === 0 ? (
          <Text style={styles.vacio}>No hay comunidades pendientes de aprobación.</Text>
        ) : (
          solicitudes.map((solicitud) => (
            <ItemSolicitud
              key={solicitud.id}
              solicitud={solicitud}
              cargando={aprobando || rechazando}
              onAprobar={() => aprobar(solicitud.id, { onError: enError })}
              onRechazar={() => rechazar({ solicitudId: solicitud.id }, { onError: enError })}
            />
          ))
        )}

        <Text style={[styles.seccion, styles.seccionSeparada]}>COMUNIDADES ACTIVAS</Text>
        {cargandoActivas ? (
          <ActivityIndicator color={colors.acento} />
        ) : !comunidades || comunidades.length === 0 ? (
          <Text style={styles.vacio}>Aún no hay comunidades aprobadas.</Text>
        ) : (
          comunidades.map((comunidad) => (
            <ItemComunidad
              key={comunidad.id}
              comunidad={comunidad}
              cargando={suspendiendo || reactivando || eliminando}
              onVer={() => router.push(`/(app)/communities/${comunidad.id}`)}
              onSuspender={() => suspender(comunidad.id, { onError: enError })}
              onReactivar={() => reactivar(comunidad.id, { onError: enError })}
              onEliminar={() => confirmarEliminar(comunidad)}
            />
          ))
        )}
      </ScrollView>
    </PantallaSegura>
  );
}

function ItemSolicitud({
  solicitud,
  cargando,
  onAprobar,
  onRechazar,
}: {
  solicitud: SolicitudMembresia;
  cargando: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemNombre}>{solicitud.nombre_comunidad_propuesto}</Text>
      <Text style={styles.itemDetalle}>{solicitud.barrio_comunidad_propuesto}</Text>
      {solicitud.descripcion_comunidad_propuesta ? (
        <Text style={styles.itemDescripcion}>{solicitud.descripcion_comunidad_propuesta}</Text>
      ) : null}
      <Text style={styles.itemSolicitante}>
        Solicitado por: {solicitud.usuario?.nombres} {solicitud.usuario?.apellidos} (
        {solicitud.usuario?.email})
      </Text>
      <View style={styles.filaBotones}>
        <Boton titulo="Aprobar" cargando={cargando} onPress={onAprobar} style={{ flex: 1 }} />
        <Boton
          titulo="Rechazar"
          variante="secundario"
          cargando={cargando}
          onPress={onRechazar}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function ItemComunidad({
  comunidad,
  cargando,
  onVer,
  onSuspender,
  onReactivar,
  onEliminar,
}: {
  comunidad: Comunidad;
  cargando: boolean;
  onVer: () => void;
  onSuspender: () => void;
  onReactivar: () => void;
  onEliminar: () => void;
}) {
  const suspendida = comunidad.estado === 'suspendida';

  return (
    <View style={styles.item}>
      <View style={styles.encabezado}>
        <Text style={styles.itemNombre} numberOfLines={1}>
          {comunidad.nombre}
        </Text>
        <Text style={[styles.badge, suspendida ? styles.badgeSuspendida : styles.badgeActiva]}>
          {suspendida ? 'SUSPENDIDA' : 'ACTIVA'}
        </Text>
      </View>
      <Text style={styles.itemDetalle}>{comunidad.barrio}</Text>
      <Text style={styles.itemSolicitante}>
        Líder: {comunidad.lider ? `${comunidad.lider.nombres} ${comunidad.lider.apellidos}` : '—'}
        {'  ·  '}
        {comunidad.total_miembros ?? 0} miembros
      </Text>

      <View style={styles.filaBotones}>
        <Boton titulo="Ver / miembros" variante="secundario" onPress={onVer} style={{ flex: 1 }} />
        {suspendida ? (
          <Boton
            titulo="Reactivar"
            cargando={cargando}
            onPress={onReactivar}
            style={{ flex: 1 }}
          />
        ) : (
          <Boton
            titulo="Suspender"
            variante="secundario"
            cargando={cargando}
            onPress={onSuspender}
            style={{ flex: 1 }}
          />
        )}
      </View>
      <Boton
        titulo="Eliminar comunidad"
        variante="secundario"
        cargando={cargando}
        onPress={onEliminar}
        style={styles.botonEliminar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  scroll: {
    padding: 24,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 20,
    textAlign: 'center',
  },
  seccion: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.acento,
    letterSpacing: 1,
    marginBottom: 12,
  },
  seccionSeparada: {
    marginTop: 28,
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 16,
  },
  item: {
    backgroundColor: colors.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 16,
    marginBottom: 12,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeActiva: {
    color: colors.exito,
  },
  badgeSuspendida: {
    color: colors.peligro,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.texto,
    flexShrink: 1,
  },
  itemDetalle: {
    fontSize: 13,
    color: colors.textoSecundario,
  },
  itemDescripcion: {
    fontSize: 13,
    color: colors.texto,
    marginTop: 6,
  },
  itemSolicitante: {
    fontSize: 12,
    color: colors.textoTenue,
    marginTop: 8,
    marginBottom: 12,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
  },
  botonEliminar: {
    marginTop: 10,
  },
});
