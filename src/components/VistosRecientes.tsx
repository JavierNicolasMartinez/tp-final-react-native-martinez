import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { IconoDecorativo } from './IconoDecorativo';

const CANTIDAD = 3;

export function VistosRecientes() {
  const { recientes } = useBiblioteca();
  const todos = recientes.aArray();
  // Los 3 del tope, del más reciente al más antiguo.
  const ultimos = todos.slice(-CANTIDAD).reverse();

  if (ultimos.length === 0) return null;

  return (
    <View style={estilos.seccion}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Vistos recientemente
      </Text>
      {ultimos.map((libro, i) => (
        <Pressable
          // Un libro puede estar dos veces en la pila (A, B, A): la posición lo hace único.
          key={`${todos.length - i}-${libro.isbn}`}
          accessibilityRole="button"
          accessibilityHint="Abre el detalle del libro"
          onPress={() => router.push({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } })}
          style={estilos.fila}
        >
          <IconoDecorativo nombre="time-outline" tamanio={tamanios.icono} color={colores.textoSecundario} />
          <Text style={estilos.texto} numberOfLines={1}>
            {libro.titulo}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: {
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.md,
    padding: espaciado.sm,
    backgroundColor: colores.superficie,
    borderRadius: tamanios.radio,
    borderWidth: tamanios.borde,
    borderColor: colores.borde,
  },
  titulo: {
    fontSize: tamanios.textoChico,
    fontWeight: '700',
    color: colores.textoSecundario,
    paddingHorizontal: espaciado.sm,
    paddingTop: espaciado.xs,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    minHeight: tamanios.areaTactil,
    paddingHorizontal: espaciado.sm,
  },
  texto: {
    flex: 1,
    fontSize: tamanios.texto,
    color: colores.primario,
  },
});
