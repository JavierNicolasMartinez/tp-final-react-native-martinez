import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  mensaje: string;
};

export function EstadoVacio({ mensaje }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
