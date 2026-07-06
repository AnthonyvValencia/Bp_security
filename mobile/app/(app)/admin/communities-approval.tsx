import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import {
  useAprobarComunidad,
  useComunidadesPendientesAprobacion,
  useRechazarComunidad,
} from '@/src/features/communities/hooks/useAdminComunidades';
import type { SolicitudMembresia } from '@/src/features/communities/types';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function AprobacionComunidadesScreen() {
  const { data: solicitudes, isLoading } = useComunidadesPendientesAprobacion();
  const { mutate: aprobar, isPending: aprobando } = useAprobarComunidad();
  const { mutate: rechazar, isPending: rechazando } = useRechazarComunidad();

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Comunidades pendientes</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} />
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.vacio}>No hay comunidades pendientes de aprobación.</Text>
          }
          renderItem={({ item }) => (
            <ItemSolicitud
              solicitud={item}
              cargando={aprobando || rechazando}
              onAprobar={() => aprobar(item.id)}
              onRechazar={() => rechazar({ solicitudId: item.id })}
            />
          )}
        />
      )}
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

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 16,
    textAlign: 'center',
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 20,
  },
  item: {
    backgroundColor: colors.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 16,
    marginBottom: 12,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.texto,
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
});
