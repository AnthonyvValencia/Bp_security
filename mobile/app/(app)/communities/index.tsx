import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import {
  useBuscarComunidades,
  useMiComunidad,
} from '@/src/features/communities/hooks/useComunidades';
import type { Comunidad } from '@/src/features/communities/types';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function ComunidadesScreen() {
  const [termino, setTermino] = useState('');
  const usuario = useAuthStore((state) => state.usuario);
  // El admin gestiona comunidades desde su panel: no crea ni se une a ninguna.
  const esAdmin = usuario?.rol === 'administrador';
  const { data: miComunidad, isLoading: cargandoMiComunidad } = useMiComunidad();
  const {
    data: comunidades,
    isLoading,
    refetch,
    isFetching,
  } = useBuscarComunidades(termino || undefined);

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Comunidades</Text>

      {!cargandoMiComunidad && miComunidad ? (
        <Pressable
          style={styles.tarjetaMiComunidad}
          onPress={() => router.push(`/(app)/communities/${miComunidad.id}`)}
        >
          <Ionicons name="home" size={20} color={colors.acento} />
          <View style={{ flex: 1 }}>
            <Text style={styles.miComunidadEtiqueta}>MI COMUNIDAD</Text>
            <Text style={styles.miComunidadNombre}>{miComunidad.nombre}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textoSecundario} />
        </Pressable>
      ) : !cargandoMiComunidad && !esAdmin ? (
        <Boton
          titulo="Solicitar crear una comunidad"
          variante="secundario"
          onPress={() => router.push('/(app)/communities/create')}
        />
      ) : null}

      <View style={styles.separador} />

      <Campo
        etiqueta="Buscar por nombre o barrio"
        icono="search-outline"
        value={termino}
        onChangeText={setTermino}
        placeholder="La Floresta..."
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} />
      ) : (
        <FlatList
          data={comunidades}
          keyExtractor={(item) => String(item.id)}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.vacio}>No se encontraron comunidades.</Text>}
          renderItem={({ item }) => <TarjetaComunidad comunidad={item} />}
        />
      )}

      {esAdmin ? (
        <Link href="/(app)/admin/communities-management" style={styles.enlaceAdmin}>
          Gestión de comunidades (admin)
        </Link>
      ) : null}
    </PantallaSegura>
  );
}

function TarjetaComunidad({ comunidad }: { comunidad: Comunidad }) {
  return (
    <Pressable
      style={styles.item}
      onPress={() => router.push(`/(app)/communities/${comunidad.id}`)}
    >
      <View>
        <Text style={styles.itemNombre}>{comunidad.nombre}</Text>
        <Text style={styles.itemDetalle}>{comunidad.barrio}</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 16,
    textAlign: 'center',
  },
  tarjetaMiComunidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.acento + '55',
    borderRadius: 14,
    padding: 14,
  },
  miComunidadEtiqueta: {
    fontSize: 10,
    color: colors.textoSecundario,
    letterSpacing: 0.5,
  },
  miComunidadNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.texto,
  },
  separador: {
    height: 16,
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
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
  enlaceAdmin: {
    color: colors.acento,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});
