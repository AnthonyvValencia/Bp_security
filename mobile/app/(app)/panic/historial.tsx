import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEliminarAlerta, useHistorialPropio } from '@/src/features/panic/hooks/usePanicAlertas';
import {
  COLORES_ESTADO_ALERTA,
  ETIQUETAS_ESTADO_ALERTA,
} from '@/src/features/panic/utils/estadoAlerta';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function HistorialAlertasScreen() {
  const { data: alertas, isLoading } = useHistorialPropio();
  const { mutate: eliminarAlerta } = useEliminarAlerta();

  const confirmarEliminar = (alertaId: number) => {
    Alert.alert('Eliminar alerta', '¿Confirmas que quieres eliminar esta alerta de tu historial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => eliminarAlerta(alertaId),
      },
    ]);
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Mi historial de alertas</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} style={styles.cargando} />
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>Aún no has activado ninguna alerta de pánico.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <View style={styles.filaEncabezado}>
                <Text style={styles.fecha}>{new Date(item.creada_en).toLocaleString()}</Text>
                <Text style={[styles.estado, { color: COLORES_ESTADO_ALERTA[item.estado] }]}>
                  {ETIQUETAS_ESTADO_ALERTA[item.estado]}
                </Text>
              </View>

              {item.notas ? <Text style={styles.notas}>{item.notas}</Text> : null}

              <Pressable
                style={styles.eliminarBoton}
                hitSlop={10}
                onPress={() => confirmarEliminar(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.peligro} />
              </Pressable>
            </View>
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
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 16,
    textAlign: 'center',
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
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fecha: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  estado: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notas: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 8,
  },
  eliminarBoton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 4,
  },
});
