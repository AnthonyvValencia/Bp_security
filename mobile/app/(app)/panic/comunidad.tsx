import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

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
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function AlertasComunidadScreen() {
  const { data: comunidad, isLoading: cargandoComunidad } = useMiComunidad();
  const comunidadId = comunidad?.id ?? 0;

  const { data: alertas, isLoading } = useAlertasComunidad(comunidadId);
  const { mutate: reconocer, isPending: reconociendo } = useReconocerAlerta(comunidadId);
  const { mutate: resolver, isPending: resolviendo } = useResolverAlerta(comunidadId);
  const { mutate: marcarFalsaAlarma, isPending: marcandoFalsa } = useFalsaAlarma(comunidadId);

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

  if (cargandoComunidad || isLoading) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Alertas de mi comunidad</Text>

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
  nombre: {
    color: colors.texto,
    fontSize: 15,
    fontWeight: '700',
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
