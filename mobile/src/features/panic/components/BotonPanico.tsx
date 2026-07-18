import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

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

  // Latido continuo del anillo exterior, replicando el escudo animado del login
  // (LoginScreen): respira en escala y opacidad para señalar que está "vivo".
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const latido = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    latido.start();

    return () => latido.stop();
  }, [pulso]);

  const escalaPulso = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const opacidadPulso = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.3] });

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
      {/* Área cuadrada del tamaño del botón: los anillos absolutos se centran
          respecto a ella (no al contenedor completo, que incluye el texto). */}
      <View style={styles.botonArea}>
        {/* Anillo estático + anillo que late, al estilo del escudo del login. */}
        <View style={styles.anilloEstatico} />
        <Animated.View
          style={[
            styles.anilloPulso,
            { transform: [{ scale: escalaPulso }], opacity: opacidadPulso },
          ]}
        />
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
      </View>
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
  botonArea: {
    width: TAMANO,
    height: TAMANO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    borderRadius: TAMANO,
    backgroundColor: colors.primario,
    opacity: 0.25,
  },
  anilloPulso: {
    position: 'absolute',
    width: TAMANO + 24,
    height: TAMANO + 24,
    borderRadius: (TAMANO + 24) / 2,
    borderWidth: 2,
    borderColor: colors.primario,
  },
  anilloEstatico: {
    position: 'absolute',
    width: TAMANO + 12,
    height: TAMANO + 12,
    borderRadius: (TAMANO + 12) / 2,
    borderWidth: 1.5,
    borderColor: colors.primario + '33',
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
