import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { credencialesValidas } from '../lib/sesion';
import { Boton } from './Boton';

export function FormularioLogin() {
  const { iniciarSesion } = useBiblioteca();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);

  function ingresar() {
    if (!credencialesValidas(usuario, clave)) {
      setError('El usuario o la clave no son correctos. Revisalos y probá de nuevo.');
      return;
    }
    // No se navega a mano: al cambiar la sesión, Stack.Protected saca el login solo.
    iniciarSesion();
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>Ingreso solo para el personal de la biblioteca.</Text>
      <TextInput
        value={usuario}
        onChangeText={setUsuario}
        placeholder="Usuario"
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel="Usuario"
        autoCapitalize="none"
        autoCorrect={false}
        style={estilos.entrada}
      />
      <TextInput
        value={clave}
        onChangeText={setClave}
        placeholder="Clave"
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel="Clave"
        secureTextEntry
        onSubmitEditing={ingresar}
        style={estilos.entrada}
      />
      {error && (
        <Text style={estilos.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      <Boton texto="Ingresar" icono="log-in-outline" onPress={ingresar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    gap: espaciado.md,
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
  entrada: {
    minHeight: tamanios.areaTactil,
    paddingHorizontal: espaciado.md,
    fontSize: tamanios.texto,
    color: colores.texto,
    backgroundColor: colores.superficie,
    borderWidth: tamanios.borde,
    borderColor: colores.borde,
    borderRadius: tamanios.radio,
  },
  error: {
    fontSize: tamanios.texto,
    color: colores.error,
    backgroundColor: colores.errorFondo,
    padding: espaciado.md,
    borderRadius: tamanios.radio,
  },
});
