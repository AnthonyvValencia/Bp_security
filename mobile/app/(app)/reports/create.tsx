import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CategoriaReporte } from '@/src/features/reports/types';
import {
  ETIQUETAS_CATEGORIA_REPORTE,
  ICONOS_CATEGORIA_REPORTE,
} from '@/src/features/reports/utils/etiquetas';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

const CATEGORIAS = Object.keys(ETIQUETAS_CATEGORIA_REPORTE) as CategoriaReporte[];

export default function ReportarNovedadScreen() {
  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>REPORTAR NOVEDAD</Text>
      <Text style={styles.subtitulo}>
        Selecciona el tipo de incidencia para informar a la comunidad
      </Text>

      <View style={styles.lista}>
        {CATEGORIAS.map((categoria) => (
          <Pressable
            key={categoria}
            style={styles.fila}
            onPress={() => router.push(`/(app)/reports/nuevo/${categoria}`)}
          >
            <View style={styles.filaIcono}>
              <Ionicons name={ICONOS_CATEGORIA_REPORTE[categoria]} size={20} color={colors.acento} />
            </View>
            <Text style={styles.filaTexto}>{ETIQUETAS_CATEGORIA_REPORTE[categoria]}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textoSecundario} />
          </Pressable>
        ))}
      </View>
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
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginBottom: 24,
  },
  lista: {
    gap: 12,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    padding: 16,
  },
  filaIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.superficieAlterna,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaTexto: {
    flex: 1,
    color: colors.texto,
    fontSize: 15,
    fontWeight: '600',
  },
});
