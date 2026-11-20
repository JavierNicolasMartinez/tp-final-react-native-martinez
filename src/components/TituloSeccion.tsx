import { StyleSheet, Text } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';

type Props = {
  texto: string;
};

export function TituloSeccion({ texto }: Props) {
  return (
    <Text style={estilos.titulo} accessibilityRole="header">
      {texto}
    </Text>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontSize: tamanios.subtitulo,
    fontWeight: '700',
    color: colores.texto,
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.lg,
    paddingBottom: espaciado.sm,
  },
});
