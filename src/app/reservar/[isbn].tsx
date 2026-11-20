import { useLocalSearchParams } from 'expo-router';

import { ConfirmacionReserva } from '../../components/ConfirmacionReserva';
import { NoEncontrado } from '../../components/NoEncontrado';
import { buscarLibroPorIsbn, esIsbnValido } from '../../lib/catalogo';
import { leerParametro } from '../../lib/rutas';

export default function Reservar() {
  const isbn = leerParametro(useLocalSearchParams<{ isbn: string }>().isbn);
  const libro = esIsbnValido(isbn) ? buscarLibroPorIsbn(isbn) : undefined;

  if (!libro) {
    return (
      <NoEncontrado
        titulo="No se puede reservar"
        mensaje="No encontramos ese libro en el catálogo. Volvé al catálogo y elegilo de la lista."
      />
    );
  }

  return <ConfirmacionReserva libro={libro} />;
}
