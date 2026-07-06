import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface EncabezadoAuthProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo: string;
}

export function EncabezadoAuth({ icono, titulo, subtitulo }: EncabezadoAuthProps) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.circuloExterior}>
        <View style={styles.circuloInterior}>
          <Ionicons name={icono} size={36} color={colors.acento} />
        </View>
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.subtitulo}>{subtitulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    marginBottom: 32,
  },
  circuloExterior: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: colors.acento + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circuloInterior: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.superficie,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.texto,
    letterSpacing: 1,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textoSecundario,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
