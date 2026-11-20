import { router, Stack, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '../components/Boton';
import { colores, espaciado, tamanios } from '../constants/tema';

export default function PaginaNoEncontrada() {
  const ruta = usePathname();

  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Esta página no existe</Text>
        <Text style={estilos.texto}>No encontramos nada en la dirección</Text>
        <Text style={estilos.ruta}>{ruta}</Text>
        <Boton texto="Ir al catálogo" onPress={() => router.replace('/')} />
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.md,
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
  ruta: {
    fontSize: tamanios.texto,
    fontWeight: '600',
    color: colores.error,
  },
});
