import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface AccionRapidaProps {
  icono: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  onPress: () => void;
}

export function AccionRapida({ icono, titulo, onPress }: AccionRapidaProps) {
  return (
    <Pressable style={styles.contenedor} onPress={onPress}>
      <Ionicons name={icono} size={22} color={colors.acento} />
      <Text style={styles.titulo}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    paddingVertical: 18,
  },
  titulo: {
    color: colors.texto,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
