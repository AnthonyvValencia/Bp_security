import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useMiComunidad } from '@/src/features/communities/hooks/useComunidades';
import { useCambiarEstadoReporte, useReportesComunidad } from '@/src/features/reports/hooks/useReportes';
import type { EstadoReporte } from '@/src/features/reports/types';
import {
  COLORES_ESTADO_REPORTE,
  ETIQUETAS_CATEGORIA_REPORTE,
  ETIQUETAS_ESTADO_REPORTE,
} from '@/src/features/reports/utils/etiquetas';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

const TRANSICIONES: Record<EstadoReporte, EstadoReporte[]> = {
  abierto: ['en_revision', 'resuelto', 'descartado'],
  en_revision: ['resuelto', 'descartado'],
  resuelto: [],
  descartado: [],
};

export default function ReportesComunidadScreen() {
  const { data: comunidad, isLoading: cargandoComunidad } = useMiComunidad();
  const comunidadId = comunidad?.id ?? 0;

  const { data: reportes, isLoading } = useReportesComunidad(comunidadId);
  const { mutate: cambiarEstado, isPending } = useCambiarEstadoReporte(comunidadId);

  if (cargandoComunidad || isLoading) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Reportes de mi comunidad</Text>

      <FlatList
        data={reportes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Text style={styles.vacio}>No hay reportes registrados.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.tarjeta} onPress={() => router.push(`/(app)/reports/${item.id}`)}>
            <View style={styles.filaEncabezado}>
              <Text style={styles.tituloReporte}>{item.titulo}</Text>
              <Text style={[styles.estado, { color: COLORES_ESTADO_REPORTE[item.estado] }]}>
                {ETIQUETAS_ESTADO_REPORTE[item.estado]}
              </Text>
            </View>

            <Text style={styles.detalle}>{ETIQUETAS_CATEGORIA_REPORTE[item.categoria]}</Text>
            {item.usuario ? (
              <Text style={styles.detalle}>
                {item.usuario.nombres} {item.usuario.apellidos}
              </Text>
            ) : null}

            {TRANSICIONES[item.estado].length > 0 ? (
              <View style={styles.acciones}>
                {TRANSICIONES[item.estado].map((estado) => (
                  <Boton
                    key={estado}
                    titulo={ETIQUETAS_ESTADO_REPORTE[estado]}
                    variante="secundario"
                    cargando={isPending}
                    onPress={() => cambiarEstado({ reporteId: item.id, estado })}
                  />
                ))}
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 16,
    textAlign: 'center',
  },
  lista: {
    paddingBottom: 24,
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 24,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloReporte: {
    color: colors.texto,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 8,
  },
  estado: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detalle: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 4,
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
