import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useCambiarLider } from '@/src/features/communities/hooks/useAdminComunidades';
import { useComunidad } from '@/src/features/communities/hooks/useComunidades';
import { useExpulsarMiembro, useMiembros } from '@/src/features/communities/hooks/useMembresia';
import type { ComunidadMiembro } from '@/src/features/communities/types';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export default function MiembrosComunidadScreen() {
  const { comunidadId } = useLocalSearchParams<{ comunidadId: string }>();
  const id = Number(comunidadId);

  const usuario = useAuthStore((state) => state.usuario);
  const { data: comunidad } = useComunidad(id);
  const { data: miembros, isLoading } = useMiembros(id);
  const { mutate: expulsar, isPending } = useExpulsarMiembro(id);
  const { mutate: cambiarLider, isPending: cambiandoLider } = useCambiarLider(id);
  const [seleccionado, setSeleccionado] = useState<ComunidadMiembro | null>(null);
  const [eligiendoLider, setEligiendoLider] = useState(false);

  // Moderan (expulsan) el líder de la comunidad y el administrador general
  // (que tiene bypass total en el backend); los miembros normales solo pueden
  // ver los datos de contacto de sus vecinos.
  const esLider = comunidad?.lider?.id === usuario?.id;
  const esAdmin = usuario?.rol === 'administrador';
  const puedeExpulsar = esLider || esAdmin;
  const liderId = comunidad?.lider?.id;

  const confirmarExpulsion = (miembro: ComunidadMiembro) => {
    Alert.alert(
      'Expulsar miembro',
      `¿Seguro que quieres expulsar a ${miembro.usuario.nombres} ${miembro.usuario.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Expulsar', style: 'destructive', onPress: () => expulsar(miembro.id) },
      ],
    );
  };

  const confirmarCambioLider = (miembro: ComunidadMiembro) => {
    Alert.alert(
      'Cambiar líder de comunidad',
      `¿Nombrar a ${miembro.usuario.nombres} ${miembro.usuario.apellidos} como nuevo líder? El líder actual pasará a ser un miembro normal.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Nombrar líder',
          onPress: () =>
            cambiarLider(miembro.usuario.id, {
              onSuccess: () => {
                setEligiendoLider(false);
                Alert.alert('Líder actualizado', 'El nuevo líder ya tiene el control de la comunidad.');
              },
              onError: () => Alert.alert('No se pudo cambiar', 'Intenta de nuevo.'),
            }),
        },
      ],
    );
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Miembros de la comunidad</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} />
      ) : (
        <FlatList
          data={miembros}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>Aún no hay miembros.</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {item.usuario.nombres.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.itemDatos}>
                <Text style={styles.itemNombre}>
                  {item.usuario.nombres} {item.usuario.apellidos}
                </Text>
                <Text style={styles.itemDetalle}>{item.usuario.telefono ?? item.usuario.email}</Text>
              </View>
              <View style={styles.itemAcciones}>
                <Pressable
                  style={styles.botonIcono}
                  onPress={() => setSeleccionado(item)}
                  hitSlop={8}
                >
                  <Ionicons name="eye-outline" size={20} color={colors.acento} />
                </Pressable>
                {item.usuario.id === liderId ? (
                  <>
                    <View style={styles.badgeLider}>
                      <Ionicons name="star" size={12} color={colors.acento} />
                      <Text style={styles.badgeLiderTexto}>Líder</Text>
                    </View>
                    {esAdmin ? (
                      <Boton
                        titulo="Cambiar líder"
                        variante="secundario"
                        cargando={cambiandoLider}
                        onPress={() => setEligiendoLider(true)}
                      />
                    ) : null}
                  </>
                ) : puedeExpulsar ? (
                  <Boton
                    titulo="Expulsar"
                    variante="secundario"
                    cargando={isPending}
                    onPress={() => confirmarExpulsion(item)}
                  />
                ) : null}
              </View>
            </View>
          )}
        />
      )}

      <PerfilMiembroModal miembro={seleccionado} onCerrar={() => setSeleccionado(null)} />

      <CambiarLiderModal
        visible={eligiendoLider}
        candidatos={(miembros ?? []).filter((m) => m.usuario.id !== liderId)}
        cargando={cambiandoLider}
        onSeleccionar={confirmarCambioLider}
        onCerrar={() => setEligiendoLider(false)}
      />
    </PantallaSegura>
  );
}

