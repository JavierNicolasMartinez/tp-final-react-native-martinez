import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { buscarLibroPorIsbn } from '../lib/catalogo';
import { TituloSeccion } from './TituloSeccion';

export function MisEsperas() {
  const { esperas, posicionEnEspera } = useBiblioteca();
  const mias = Object.keys(esperas)
    .map((isbn) => ({ isbn, posicion: posicionEnEspera(isbn) }))
    .filter((espera) => espera.posicion > 0);

  return (
    <View>
      <TituloSeccion texto="En lista de espera" />
      {mias.length === 0 ? (
        <Text style={estilos.vacio}>No estás esperando ningún libro.</Text>
      ) : (
        mias.map(({ isbn, posicion }) => (
          <View key={isbn} style={estilos.fila}>
            <Text style={estilos.titulo}>{buscarLibroPorIsbn(isbn)?.titulo ?? `ISBN ${isbn}`}</Text>
            <Text style={estilos.posicion}>
              {posicion === 1 ? 'Estás primero' : `Lugar ${posicion}`}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciado.md,
    minHeight: tamanios.areaTactil,
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
    padding: espaciado.md,
    backgroundColor: colores.superficie,
    borderRadius: tamanios.radio,
    borderWidth: tamanios.borde,
    borderColor: colores.borde,
  },
  titulo: {
    flex: 1,
    fontSize: tamanios.texto,
    fontWeight: '600',
    color: colores.texto,
  },
  posicion: {
    fontSize: tamanios.texto,
    color: colores.aviso,
    fontWeight: '600',
  },
  vacio: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    paddingHorizontal: espaciado.md,
  },
});
