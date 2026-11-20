import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { Boton } from './Boton';

type Props = {
  mensaje: string;
  onReintentar: () => void;
};

export function EstadoError({ mensaje, onReintentar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto} accessibilityRole="alert">
        {mensaje}
      </Text>
      <Boton texto="Reintentar" icono="refresh" onPress={onReintentar} />
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
    color: colores.error,
    textAlign: 'center',
  },
});