function CambiarLiderModal({
  visible,
  candidatos,
  cargando,
  onSeleccionar,
  onCerrar,
}: {
  visible: boolean;
  candidatos: ComunidadMiembro[];
  cargando: boolean;
  onSeleccionar: (miembro: ComunidadMiembro) => void;
  onCerrar: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.overlay} onPress={onCerrar}>
        <Pressable style={styles.tarjeta} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalNombre}>Cambiar líder</Text>
          <Text style={styles.modalFecha}>Elige al nuevo líder de la comunidad</Text>

          {candidatos.length === 0 ? (
            <Text style={styles.vacio}>No hay otros miembros para nombrar líder.</Text>
          ) : (
            <View style={styles.listaCandidatos}>
              {candidatos.map((miembro) => (
                <Pressable
                  key={miembro.id}
                  style={styles.candidato}
                  disabled={cargando}
                  onPress={() => onSeleccionar(miembro)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTexto}>
                      {miembro.usuario.nombres.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.candidatoNombre}>
                    {miembro.usuario.nombres} {miembro.usuario.apellidos}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textoSecundario} />
                </Pressable>
              ))}
            </View>
          )}

          <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PerfilMiembroModal({
  miembro,
  onCerrar,
}: {
  miembro: ComunidadMiembro | null;
  onCerrar: () => void;
}) {
  const usuario = miembro?.usuario;
  const direccion = [usuario?.direccion, usuario?.numero_casa].filter(Boolean).join(' · ');

  return (
    <Modal
      visible={miembro !== null}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <Pressable style={styles.overlay} onPress={onCerrar}>
        <Pressable style={styles.tarjeta} onPress={(e) => e.stopPropagation()}>
          <View style={styles.avatarGrande}>
            <Text style={styles.avatarGrandeTexto}>
              {usuario?.nombres.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.modalNombre}>
            {usuario?.nombres} {usuario?.apellidos}
          </Text>
          {miembro ? (
            <Text style={styles.modalFecha}>
              Miembro desde {new Date(miembro.fecha_ingreso).toLocaleDateString()}
            </Text>
          ) : null}

          <View style={styles.perfil}>
            <DatoPerfil icono="mail-outline" valor={usuario?.email} />
            <DatoPerfil icono="call-outline" valor={usuario?.telefono} />
            <DatoPerfil icono="location-outline" valor={usuario?.barrio} etiqueta="Barrio" />
            <DatoPerfil icono="home-outline" valor={direccion || null} etiqueta="Dirección" />
            <DatoPerfil
              icono="navigate-outline"
              valor={usuario?.referencias_domicilio}
              etiqueta="Referencias"
            />
          </View>

          <Boton titulo="Cerrar" variante="secundario" onPress={onCerrar} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DatoPerfil({
  icono,
  valor,
  etiqueta,
}: {
  icono: NombreIcono;
  valor?: string | null;
  etiqueta?: string;
}) {
  if (!valor) {
    return null;
  }

  return (
    <View style={styles.dato}>
      <Ionicons name={icono} size={14} color={colors.acento} />
      <Text style={styles.datoTexto}>
        {etiqueta ? <Text style={styles.datoEtiqueta}>{etiqueta}: </Text> : null}
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 16,
    textAlign: 'center',
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: colors.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  itemDatos: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.texto,
  },
  itemDetalle: {
    fontSize: 13,
    color: colors.textoSecundario,
  },
  itemAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeLider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.acento,
  },
  badgeLiderTexto: {
    color: colors.acento,
    fontSize: 12,
    fontWeight: '700',
  },
  listaCandidatos: {
    width: '100%',
    marginBottom: 16,
  },
  candidato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  candidatoNombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.texto,
  },
  botonIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tarjeta: {
    width: '100%',
    backgroundColor: colors.superficie,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 24,
    alignItems: 'center',
  },
  avatarGrande: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarGrandeTexto: {
    color: colors.texto,
    fontSize: 26,
    fontWeight: '700',
  },
  modalNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.texto,
    textAlign: 'center',
  },
  modalFecha: {
    fontSize: 12,
    color: colors.textoTenue,
    marginTop: 2,
    marginBottom: 16,
  },
  perfil: {
    width: '100%',
    gap: 8,
    backgroundColor: colors.superficieAlterna + '66',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  datoTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.texto,
    lineHeight: 18,
  },
  datoEtiqueta: {
    color: colors.textoSecundario,
    fontWeight: '600',
  },
});
