import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface TituloSeccionProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
}

export function TituloSeccion({ icono, titulo }: TituloSeccionProps) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name={icono} size={14} color={colors.acento} />
      <Text style={styles.texto}>{titulo.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    marginTop: 8,
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.acento,
    letterSpacing: 0.8,
  },
});
