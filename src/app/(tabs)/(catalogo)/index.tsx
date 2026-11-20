import { FlatList, StyleSheet } from 'react-native';

import { AccesosCatalogo } from '../../../components/AccesosCatalogo';
import { EstadoCargando } from '../../../components/EstadoCargando';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { FilaLibro } from '../../../components/FilaLibro';
import { VistosRecientes } from '../../../components/VistosRecientes';
import { espaciado } from '../../../constants/tema';
import { useLibros } from '../../../hooks/useLibros';

export default function Catalogo() {
  const { libros, cargando, error, reintentar } = useLibros();

  if (cargando) return <EstadoCargando mensaje="Cargando el catálogo…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={reintentar} />;

  return (
    <FlatList
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <FilaLibro libro={item} />}
      ListHeaderComponent={
        <>
          <AccesosCatalogo />
          <VistosRecientes />
        </>
      }
      ListEmptyComponent={<EstadoVacio mensaje="Todavía no hay libros en el catálogo." />}
      contentContainerStyle={estilos.lista}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    paddingBottom: espaciado.xl,
  },
});
