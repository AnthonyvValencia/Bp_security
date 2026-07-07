import { StyleSheet, Text, View } from 'react-native';

import type { AlertaEnCola } from '@/src/features/panic/store/panicStore';
import { colors } from '@/src/shared/theme/colors';

function describirEstado(cola: AlertaEnCola[]): string | null {
  if (cola.length === 0) {
    return null;
  }

  if (cola.some((alerta) => alerta.estadoSync === 'enviando')) {
    return 'Enviando alerta…';
  }

  if (cola.some((alerta) => alerta.estadoSync === 'error')) {
    return `${cola.length} alerta(s) sin conexión. Se reintentará automáticamente al recuperar internet.`;
  }

  return `${cola.length} alerta(s) pendiente(s) de sincronizar.`;
}

export function EstadoColaBanner({ cola }: { cola: AlertaEnCola[] }) {
  const mensaje = describirEstado(cola);

  if (!mensaje) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  texto: {
    color: colors.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
  },
});
