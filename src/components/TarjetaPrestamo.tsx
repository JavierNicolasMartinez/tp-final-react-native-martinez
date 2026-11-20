import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { buscarLibroPorIsbn } from '../lib/catalogo';
import { formatearFecha } from '../lib/fechas';
import type { Prestamo } from '../types/biblioteca';
import { Boton } from './Boton';

type Props = {
  prestamo: Prestamo;
};

export function TarjetaPrestamo({ prestamo }: Props) {
  const { devolver, agregarAviso } = useBiblioteca();
  const libro = buscarLibroPorIsbn(prestamo.isbn);
  const titulo = libro?.titulo ?? `ISBN ${prestamo.isbn}`;

  function alDevolver() {
    devolver(prestamo.isbn);
    agregarAviso(`Devolviste ${titulo}. ¡Gracias!`);
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.vence}>Devolvelo antes del {formatearFecha(prestamo.vence)}</Text>
      <Boton texto="Devolver" variante="secundario" icono="return-down-back" onPress={alDevolver} />
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espaciado.sm,
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
    padding: espaciado.md,
    backgroundColor: colores.superficie,
    borderRadius: tamanios.radio,
    borderWidth: tamanios.borde,
    borderColor: colores.borde,
  },
  titulo: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
  },
  vence: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
});
