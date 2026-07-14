import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMiComunidad } from '@/src/features/communities/hooks/useComunidades';
import {
  useAlertasComunidad,
  useFalsaAlarma,
  useReconocerAlerta,
  useResolverAlerta,
} from '@/src/features/panic/hooks/usePanicAlertas';
import type { AlertaPanico } from '@/src/features/panic/types';
import {
  COLORES_ESTADO_ALERTA,
  ETIQUETAS_ESTADO_ALERTA,
} from '@/src/features/panic/utils/estadoAlerta';
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

type Filtro = 'alertas' | 'reportes';

export default function AlertasComunidadScreen() {
  const [filtro, setFiltro] = useState<Filtro>('alertas');

  const { data: comunidad, isLoading: cargandoComunidad } = useMiComunidad();
  const comunidadId = comunidad?.id ?? 0;

  const { data: alertas, isLoading: cargandoAlertas } = useAlertasComunidad(comunidadId);
  const { mutate: reconocer, isPending: reconociendo } = useReconocerAlerta(comunidadId);
  const { mutate: resolver, isPending: resolviendo } = useResolverAlerta(comunidadId);
  const { mutate: marcarFalsaAlarma, isPending: marcandoFalsa } = useFalsaAlarma(comunidadId);

  const { data: reportes, isLoading: cargandoReportes } = useReportesComunidad(comunidadId);
  const { mutate: cambiarEstado, isPending: cambiandoEstado } = useCambiarEstadoReporte(comunidadId);

  const confirmarResolver = (alerta: AlertaPanico) => {
    Alert.alert('Resolver alerta', '¿Confirmas que esta alerta ya fue atendida?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resolver', onPress: () => resolver({ alertaId: alerta.id }) },
    ]);
  };

  const confirmarFalsaAlarma = (alerta: AlertaPanico) => {
    Alert.alert('Marcar como falsa alarma', '¿Confirmas que no fue una emergencia real?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => marcarFalsaAlarma({ alertaId: alerta.id }) },
    ]);
  };

  const cargando =
    cargandoComunidad || (filtro === 'alertas' ? cargandoAlertas : cargandoReportes);

  if (cargando) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Mi comunidad</Text>

      <View style={styles.filtros}>
        <Pressable
          style={[styles.filtro, filtro === 'alertas' && styles.filtroActivo]}
          onPress={() => setFiltro('alertas')}
        >
          <Text style={[styles.filtroTexto, filtro === 'alertas' && styles.filtroTextoActivo]}>
            Alertas
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filtro, filtro === 'reportes' && styles.filtroActivo]}
          onPress={() => setFiltro('reportes')}
        >
          <Text style={[styles.filtroTexto, filtro === 'reportes' && styles.filtroTextoActivo]}>
            Reportes
          </Text>
        </Pressable>
      </View>

      {filtro === 'alertas' ? (
        <FlatList
          data={alertas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>No hay alertas registradas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <View style={styles.filaEncabezado}>
                <Text style={styles.nombre}>
                  {item.usuario?.nombres} {item.usuario?.apellidos}
                </Text>
                <Text style={[styles.estado, { color: COLORES_ESTADO_ALERTA[item.estado] }]}>
                  {ETIQUETAS_ESTADO_ALERTA[item.estado]}
                </Text>
              </View>

              <Text style={styles.detalle}>{new Date(item.creada_en).toLocaleString()}</Text>
              {item.usuario?.telefono ? (
                <Text style={styles.detalle}>Tel: {item.usuario.telefono}</Text>
              ) : null}
              {item.latitud && item.longitud ? (
                <Text style={styles.detalle}>
                  Ubicación: {item.latitud.toFixed(5)}, {item.longitud.toFixed(5)}
                </Text>
              ) : null}

              {item.estado === 'enviada' || item.estado === 'reconocida' ? (
                <View style={styles.acciones}>
                  {item.estado === 'enviada' ? (
                    <Boton
                      titulo="Reconocer"
                      variante="secundario"
                      cargando={reconociendo}
                      onPress={() => reconocer(item.id)}
                    />
                  ) : null}
                  <Boton
                    titulo="Resolver"
                    cargando={resolviendo}
                    onPress={() => confirmarResolver(item)}
                  />
                  <Boton
                    titulo="Falsa alarma"
                    variante="secundario"
                    cargando={marcandoFalsa}
                    onPress={() => confirmarFalsaAlarma(item)}
                  />
                </View>
              ) : null}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>No hay reportes registrados.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.tarjeta}
              onPress={() => router.push(`/(app)/reports/${item.id}`)}
            >
              <View style={styles.filaEncabezado}>
                <Text style={styles.nombre}>{item.titulo}</Text>
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
                      cargando={cambiandoEstado}
                      onPress={() => cambiarEstado({ reporteId: item.id, estado })}
                    />
                  ))}
                </View>
              ) : null}
            </Pressable>
          )}
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
  filtros: {
    flexDirection: 'row',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  filtro: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  filtroActivo: {
    backgroundColor: colors.acento,
  },
  filtroTexto: {
    color: colors.textoSecundario,
    fontSize: 13,
    fontWeight: '700',
  },
  filtroTextoActivo: {
    color: colors.fondo,
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
  nombre: {
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
