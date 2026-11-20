import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../components/Boton';
import { EstadoVacio } from '../components/EstadoVacio';
import { FilaMostrador } from '../components/FilaMostrador';
import { ALUMNO } from '../constants/biblioteca';
import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { buscarLibroPorIsbn } from '../lib/catalogo';
import { notificarEntrega } from '../lib/notificaciones';
import type { Libro } from '../types';

export default function Mostrador() {
  const { esperas, entregarAlSiguiente, agregarAviso, cerrarSesion } = useBiblioteca();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const libros = Object.keys(esperas)
    .map((isbn) => buscarLibroPorIsbn(isbn))
    .filter((libro): libro is Libro => libro !== undefined);

  async function entregar(libro: Libro) {
    const persona = entregarAlSiguiente(libro.isbn);
    if (!persona) {
      setMensaje(`Nadie está esperando ${libro.titulo}: no hay a quién entregarlo.`);
      return;
    }
    setMensaje(`Entregaste ${libro.titulo} a ${persona}.`);
    if (persona === ALUMNO) {
      const notificado = await notificarEntrega(libro.titulo);
      if (!notificado) {
        agregarAviso(`¡Te entregaron ${libro.titulo}! Pasá a buscarlo por la biblioteca.`);
      }
    }
  }

  return (
    <FlatList
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => (
        <FilaMostrador libro={item} cola={esperas[item.isbn]} onEntregar={entregar} />
      )}
      ListHeaderComponent={
        mensaje ? (
          <Text style={estilos.mensaje} accessibilityRole="alert">
            {mensaje}
          </Text>
        ) : undefined
      }
      ListEmptyComponent={<EstadoVacio mensaje="Ningún libro tiene lista de espera." />}
      ListFooterComponent={
        <View style={estilos.pie}>
          {/* Al cerrar la sesión, Stack.Protected saca el mostrador del historial. */}
          <Boton
            texto="Cerrar sesión"
            variante="secundario"
            icono="log-out-outline"
            onPress={cerrarSesion}
          />
        </View>
      }
      contentContainerStyle={estilos.lista}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    paddingTop: espaciado.md,
    paddingBottom: espaciado.xl,
  },
  mensaje: {
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.md,
    padding: espaciado.md,
    fontSize: tamanios.texto,
    color: colores.exito,
    backgroundColor: colores.exitoFondo,
    borderRadius: tamanios.radio,
  },
  pie: {
    padding: espaciado.md,
  },
});
