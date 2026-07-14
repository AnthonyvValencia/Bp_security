import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAdminUsuarios } from '@/src/features/admin/hooks/useAdmin';
import type { AdminUsuario } from '@/src/features/admin/types';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function GestionUsuariosScreen() {
  const [termino, setTermino] = useState('');
  const { data: usuarios, isLoading } = useAdminUsuarios(termino || undefined);

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Gestión de usuarios</Text>

      <Campo
        etiqueta="Buscar por nombre, email o cédula"
        icono="search-outline"
        value={termino}
        onChangeText={setTermino}
        placeholder="Ana, ana@..., 17..."
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>No se encontraron usuarios.</Text>}
          renderItem={({ item }) => <FilaUsuario usuario={item} />}
        />
      )}
    </PantallaSegura>
  );
}

function FilaUsuario({ usuario }: { usuario: AdminUsuario }) {
  const suspendido = usuario.estado === 'suspendido';

  return (
    <Pressable
      style={styles.item}
      onPress={() => router.push(`/(app)/admin/user?id=${usuario.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>{usuario.nombres.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemNombre}>
          {usuario.nombres} {usuario.apellidos}
        </Text>
        <Text style={styles.itemDetalle}>{usuario.email}</Text>
        <View style={styles.badges}>
          <Text style={styles.badgeRol}>{usuario.rol}</Text>
          {suspendido ? <Text style={styles.badgeSuspendido}>suspendido</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textoSecundario} />
    </Pressable>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: colors.texto,
    fontSize: 16,
    fontWeight: '700',
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
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badgeRol: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.acento,
    backgroundColor: colors.superficieAlterna,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  badgeSuspendido: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.peligro,
    backgroundColor: colors.superficieAlterna,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
