import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  valor: string;
  onCambiar: (texto: string) => void;
};

export function CampoBusqueda({ valor, onCambiar }: Props) {
  return (
    <View style={estilos.caja}>
      <Ionicons name="search" size={tamanios.icono} color={colores.textoSecundario} />
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder="Título o autor"
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel="Buscar por título o autor"
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
        style={estilos.entrada}
      />
      {valor !== '' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar la búsqueda"
          onPress={() => onCambiar('')}
          style={estilos.borrar}
        >
          <Ionicons name="close-circle" size={tamanios.icono} color={colores.textoSecundario} />
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    margin: espaciado.md,
    paddingLeft: espaciado.md,
    backgroundColor: colores.superficie,
    borderWidth: tamanios.borde,
    borderColor: colores.borde,
    borderRadius: tamanios.radio,
  },
  entrada: {
    flex: 1,
    minHeight: tamanios.areaTactil,
    fontSize: tamanios.texto,
    color: colores.texto,
  },
  borrar: {
    minWidth: tamanios.areaTactil,
    minHeight: tamanios.areaTactil,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
