import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  pista?: string;
  icono?: ComponentProps<typeof Ionicons>['name'];
};

export function Boton({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  pista,
  icono,
}: Props) {
  const esPrimario = variante === 'primario';
  const colorContenido = esPrimario ? colores.textoSobrePrimario : colores.primario;

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
      {icono && <Ionicons name={icono} size={tamanios.icono} color={colorContenido} />}
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
    flexDirection: 'row',
    gap: espaciado.sm,
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
