import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

const TAMANO = 260;
const CENTRO = TAMANO / 2;
const RADIO_VECINOS = 104;
const TAMANO_VECINO = 34;
const CANTIDAD_ONDAS = 3;
const DURACION_ONDA = 3000;

// Seis vecinos repartidos en círculo, empezando arriba (-90°).
const VECINOS = Array.from({ length: 6 }, (_, indice) => {
  const angulo = (-90 + indice * 60) * (Math.PI / 180);

  return {
    left: CENTRO + RADIO_VECINOS * Math.cos(angulo) - TAMANO_VECINO / 2,
    top: CENTRO + RADIO_VECINOS * Math.sin(angulo) - TAMANO_VECINO / 2,
  };
});

/**
 * Escena animada del héroe: un escudo central emite ondas tipo sonar y los
 * vecinos alrededor se iluminan en secuencia, contando de un vistazo la idea
 * del producto —una alerta que se propaga a toda la comunidad—. Todo con el
 * driver nativo (opacidad/transform), sin librerías extra ni imágenes.
 */
export function PulsoSeguridad() {
  // Una fase 0→1 en bucle alimenta tanto las ondas como el "barrido" de vecinos.
  const fase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(fase, {
        toValue: 1,
        duration: DURACION_ONDA,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animacion.start();

    return () => animacion.stop();
  }, [fase]);

  return (
    <View style={styles.contenedor}>
      {/* Ondas sonar: varias, desfasadas, expandiéndose y desvaneciéndose. */}
      {Array.from({ length: CANTIDAD_ONDAS }).map((_, indice) => {
        const desfase = indice / CANTIDAD_ONDAS;
        // Cada onda recorre su ciclo desplazado respecto a la fase global.
        const progreso = Animated.modulo(Animated.add(fase, desfase), 1);

        const scale = progreso.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.9] });
        const opacity = progreso.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });

        return (
          <Animated.View
            key={`onda-${indice}`}
            style={[styles.onda, { opacity, transform: [{ scale }] }]}
          />
        );
      })}

      {/* Vecinos que se encienden en secuencia según la fase de barrido. */}
      {VECINOS.map((posicion, indice) => {
        const centroFase = indice / VECINOS.length;
        // Distancia de la fase actual al turno de este vecino (envuelta en [0,1)).
        const distancia = Animated.modulo(Animated.add(fase, 1 - centroFase), 1);
        const opacity = distancia.interpolate({
          inputRange: [0, 0.12, 0.3, 1],
          outputRange: [1, 1, 0.35, 0.35],
        });
        const scale = distancia.interpolate({
          inputRange: [0, 0.12, 0.3, 1],
          outputRange: [1.18, 1.18, 1, 1],
        });

        return (
          <Animated.View
            key={`vecino-${indice}`}
            style={[
              styles.vecino,
              { left: posicion.left, top: posicion.top, opacity, transform: [{ scale }] },
            ]}
          >
            <Ionicons name="person" size={16} color={colors.acento} />
          </Animated.View>
        );
      })}

      {/* Núcleo: el escudo del usuario. */}
      <View style={styles.anilloNucleo}>
        <View style={styles.nucleo}>
          <Ionicons name="shield-checkmark" size={40} color={colors.acento} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: TAMANO,
    height: TAMANO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onda: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: colors.acento,
  },
  vecino: {
    position: 'absolute',
    width: TAMANO_VECINO,
    height: TAMANO_VECINO,
    borderRadius: TAMANO_VECINO / 2,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.acento + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anilloNucleo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: colors.acento + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nucleo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.input,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
