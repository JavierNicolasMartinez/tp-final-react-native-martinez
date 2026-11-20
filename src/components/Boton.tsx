import { Pressable, StyleSheet, Text } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  pista?: string;
};

export function Boton({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  pista,
}: Props) {
  const esPrimario = variante === 'primario';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={pista}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        esPrimario ? estilos.primario : estilos.secundario,
        pressed && estilos.presionado,
        deshabilitado && estilos.deshabilitado,
      ]}
    >
      <Text style={[estilos.texto, esPrimario ? estilos.textoPrimario : estilos.textoSecundario]}>
        {texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: tamanios.areaTactil,
    minWidth: tamanios.areaTactil,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    borderRadius: tamanios.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: colores.primario,
  },
  secundario: {
    backgroundColor: colores.superficie,
    borderWidth: tamanios.borde,
    borderColor: colores.primario,
  },
  presionado: {
    opacity: 0.8,
  },
  deshabilitado: {
    opacity: 0.4,
  },
  texto: {
    fontSize: tamanios.texto,
    fontWeight: '600',
  },
  textoPrimario: {
    color: colores.textoSobrePrimario,
  },
  textoSecundario: {
    color: colores.primario,
  },
});
