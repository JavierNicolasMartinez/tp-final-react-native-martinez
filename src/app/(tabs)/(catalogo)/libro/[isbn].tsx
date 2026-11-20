import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../../../../components/Boton';
import { DatoLibro } from '../../../../components/DatoLibro';
import { NoEncontrado } from '../../../../components/NoEncontrado';
import { colores, espaciado, tamanios } from '../../../../constants/tema';
import { useBiblioteca } from '../../../../hooks/useBiblioteca';
import { buscarLibroPorIsbn, esIsbnValido } from '../../../../lib/catalogo';
import { leerParametro } from '../../../../lib/rutas';

export default function DetalleLibro() {
  const isbn = leerParametro(useLocalSearchParams<{ isbn: string }>().isbn);
  const libro = esIsbnValido(isbn) ? buscarLibroPorIsbn(isbn) : undefined;
  const { disponibles, esperas, tienePrestamo, posicionEnEspera, verLibro } = useBiblioteca();

  // Cada vez que se abre un detalle válido, el libro va a la pila de recientes.
  useEffect(() => {
    if (libro) verLibro(libro);
  }, [libro, verLibro]);

  if (!esIsbnValido(isbn)) {
    return (
      <>
        <Stack.Screen options={{ title: 'ISBN inválido' }} />
        <NoEncontrado
          titulo="Ese código no es un ISBN"
          mensaje={`"${isbn}" no sirve: un ISBN tiene 13 números, sin letras ni guiones.`}
        />
      </>
    );
  }

  if (!libro) {
    return (
      <>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <NoEncontrado
          titulo="No tenemos ese libro"
          mensaje={`No hay ningún libro con el ISBN ${isbn} en el catálogo de la biblioteca.`}
        />
      </>
    );
  }

  const enEspera = esperas[libro.isbn]?.tamanio ?? 0;
  const posicion = posicionEnEspera(libro.isbn);

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: libro.titulo }} />
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <View>
        <DatoLibro etiqueta="Autor" valor={libro.autor} />
        <DatoLibro etiqueta="Año" valor={String(libro.anio)} />
        <DatoLibro etiqueta="ISBN" valor={libro.isbn} />
        <DatoLibro etiqueta="Ejemplares disponibles" valor={String(disponibles(libro))} />
        <DatoLibro etiqueta="Personas en lista de espera" valor={String(enEspera)} />
      </View>
      {tienePrestamo(libro.isbn) ? (
        <Text style={estilos.estado}>Ya tenés este libro prestado.</Text>
      ) : posicion > 0 ? (
        <Text style={estilos.estado}>Estás en la lista de espera, en el lugar {posicion}.</Text>
      ) : (
        <Boton
          texto="Reservar"
          icono="bookmark-outline"
          onPress={() =>
            router.push({ pathname: '/reservar/[isbn]', params: { isbn: libro.isbn } })
          }
        />
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: espaciado.lg,
    padding: espaciado.lg,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  estado: {
    fontSize: tamanios.texto,
    color: colores.aviso,
    backgroundColor: colores.avisoFondo,
    padding: espaciado.md,
    borderRadius: tamanios.radio,
  },
});
