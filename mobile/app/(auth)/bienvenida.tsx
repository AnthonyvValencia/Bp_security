import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PulsoSeguridad } from '@/src/features/auth/components/PulsoSeguridad';
import { FondoCuadricula } from '@/src/shared/components/FondoCuadricula';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

interface Caracteristica {
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
}

/**
 * Cada panel vende una capacidad concreta de la app, en el orden en que
 * importan: primero el pánico (el corazón del producto), luego la comunidad
 * que lo hace útil, y después las herramientas del día a día.
 */
const CARACTERISTICAS: Caracteristica[] = [
  {
    icono: 'shield-checkmark',
    titulo: 'Botón de pánico inteligente',
    descripcion: 'Alerta a tus vecinos al instante, incluso sin señal.',
  },
  {
    icono: 'people',
    titulo: 'Tu comunidad, conectada',
    descripcion: 'Todo tu barrio, unido en un solo lugar.',
  },
  {
    icono: 'flash',
    titulo: 'En tiempo real',
    descripcion: 'Alertas y avisos al momento, sin esperas.',
  },
  {
    icono: 'chatbubbles',
    titulo: 'Chat y reportes',
    descripcion: 'Coordina y avisa lo que pasa cerca de ti.',
  },
];

export default function BienvenidaScreen() {
  // Entrada suave: el contenido aparece con un fundido y un leve deslizamiento
  // hacia arriba al montar la pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const estiloEntrada = {
    opacity: entrada,
    transform: [
      { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
    ],
  };

  return (
    <PantallaSegura style={styles.raiz}>
      <FondoCuadricula />
      {/* Resplandor ambiental que se disuelve hacia transparente, sin bordes. */}
      <LinearGradient
        colors={[colors.acento + '1F', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.resplandor}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={estiloEntrada}>
          {/* Héroe: escena animada (escudo + ondas + vecinos) y promesa. */}
          <View style={styles.hero}>
            <PulsoSeguridad />

            <Text style={styles.marca}>BP SECURITY</Text>
            <Text style={styles.titular}>La seguridad de tu barrio, en tus manos</Text>
          </View>

          {/* Paneles descriptivos, apilados tipo Netflix. */}
          <View style={styles.paneles}>
            {CARACTERISTICAS.map((caracteristica) => (
              <PanelCaracteristica key={caracteristica.titulo} {...caracteristica} />
            ))}
          </View>

          {/* Cierre: refuerza la invitación tras el recorrido. */}
          <Text style={styles.cierre}>Gratis para tu comunidad. Empieza en segundos.</Text>
        </Animated.View>
      </ScrollView>

      {/* Zona del pulgar: acciones ancladas, siempre visibles al llegar abajo. */}
      <View style={styles.accionesFijas}>
        <BotonPrincipal titulo="Iniciar sesión" onPress={() => router.push('/(auth)/login')} />

        <Pressable style={styles.enlaceRegistro} onPress={() => router.push('/(auth)/registro')}>
          <Text style={styles.enlaceRegistroTexto}>
            ¿No tienes cuenta? <Text style={styles.enlaceRegistroFuerte}>Crear cuenta</Text>
          </Text>
        </Pressable>
      </View>
    </PantallaSegura>
  );
}

function PanelCaracteristica({ icono, titulo, descripcion }: Caracteristica) {
  return (
    <LinearGradient
      colors={[colors.superficie, colors.superficieAlterna]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.panel}
    >
      <View style={styles.panelIcono}>
        <Ionicons name={icono} size={24} color={colors.acento} />
      </View>
      <View style={styles.panelTexto}>
        <Text style={styles.panelTitulo}>{titulo}</Text>
        <Text style={styles.panelDescripcion}>{descripcion}</Text>
      </View>
    </LinearGradient>
  );
}

/** CTA con degradado cian de marca, resplandor propio y micro-escala al pulsar. */
function BotonPrincipal({ titulo, onPress }: { titulo: string; onPress: () => void }) {
  const escala = useRef(new Animated.Value(1)).current;

  const animar = (hacia: number) =>
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animar(0.97)}
        onPressOut={() => animar(1)}
        style={styles.ctaSombra}
      >
        <LinearGradient
          colors={['#22E4FF', '#00A6C9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTexto}>{titulo}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.fondo} style={styles.ctaIcono} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  resplandor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingTop: 24,
    // Deja aire para que las acciones fijas no tapen el último panel.
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  marca: {
    color: colors.acento,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 12,
  },
  titular: {
    color: colors.texto,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 10,
  },
  paneles: {
    gap: 14,
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 16,
    padding: 16,
  },
  panelIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.acento + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTexto: {
    flex: 1,
  },
  panelTitulo: {
    color: colors.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  panelDescripcion: {
    color: colors.textoSecundario,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cierre: {
    color: colors.acento,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 28,
  },
  accionesFijas: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    backgroundColor: colors.fondo,
  },
  ctaSombra: {
    borderRadius: 16,
    shadowColor: colors.acento,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
  },
  ctaTexto: {
    color: colors.fondo,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ctaIcono: {
    marginLeft: 8,
  },
  enlaceRegistro: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  enlaceRegistroTexto: {
    color: colors.textoSecundario,
    fontSize: 13,
  },
  enlaceRegistroFuerte: {
    color: colors.acento,
    fontWeight: '700',
  },
});
