import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StyleSheet, type ViewProps } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface PantallaSeguraProps extends ViewProps {
  edges?: readonly Edge[];
}

/**
 * Envoltorio que respeta el notch/isla dinámica del dispositivo (solo el
 * borde superior por defecto; el resto de cada pantalla ya maneja su propio
 * padding interno).
 */
export function PantallaSegura({ style, edges = ['top'], ...props }: PantallaSeguraProps) {
  return <SafeAreaView edges={edges} style={[styles.base, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
});
