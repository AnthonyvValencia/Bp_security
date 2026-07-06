import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

const PASO = 48;
const COLOR_LINEA = colors.acento + '0A';

/**
 * Cuadrícula decorativa de fondo (líneas finas y sutiles), replicando el
 * GridBackground del prototipo Kotlin sin necesidad de un Canvas nativo.
 */
export function FondoCuadricula() {
  const { width, height } = useWindowDimensions();
  const columnas = Math.ceil(width / PASO);
  const filas = Math.ceil(height / PASO);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: columnas }).map((_, indice) => (
        <View key={`col-${indice}`} style={[styles.lineaVertical, { left: indice * PASO }]} />
      ))}
      {Array.from({ length: filas }).map((_, indice) => (
        <View key={`fila-${indice}`} style={[styles.lineaHorizontal, { top: indice * PASO }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lineaVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLOR_LINEA,
  },
  lineaHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLOR_LINEA,
  },
});
