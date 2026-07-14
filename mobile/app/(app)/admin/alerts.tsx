import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, View } from 'react-native';

import {
  CLAVE_ALERTAS_SIN_COMUNIDAD,
  useAlertasSinComunidad,
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

const ESTADOS_ABIERTOS: AlertaPanico['estado'][] = ['enviada', 'reconocida'];

export default function AlertasSinComunidadScreen() {
  const { data: alertas, isLoading } = useAlertasSinComunidad();

  const { mutate: reconocer, isPending: reconociendo } = useReconocerAlerta(
    CLAVE_ALERTAS_SIN_COMUNIDAD,
  );
  const { mutate: resolver, isPending: resolviendo } = useResolverAlerta(
    CLAVE_ALERTAS_SIN_COMUNIDAD,
  );
  const { mutate: marcarFalsaAlarma, isPending: marcandoFalsa } = useFalsaAlarma(
    CLAVE_ALERTAS_SIN_COMUNIDAD,
  );

  // Las abiertas primero: son las que exigen una acción del admin ahora mismo.
  const ordenadas = useMemo(() => {
    if (!alertas) {
      return [];
    }

    return [...alertas].sort((a, b) => {
      const abiertaA = ESTADOS_ABIERTOS.includes(a.estado) ? 0 : 1;
      const abiertaB = ESTADOS_ABIERTOS.includes(b.estado) ? 0 : 1;

      return abiertaA - abiertaB;
    });
  }, [alertas]);

  const abiertas = ordenadas.filter((alerta) => ESTADOS_ABIERTOS.includes(alerta.estado)).length;

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

  if (isLoading) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Alertas sin comunidad</Text>
      <Text style={styles.subtitulo}>
        Ciudadanos que no pertenecen a ninguna comunidad: no hay líder que los atienda.
      </Text>

      {abiertas > 0 ? (
        <View style={styles.aviso}>
          <Ionicons name="alert-circle" size={18} color={colors.peligro} />
          <Text style={styles.avisoTexto}>
            {abiertas} {abiertas === 1 ? 'alerta abierta' : 'alertas abiertas'} esperando atención.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={ordenadas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.vacio}>No hay alertas de ciudadanos sin comunidad.</Text>
        }
        renderItem={({ item }) => {
          const abierta = ESTADOS_ABIERTOS.includes(item.estado);

          return (
            <View style={[styles.tarjeta, abierta && styles.tarjetaAbierta]}>
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
                <Text
                  style={styles.enlace}
                  onPress={() => Linking.openURL(`tel:${item.usuario?.telefono}`)}
                >
                  Llamar a {item.usuario.telefono}
                </Text>
              ) : null}

              {item.latitud !== null && item.longitud !== null ? (
                <Text
                  style={styles.enlace}
                  onPress={() =>
                    Linking.openURL(`https://www.google.com/maps?q=${item.latitud},${item.longitud}`)
                  }
                >
                  Ver ubicación: {item.latitud.toFixed(5)}, {item.longitud.toFixed(5)}
                </Text>
              ) : (
                <Text style={styles.detalle}>Sin ubicación registrada.</Text>
              )}

              {item.notas ? <Text style={styles.detalle}>Notas: {item.notas}</Text> : null}

              {abierta ? (
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
          );
        }}
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
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.peligro,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  avisoTexto: {
    color: colors.peligro,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
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
  tarjetaAbierta: {
    borderColor: colors.peligro,
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
  enlace: {
    color: colors.acento,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
