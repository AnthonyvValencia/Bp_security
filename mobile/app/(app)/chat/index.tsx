import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { BurbujaMensaje } from '@/src/features/chat/components/BurbujaMensaje';
import { useEliminarMensaje, useEnviarMensaje, useMensajesChat } from '@/src/features/chat/hooks/useChat';
import { useMiComunidad } from '@/src/features/communities/hooks/useComunidades';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function ChatScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const { data: comunidad, isLoading: cargandoComunidad } = useMiComunidad();
  const comunidadId = comunidad?.id ?? 0;

  const { data: mensajes, isLoading } = useMensajesChat(comunidadId);
  const { mutate: enviar, isPending: enviando } = useEnviarMensaje(comunidadId);
  const { mutate: eliminar } = useEliminarMensaje(comunidadId);

  const [texto, setTexto] = useState('');

  // Liderazgo por lider_id (igual que las Policies del backend), no por rol.
  const esLider = comunidad?.lider?.id === usuario?.id;

  const confirmarEliminar = (mensajeId: number) => {
    Alert.alert('Eliminar mensaje', '¿Quieres eliminar este mensaje del chat?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(mensajeId) },
    ]);
  };

  const manejarEnviar = () => {
    const contenido = texto.trim();

    if (!contenido || enviando) {
      return;
    }

    enviar(contenido);
    setTexto('');
  };

  if (cargandoComunidad) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  if (!comunidad) {
    return (
      <PantallaSegura style={styles.centrado}>
        <Text style={styles.sinComunidad}>
          Únete a una comunidad para participar en su chat vecinal.
        </Text>
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.texto} />
        </Pressable>
        <View style={styles.encabezadoTextos}>
          <Text style={styles.titulo}>Chat vecinal</Text>
          <Text style={styles.subtitulo}>{comunidad.nombre}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} style={styles.cargando} />
      ) : (
        <FlatList
          data={mensajes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>Aún no hay mensajes. ¡Sé el primero en escribir!</Text>
          }
          renderItem={({ item }) => (
            <BurbujaMensaje
              mensaje={item}
              esPropio={item.usuario_id === usuario?.id}
              puedeEliminar={item.usuario_id === usuario?.id || esLider}
              onEliminar={confirmarEliminar}
            />
          )}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.barraEntrada}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={colors.textoTenue}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.botonEnviar, (!texto.trim() || enviando) && styles.botonEnviarInactivo]}
            onPress={manejarEnviar}
            disabled={!texto.trim() || enviando}
          >
            <Ionicons name="send" size={20} color={colors.fondo} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.fondo,
  },
  sinComunidad: {
    color: colors.textoSecundario,
    fontSize: 15,
    textAlign: 'center',
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  encabezadoTextos: {
    flex: 1,
  },
  titulo: {
    color: colors.texto,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitulo: {
    color: colors.textoSecundario,
    fontSize: 13,
  },
  cargando: {
    marginTop: 24,
  },
  lista: {
    padding: 20,
    flexGrow: 1,
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 40,
  },
  barraEntrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.input,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.texto,
    fontSize: 15,
  },
  botonEnviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonEnviarInactivo: {
    opacity: 0.4,
  },
});
