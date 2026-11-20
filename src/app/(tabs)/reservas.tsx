import { FlatList, StyleSheet, Text } from 'react-native';

import { AvisoApp } from '../../components/AvisoApp';
import { EstadoNotificaciones } from '../../components/EstadoNotificaciones';
import { MisEsperas } from '../../components/MisEsperas';
import { TarjetaPrestamo } from '../../components/TarjetaPrestamo';
import { TituloSeccion } from '../../components/TituloSeccion';
import { colores, espaciado, tamanios } from '../../constants/tema';
import { useBiblioteca } from '../../hooks/useBiblioteca';

export default function MisReservas() {
  const { prestamos, avisos, descartarAviso } = useBiblioteca();

  return (
    <FlatList
      data={prestamos}
      keyExtractor={(prestamo) => prestamo.isbn}
      renderItem={({ item }) => <TarjetaPrestamo prestamo={item} />}
      ListHeaderComponent={
        <>
          <EstadoNotificaciones />
          {avisos.map((aviso) => (
            <AvisoApp key={aviso.id} aviso={aviso} onDescartar={descartarAviso} />
          ))}
          <TituloSeccion texto="Mis préstamos" />
        </>
      }
      ListEmptyComponent={
        <Text style={estilos.vacio}>
          No tenés libros prestados. Reservá uno desde el catálogo.
        </Text>
      }
      ListFooterComponent={<MisEsperas />}
      contentContainerStyle={estilos.lista}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    paddingBottom: espaciado.xl,
  },
  vacio: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    paddingHorizontal: espaciado.md,
  },
});
