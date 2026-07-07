import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useMiComunidad } from '@/src/features/communities/hooks/useComunidades';
import { useEliminarAlerta, useHistorialPropio } from '@/src/features/panic/hooks/usePanicAlertas';
import type { AlertaPanico } from '@/src/features/panic/types';
import {
  COLORES_ESTADO_ALERTA,
  ETIQUETAS_ESTADO_ALERTA,
} from '@/src/features/panic/utils/estadoAlerta';
import { useEliminarReporte, useReportesPropios } from '@/src/features/reports/hooks/useReportes';
import type { Reporte } from '@/src/features/reports/types';
import {
  COLORES_ESTADO_REPORTE,
  ETIQUETAS_CATEGORIA_REPORTE,
  ETIQUETAS_ESTADO_REPORTE,
} from '@/src/features/reports/utils/etiquetas';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

type ItemHistorial =
  | { tipo: 'reporte'; id: number; data: Reporte }
  | { tipo: 'alerta_panico'; id: number; data: AlertaPanico };

function fechaDelItem(item: ItemHistorial): string {
  return item.tipo === 'reporte' ? item.data.creado_en : item.data.creada_en;
}

export default function ReportesScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const { data: miComunidad } = useMiComunidad();
  const { data: reportes, isLoading: cargandoReportes } = useReportesPropios();
  const { data: alertas, isLoading: cargandoAlertas } = useHistorialPropio();
  const { mutate: eliminarReporte } = useEliminarReporte();
  const { mutate: eliminarAlerta } = useEliminarAlerta();

  const esLider = usuario?.rol === 'lider' && miComunidad?.lider?.id === usuario.id;
  const cargando = cargandoReportes || cargandoAlertas;

  const confirmarEliminarReporte = (reporteId: number) => {
    Alert.alert('Eliminar reporte', '¿Confirmas que quieres eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => eliminarReporte(reporteId),
      },
    ]);
  };

  const confirmarEliminarAlerta = (alertaId: number) => {
    Alert.alert('Eliminar alerta', '¿Confirmas que quieres eliminar esta alerta de tu historial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => eliminarAlerta(alertaId),
      },
    ]);
  };

  const items: ItemHistorial[] = [
    ...(reportes ?? []).map((data): ItemHistorial => ({ tipo: 'reporte', id: data.id, data })),
    ...(alertas ?? []).map((data): ItemHistorial => ({ tipo: 'alerta_panico', id: data.id, data })),
  ].sort((a, b) => new Date(fechaDelItem(b)).getTime() - new Date(fechaDelItem(a)).getTime());

  return (
    <PantallaSegura style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Mis reportes</Text>
        <Link href="/(app)/reports/create" style={styles.enlaceCrear}>
          + Reportar
        </Link>
      </View>

      {esLider ? (
        <Link href="/(app)/reports/comunidad" style={styles.enlaceComunidad}>
          <Ionicons name="people-outline" size={16} color={colors.acento} />
          <Text style={styles.enlaceComunidadTexto}>Ver reportes de mi comunidad</Text>
        </Link>
      ) : null}

      {cargando ? (
        <ActivityIndicator size="large" color={colors.acento} style={styles.cargando} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.tipo}-${item.id}`}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>Aún no has reportado ningún incidente.</Text>
          }
          renderItem={({ item }) =>
            item.tipo === 'reporte' ? (
              <Pressable
                style={styles.tarjeta}
                onPress={() => router.push(`/(app)/reports/${item.id}`)}
              >
                <View style={styles.filaEncabezado}>
                  <Text style={styles.tituloReporte}>{item.data.titulo}</Text>
                  <Text style={[styles.estado, { color: COLORES_ESTADO_REPORTE[item.data.estado] }]}>
                    {ETIQUETAS_ESTADO_REPORTE[item.data.estado]}
                  </Text>
                </View>
                <Text style={styles.detalle}>
                  {ETIQUETAS_CATEGORIA_REPORTE[item.data.categoria]}
                </Text>
                <Text style={styles.detalle}>{new Date(item.data.creado_en).toLocaleString()}</Text>
                <View style={styles.accionesFila}>
                  <View style={styles.verMas}>
                    <Text style={styles.verMasTexto}>Ver detalle</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.acento} />
                  </View>
                  <Pressable
                    style={styles.eliminarBoton}
                    hitSlop={10}
                    onPress={() => confirmarEliminarReporte(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.peligro} />
                  </Pressable>
                </View>
              </Pressable>
            ) : (
              <View style={[styles.tarjeta, styles.tarjetaAlerta]}>
                <View style={styles.filaEncabezado}>
                  <View style={styles.tituloAlertaFila}>
                    <Ionicons name="megaphone" size={16} color={colors.primario} />
                    <Text style={styles.tituloReporte}>Botón de pánico activado</Text>
                  </View>
                  <Text style={[styles.estado, { color: COLORES_ESTADO_ALERTA[item.data.estado] }]}>
                    {ETIQUETAS_ESTADO_ALERTA[item.data.estado]}
                  </Text>
                </View>
                <Text style={styles.detalle}>{new Date(item.data.creada_en).toLocaleString()}</Text>

                <View style={styles.accionesFila}>
                  {item.data.latitud !== null && item.data.longitud !== null ? (
                    <Pressable
                      onPress={() =>
                        void Linking.openURL(
                          `https://www.google.com/maps?q=${item.data.latitud},${item.data.longitud}`,
                        )
                      }
                    >
                      <Text style={styles.verMasTexto}>Ver ubicación</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Pressable
                    style={styles.eliminarBoton}
                    hitSlop={10}
                    onPress={() => confirmarEliminarAlerta(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.peligro} />
                  </Pressable>
                </View>
              </View>
            )
          }
        />
      )}
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.fondo,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
  },
  enlaceCrear: {
    color: colors.acento,
    fontSize: 14,
    fontWeight: '700',
  },
  enlaceComunidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  enlaceComunidadTexto: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  cargando: {
    marginTop: 24,
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
  tarjetaAlerta: {
    borderColor: colors.primario,
  },
  tituloAlertaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
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
  accionesFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  verMas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verMasTexto: {
    color: colors.acento,
    fontSize: 13,
    fontWeight: '600',
  },
  eliminarBoton: {
    padding: 4,
  },
});
