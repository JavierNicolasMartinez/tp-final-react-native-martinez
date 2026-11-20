import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { Boton } from './Boton';

type Props = {
  onAbrir: (isbn: string) => void;
};

export function IngresoIsbn({ onAbrir }: Props) {
  const [texto, setTexto] = useState('');

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>¿No podés escanear? Escribí el ISBN</Text>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Por ejemplo 9788499089508"
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel="ISBN del libro, 13 números"
        keyboardType="number-pad"
        maxLength={13}
        returnKeyType="go"
        onSubmitEditing={() => onAbrir(texto)}
        style={estilos.entrada}
      />
      <Boton texto="Abrir libro" icono="book-outline" onPress={() => onAbrir(texto)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: espaciado.sm,
  },
  titulo: {
    fontSize: tamanios.texto,
    fontWeight: '600',
    color: colores.texto,
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
});
