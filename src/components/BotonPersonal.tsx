import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';

export function BotonPersonal() {
  const { sesion } = useBiblioteca();

  return (
    <Link href={sesion ? '/mostrador' : '/login'} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={sesion ? 'Abre el mostrador' : 'Abre el ingreso del personal'}
        style={estilos.boton}
      >
        <Text style={estilos.texto}>Personal</Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: tamanios.areaTactil,
    minWidth: tamanios.areaTactil,
    justifyContent: 'center',
    paddingHorizontal: espaciado.sm,
  },
  texto: {
    color: colores.textoSobrePrimario,
    fontSize: tamanios.texto,
    fontWeight: '600',
  },
});
