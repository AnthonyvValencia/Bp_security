import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

/**
 * Encabezado animado del login, replicando el anillo pulsante y el
 * resplandor cian del prototipo Kotlin (LoginScreen.kt).
 */
export function EscudoAnimado() {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(progreso, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progreso, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animacion.start();

    return () => animacion.stop();
  }, [progreso]);

  const escala = progreso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const opacidad = progreso.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.3] });

  return (
    <View style={styles.contenedor}>
      <View style={styles.resplandor} />

      <View style={styles.iconoContenedor}>
        <Animated.View
          style={[styles.anilloExterior, { transform: [{ scale: escala }], opacity: opacidad }]}
        />
        <View style={styles.anilloInterior} />
        <View style={styles.circuloIcono}>
          <Ionicons name="shield-checkmark" size={40} color={colors.acento} />
        </View>
      </View>

      <Text style={styles.titulo}>BP SECURITY</Text>
      <Text style={styles.subtitulo}>SISTEMA DE PÁNICO BARRIAL</Text>

      <LinearGradient
        colors={['transparent', colors.acento, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divisor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resplandor: {
    position: 'absolute',
    top: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.acento + '15',
  },
  iconoContenedor: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  anilloExterior: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.acento,
  },
  anilloInterior: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    borderColor: colors.acento + '33',
  },
  circuloIcono: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.input,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.texto,
    letterSpacing: 3,
  },
  subtitulo: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.acento,
    letterSpacing: 3,
    marginTop: 2,
  },
  divisor: {
    width: 48,
    height: 2,
    marginTop: 8,
  },
});
