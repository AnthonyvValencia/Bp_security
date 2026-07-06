import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import type { TipoSangre } from '@/src/features/auth/types';
import { useActualizarPerfil } from '@/src/features/profile/hooks/useActualizarPerfil';
import { usePerfil } from '@/src/features/profile/hooks/usePerfil';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { SelectorChips } from '@/src/shared/components/SelectorChips';
import { colors } from '@/src/shared/theme/colors';

const OPCIONES_TIPO_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export default function EditarPerfilScreen() {
  const { data: usuario, isLoading } = usePerfil();
  const { mutate, isPending, error } = useActualizarPerfil();

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    barrio: '',
    numero_casa: '',
    referencias_domicilio: '',
    tipo_sangre: '',
    condiciones_medicas: '',
  });

  useEffect(() => {
    if (usuario) {
      setForm({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        barrio: usuario.barrio,
        numero_casa: usuario.numero_casa,
        referencias_domicilio: usuario.referencias_domicilio ?? '',
        tipo_sangre: usuario.tipo_sangre ?? '',
        condiciones_medicas: usuario.condiciones_medicas ?? '',
      });
    }
  }, [usuario]);

  const actualizarCampo = (campo: keyof typeof form) => (valor: string) =>
    setForm((anterior) => ({ ...anterior, [campo]: valor }));

  if (isLoading) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        enableOnAndroid
        extraScrollHeight={24}
      >
        <Text style={styles.titulo}>Editar perfil</Text>

        <Campo etiqueta="Nombres" value={form.nombres} onChangeText={actualizarCampo('nombres')} />
        <Campo
          etiqueta="Apellidos"
          value={form.apellidos}
          onChangeText={actualizarCampo('apellidos')}
        />
        <Campo
          etiqueta="Teléfono"
          value={form.telefono}
          onChangeText={actualizarCampo('telefono')}
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="Dirección"
          value={form.direccion}
          onChangeText={actualizarCampo('direccion')}
        />
        <Campo etiqueta="Barrio" value={form.barrio} onChangeText={actualizarCampo('barrio')} />
        <Campo
          etiqueta="Número de casa"
          value={form.numero_casa}
          onChangeText={actualizarCampo('numero_casa')}
        />
        <Campo
          etiqueta="Referencias del domicilio"
          value={form.referencias_domicilio}
          onChangeText={actualizarCampo('referencias_domicilio')}
          multiline
        />
        <SelectorChips
          etiqueta="Tipo de sangre"
          opciones={OPCIONES_TIPO_SANGRE}
          valor={form.tipo_sangre}
          onCambiar={(valor) => setForm((anterior) => ({ ...anterior, tipo_sangre: valor }))}
        />
        <Campo
          etiqueta="Condiciones médicas"
          value={form.condiciones_medicas}
          onChangeText={actualizarCampo('condiciones_medicas')}
          multiline
        />

        {error ? <Text style={styles.error}>No se pudo guardar. Intenta de nuevo.</Text> : null}

        <Boton
          titulo="Guardar cambios"
          cargando={isPending}
          onPress={() =>
            mutate(
              { ...form, tipo_sangre: (form.tipo_sangre || null) as TipoSangre | null },
              { onSuccess: () => router.back() },
            )
          }
        />
      </KeyboardAwareScrollView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: colors.peligro,
    textAlign: 'center',
    marginBottom: 12,
  },
});
