import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { Boton } from './Boton';

type Props = {
  titulo: string;
  mensaje: string;
};

export function NoEncontrado({ titulo, mensaje }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo} accessibilityRole="header">{titulo}</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      <Boton texto="Ir al catálogo" icono="library-outline" onPress={() => router.navigate('/')} />
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
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
    textAlign: 'center',
  },
  mensaje: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
