import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  etiqueta: string;
  valor: string;
};

export function DatoLibro({ etiqueta, valor }: Props) {
  return (
    <View style={estilos.fila}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: espaciado.md,
    paddingVertical: espaciado.sm,
    borderBottomWidth: tamanios.borde,
    borderBottomColor: colores.borde,
  },
  etiqueta: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
  valor: {
    flexShrink: 1,
    fontSize: tamanios.texto,
    fontWeight: '600',
    color: colores.texto,
    textAlign: 'right',
  },
});
