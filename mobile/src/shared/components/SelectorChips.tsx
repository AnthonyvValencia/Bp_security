import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface SelectorChipsProps {
  etiqueta: string;
  opciones: readonly string[];
  valor: string;
  onCambiar: (valor: string) => void;
}

export function SelectorChips({ etiqueta, opciones, valor, onCambiar }: SelectorChipsProps) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <View style={styles.fila}>
        {opciones.map((opcion) => {
          const seleccionado = opcion === valor;

          return (
            <Pressable
              key={opcion}
              style={[styles.chip, seleccionado && styles.chipSeleccionado]}
              onPress={() => onCambiar(seleccionado ? '' : opcion)}
            >
              <Text style={[styles.chipTexto, seleccionado && styles.chipTextoSeleccionado]}>
                {opcion}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textoSecundario,
    marginBottom: 8,
    letterSpacing: 1,
  },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.input,
  },
  chipSeleccionado: {
    backgroundColor: colors.acento,
    borderColor: colors.acento,
  },
  chipTexto: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextoSeleccionado: {
    color: colors.fondo,
  },
});
