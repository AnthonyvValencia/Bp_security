import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {
  useContactosEmergencia,
  useCrearContactoEmergencia,
  useEliminarContactoEmergencia,
} from '@/src/features/profile/hooks/useContactosEmergencia';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function ContactosEmergenciaScreen() {
  const { data: contactos, isLoading } = useContactosEmergencia();
  const { mutate: crear, isPending: creando } = useCrearContactoEmergencia();
  const { mutate: eliminar } = useEliminarContactoEmergencia();

  const [form, setForm] = useState({ nombre: '', telefono: '', parentesco: '' });
  const [errorTelefono, setErrorTelefono] = useState<string>();

  const actualizarCampo = (campo: keyof typeof form) => (valor: string) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  };

  // Deja escribir solo un + inicial opcional y como máximo 10 dígitos, para que
  // el valor nunca exceda lo que acepta el backend (ContactoEmergenciaRequest).
  const cambiarTelefono = (valor: string) => {
    const tieneMas = valor.trimStart().startsWith('+');
    const digitos = valor.replace(/\D/g, '').slice(0, 10);
    const telefono = `${tieneMas ? '+' : ''}${digitos}`;

    setForm((anterior) => ({ ...anterior, telefono }));
    setErrorTelefono(undefined);
  };

  // Debe coincidir con la regla del backend (ContactoEmergenciaRequest): solo
  // dígitos con un + inicial opcional, para que el teléfono sirva a los enlaces
  // tel:/sms: del botón de pánico.
  const TELEFONO_VALIDO = /^\+?[0-9]{9,10}$/;

  const agregar = () => {
    const telefono = form.telefono.trim();

    if (!TELEFONO_VALIDO.test(telefono)) {
      setErrorTelefono('Ingresa un teléfono válido: Solo numeros de 10 digitos.');

      return;
    }

    crear(
      { ...form, telefono },
      { onSuccess: () => setForm({ nombre: '', telefono: '', parentesco: '' }) },
    );
  };

  return (
    <PantallaSegura>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        enableOnAndroid
        extraScrollHeight={24}
      >
        <Text style={styles.titulo}>Contactos de emergencia</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.acento} />
        ) : !contactos || contactos.length === 0 ? (
          <Text style={styles.vacio}>Aún no tienes contactos agregados.</Text>
        ) : (
          // Lista corta renderizada con map (no FlatList): una lista virtualizada
          // anidada en el ScrollView de esta pantalla dispara el warning de
          // "VirtualizedLists should never be nested inside plain ScrollViews".
          <View style={styles.lista}>
            {contactos.map((item) => (
              <View key={item.id} style={styles.item}>
                <View>
                  <Text style={styles.itemNombre}>{item.nombre}</Text>
                  <Text style={styles.itemDetalle}>
                    {item.telefono} {item.parentesco ? `· ${item.parentesco}` : ''}
                  </Text>
                </View>
                <Boton titulo="Eliminar" variante="secundario" onPress={() => eliminar(item.id)} />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.subtitulo}>Agregar nuevo contacto</Text>
        <Campo etiqueta="Nombre" value={form.nombre} onChangeText={actualizarCampo('nombre')} />
        <Campo
          etiqueta="Teléfono"
          value={form.telefono}
          onChangeText={cambiarTelefono}
          keyboardType="phone-pad"
          maxLength={11}
          error={errorTelefono}
        />
        <Campo
          etiqueta="Parentesco"
          value={form.parentesco}
          onChangeText={actualizarCampo('parentesco')}
        />

        <Boton titulo="Agregar contacto" cargando={creando} onPress={agregar} />
      </KeyboardAwareScrollView>
    </PantallaSegura>
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
  subtitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textoSecundario,
    marginBottom: 12,
    marginTop: 8,
  },
  lista: {
    marginBottom: 8,
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
});
