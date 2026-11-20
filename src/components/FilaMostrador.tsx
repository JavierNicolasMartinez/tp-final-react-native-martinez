import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import type { Cola } from '../estructuras/Cola';
import type { Libro } from '../types';
import { Boton } from './Boton';

type Props = {
  libro: Libro;
  cola: Cola<string>;
  onEntregar: (libro: Libro) => void;
};

export function FilaMostrador({ libro, cola, onEntregar }: Props) {
  const frente = cola.frente();

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.dato}>
        {frente ? `Al frente: ${frente}` : 'Nadie está esperando este libro.'}
      </Text>
      {!cola.vacia && (
        <Text style={estilos.dato}>
          {cola.tamanio === 1 ? 'Espera 1 persona' : `Esperan ${cola.tamanio} personas`}
        </Text>
      )}
      <Boton
        texto="Entregar al siguiente"
        icono="hand-right-outline"
        deshabilitado={cola.vacia}
        pista="Simula que se devolvió un ejemplar y se lo da a quien está al frente"
        onPress={() => onEntregar(libro)}
      />
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
  dato: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
});
