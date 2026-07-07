import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useEliminarReporte, useReporte } from '@/src/features/reports/hooks/useReportes';
import {
  COLORES_ESTADO_REPORTE,
  ETIQUETAS_CATEGORIA_REPORTE,
  ETIQUETAS_ESTADO_REPORTE,
} from '@/src/features/reports/utils/etiquetas';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function DetalleReporteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reporteId = Number(id);

  const usuario = useAuthStore((state) => state.usuario);
  const { data: reporte, isLoading } = useReporte(reporteId);
  const { mutate: eliminarReporte, isPending: eliminando } = useEliminarReporte();

  if (isLoading || !reporte) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  const esAutor = reporte.usuario?.id === usuario?.id;

  const confirmarEliminar = () => {
    Alert.alert('Eliminar reporte', '¿Confirmas que quieres eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => eliminarReporte(reporteId, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <PantallaSegura>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <View style={styles.filaEncabezado}>
          <Text style={styles.titulo}>{reporte.titulo}</Text>
          <Text style={[styles.estado, { color: COLORES_ESTADO_REPORTE[reporte.estado] }]}>
            {ETIQUETAS_ESTADO_REPORTE[reporte.estado]}
          </Text>
        </View>

        <Text style={styles.categoria}>{ETIQUETAS_CATEGORIA_REPORTE[reporte.categoria]}</Text>
        <Text style={styles.fecha}>{new Date(reporte.creado_en).toLocaleString()}</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.descripcion}>{reporte.descripcion}</Text>
        </View>

        {reporte.usuario ? (
          <Text style={styles.reportadoPor}>
            Reportado por {reporte.usuario.nombres} {reporte.usuario.apellidos}
          </Text>
        ) : null}

        <Text style={styles.subtitulo}>Historial</Text>
        {!reporte.historial || reporte.historial.length === 0 ? (
          <Text style={styles.vacio}>Sin cambios de estado todavía.</Text>
        ) : (
          reporte.historial.map((item) => (
            <View key={item.id} style={styles.itemHistorial}>
              <Text style={styles.itemHistorialTitulo}>
                {ETIQUETAS_ESTADO_REPORTE[item.estado_anterior]} →{' '}
                {ETIQUETAS_ESTADO_REPORTE[item.estado_nuevo]}
              </Text>
              {item.comentario ? (
                <Text style={styles.itemHistorialComentario}>{item.comentario}</Text>
              ) : null}
              <Text style={styles.itemHistorialFecha}>
                {item.cambiado_por ? `${item.cambiado_por.nombres} · ` : ''}
                {new Date(item.creado_en).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        {esAutor ? (
          <Boton
            titulo="Eliminar reporte"
            variante="secundario"
            cargando={eliminando}
            onPress={confirmarEliminar}
            style={styles.botonEliminar}
          />
        ) : null}
      </ScrollView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    flexShrink: 1,
    marginRight: 8,
  },
  estado: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoria: {
    color: colors.acento,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  fecha: {
    color: colors.textoSecundario,
    fontSize: 12,
    marginTop: 2,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  descripcion: {
    color: colors.texto,
    fontSize: 14,
    lineHeight: 20,
  },
  reportadoPor: {
    color: colors.textoSecundario,
    fontSize: 12,
    marginTop: 8,
  },
  subtitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textoSecundario,
    marginTop: 24,
    marginBottom: 12,
  },
  vacio: {
    color: colors.textoSecundario,
    fontSize: 13,
  },
  itemHistorial: {
    borderLeftWidth: 2,
    borderLeftColor: colors.borde,
    paddingLeft: 12,
    marginBottom: 16,
  },
  itemHistorialTitulo: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  itemHistorialComentario: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 2,
  },
  itemHistorialFecha: {
    color: colors.textoTenue,
    fontSize: 11,
    marginTop: 4,
  },
  botonEliminar: {
    marginTop: 24,
  },
});
