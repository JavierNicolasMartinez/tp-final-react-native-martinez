import { FlatList } from 'react-native';

import type { Libro } from '../types';
import { EstadoCargando } from './EstadoCargando';
import { EstadoError } from './EstadoError';
import { EstadoVacio } from './EstadoVacio';
import { FilaLibro } from './FilaLibro';

type Props = {
  texto: string;
  resultados: Libro[];
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
};

export function ResultadosBusqueda({ texto, resultados, cargando, error, onReintentar }: Props) {
  if (texto.trim() === '') {
    return <EstadoVacio mensaje="Escribí un título o un autor para buscar en el catálogo." />;
  }
  if (cargando) return <EstadoCargando mensaje="Buscando…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={onReintentar} />;

  return (
    <FlatList
      data={resultados}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <FilaLibro libro={item} />}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <EstadoVacio mensaje={`No encontramos libros para "${texto.trim()}".`} />
      }
    />
  );
}
