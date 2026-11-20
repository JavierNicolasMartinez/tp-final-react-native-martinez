import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  mensaje: string;
};

export function EstadoCargando({ mensaje }: Props) {
  return (
    <View style={estilos.contenedor} accessibilityRole="progressbar" accessibilityLabel={mensaje}>
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.md,
    padding: espaciado.lg,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
});
