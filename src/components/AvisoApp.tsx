import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import type { Aviso } from '../types/biblioteca';

type Props = {
  aviso: Aviso;
  onDescartar: (id: string) => void;
};

export function AvisoApp({ aviso, onDescartar }: Props) {
  return (
    <View style={estilos.caja} accessibilityRole="alert">
      <Ionicons name="notifications-outline" size={tamanios.icono} color={colores.primario} />
      <Text style={estilos.texto}>{aviso.texto}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
        onPress={() => onDescartar(aviso.id)}
        style={estilos.cerrar}
      >
        <Ionicons name="close" size={tamanios.icono} color={colores.textoSecundario} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.sm,
    paddingLeft: espaciado.md,
    backgroundColor: colores.superficie,
    borderLeftWidth: espaciado.xs,
    borderLeftColor: colores.primario,
    borderRadius: tamanios.radio,
  },
  texto: {
    flex: 1,
    paddingVertical: espaciado.sm,
    fontSize: tamanios.texto,
    color: colores.texto,
  },
  cerrar: {
    minWidth: tamanios.areaTactil,
    minHeight: tamanios.areaTactil,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
