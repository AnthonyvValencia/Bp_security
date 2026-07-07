import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

const DURACION_MANTENER_MS = 1000;
const TAMANO = 200;

interface BotonPanicoProps {
  activando: boolean;
  onActivar: () => void;
}

export function BotonPanico({ activando, onActivar }: BotonPanicoProps) {
  const [manteniendo, setManteniendo] = useState(false);
  const progreso = useRef(new Animated.Value(0)).current;
  const disparado = useRef(false);
  const animacion = useRef<Animated.CompositeAnimation | null>(null);

  const iniciarPresion = () => {
    if (activando) {
      return;
    }

    disparado.current = false;
    setManteniendo(true);
    progreso.setValue(0);

    animacion.current = Animated.timing(progreso, {
      toValue: 1,
      duration: DURACION_MANTENER_MS,
      useNativeDriver: false,
    });

    animacion.current.start(({ finished }) => {
      if (finished && !disparado.current) {
        disparado.current = true;
        setManteniendo(false);
        onActivar();
      }
    });
  };

  const cancelarPresion = () => {
    setManteniendo(false);
    animacion.current?.stop();
    progreso.setValue(0);
  };

  const anilloAncho = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, TAMANO / 2] });

  return (
    <View style={styles.contenedor}>
      <Animated.View style={[styles.anillo, { width: anilloAncho, height: anilloAncho }]} />
      <Pressable
        onPressIn={iniciarPresion}
        onPressOut={cancelarPresion}
        style={styles.boton}
        disabled={activando}
      >
        <Ionicons name="warning" size={64} color="#fff" />
        <Text style={styles.textoBoton}>{activando ? 'ACTIVANDO…' : 'PÁNICO'}</Text>
      </Pressable>
      <Text style={styles.instruccion}>
        {manteniendo ? 'Mantén presionado…' : 'Mantén presionado 1 segundo para activar'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    borderRadius: TAMANO,
    backgroundColor: colors.primario,
    opacity: 0.25,
  },
  boton: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primarioOscuro,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
  },
  instruccion: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 20,
    textAlign: 'center',
  },
});
