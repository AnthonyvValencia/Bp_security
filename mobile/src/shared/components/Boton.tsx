import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface BotonProps extends PressableProps {
  titulo: string;
  variante?: 'primario' | 'secundario';
  cargando?: boolean;
}

export function Boton({
  titulo,
  variante = 'primario',
  cargando,
  disabled,
  style,
  ...props
}: BotonProps) {
  const esSecundario = variante === 'secundario';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        esSecundario ? styles.secundario : styles.primario,
        (disabled || cargando) && styles.deshabilitado,
        pressed && !disabled && !cargando ? styles.presionado : null,
      ]}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando ? (
        <ActivityIndicator color={esSecundario ? colors.texto : '#fff'} />
      ) : (
        <Text style={esSecundario ? styles.textoSecundario : styles.textoPrimario}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: colors.primario,
  },
  secundario: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  deshabilitado: {
    opacity: 0.6,
  },
  presionado: {
    opacity: 0.85,
  },
  textoPrimario: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  textoSecundario: {
    color: colors.texto,
    fontSize: 16,
    fontWeight: '600',
  },
});
