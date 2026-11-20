import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import type { Libro } from '../types';

type Props = {
  libro: Libro;
};

export function FilaLibro({ libro }: Props) {
  const { disponibles } = useBiblioteca();
  const cantidad = disponibles(libro);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Abre el detalle del libro"
      onPress={() => router.push({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } })}
      style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
    >
      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.detalle}>
          {libro.autor} · {libro.anio}
        </Text>
        <Text style={cantidad > 0 ? estilos.hay : estilos.noHay}>
          {cantidad === 0
            ? 'Sin ejemplares por ahora'
            : `${cantidad} ${cantidad === 1 ? 'disponible' : 'disponibles'}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={tamanios.icono} color={colores.textoSecundario} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: tamanios.areaTactil,
    padding: espaciado.md,
    backgroundColor: colores.superficie,
    borderBottomWidth: tamanios.borde,
    borderBottomColor: colores.borde,
  },
  presionada: {
    backgroundColor: colores.fondo,
  },
  textos: {
    flex: 1,
    gap: espaciado.xs,
  },
  titulo: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
  },
  detalle: {
    fontSize: tamanios.textoChico,
    color: colores.textoSecundario,
  },
  hay: {
    fontSize: tamanios.textoChico,
    color: colores.exito,
  },
  noHay: {
    fontSize: tamanios.textoChico,
    color: colores.aviso,
  },
});
