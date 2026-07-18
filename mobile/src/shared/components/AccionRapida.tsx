import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme/colors';

interface AccionRapidaProps {
  icono: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  onPress: () => void;
  /** Conteo de pendientes; si es > 0 se muestra como insignia roja. */
  insignia?: number;
}

export function AccionRapida({ icono, titulo, onPress, insignia }: AccionRapidaProps) {
  const escala = useRef(new Animated.Value(1)).current;

  const animar = (hacia: number) =>
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[styles.envoltorio, { transform: [{ scale: escala }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animar(0.96)}
        onPressOut={() => animar(1)}
      >
        {/* Superficie en degradado, igual que las tarjetas de login/registro. */}
        <LinearGradient
          colors={[colors.superficie, colors.superficieAlterna]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.contenedor}
        >
          {/* Ícono dentro de un badge circular tintado con el color de marca. */}
          <Animated.View style={styles.badge}>
            <Ionicons name={icono} size={22} color={colors.acento} />
          </Animated.View>
          <Text style={styles.titulo}>{titulo}</Text>

          {typeof insignia === 'number' && insignia > 0 ? (
            <View style={styles.insignia}>
              <Text style={styles.insigniaTexto}>{insignia > 99 ? '99+' : insignia}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  envoltorio: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 16,
    paddingVertical: 20,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.acento + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: colors.texto,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  insignia: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.peligro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insigniaTexto: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
