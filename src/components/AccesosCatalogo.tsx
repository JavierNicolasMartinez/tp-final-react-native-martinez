import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { espaciado } from '../constants/tema';
import { Boton } from './Boton';

export function AccesosCatalogo() {
  return (
    <View style={estilos.fila}>
      <View style={estilos.celda}>
        <Boton
          texto="Buscar"
          icono="search"
          variante="secundario"
          onPress={() => router.push('/buscar')}
        />
      </View>
      <View style={estilos.celda}>
        <Boton
          texto="Escanear"
          icono="barcode-outline"
          variante="secundario"
          onPress={() => router.push('/escanear')}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: espaciado.sm,
    padding: espaciado.md,
  },
  celda: {
    flex: 1,
  },
});
