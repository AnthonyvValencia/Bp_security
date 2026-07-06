import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface CampoProps extends TextInputProps {
  etiqueta: string;
  error?: string;
  icono?: keyof typeof Ionicons.glyphMap;
}

export function Campo({
  etiqueta,
  error,
  icono,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}: CampoProps) {
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const [enFoco, setEnFoco] = useState(false);
  const esCampoPassword = secureTextEntry === true;

  const bordeEnvoltorio = error ? colors.peligro : enFoco ? colors.acento : colors.borde;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <View style={[styles.envoltorio, { borderColor: bordeEnvoltorio }]}>
        {icono ? (
          <Ionicons name={icono} size={18} color={colors.acento} style={styles.icono} />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textoTenue}
          secureTextEntry={esCampoPassword && !mostrarTexto}
          onFocus={(evento) => {
            setEnFoco(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setEnFoco(false);
            onBlur?.(evento);
          }}
          {...props}
        />
        {esCampoPassword ? (
          <Pressable onPress={() => setMostrarTexto((valor) => !valor)} hitSlop={10}>
            <Ionicons
              name={mostrarTexto ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textoSecundario}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    marginBottom: 6,
    letterSpacing: 1,
  },
  envoltorio: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.input,
  },
  icono: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.texto,
  },
  error: {
    color: colors.peligro,
    fontSize: 11,
    marginTop: 4,
  },
});
