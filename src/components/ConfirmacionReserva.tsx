import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DIAS_PRESTAMO } from '../constants/biblioteca';
import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { calcularVencimiento, formatearFecha } from '../lib/fechas';
import type { Libro } from '../types';
import { Boton } from './Boton';

type Props = {
  libro: Libro;
};

export function ConfirmacionReserva({ libro }: Props) {
  const { disponibles, esperas, tienePrestamo, posicionEnEspera, reservar, agregarAviso } =
    useBiblioteca();
  const [ahora] = useState(() => Date.now());

  const yaReservado = tienePrestamo(libro.isbn) || posicionEnEspera(libro.isbn) > 0;
  const cola = esperas[libro.isbn];
  const hayPrestamo = disponibles(libro) > 0 && (!cola || cola.vacia);

  function confirmar() {
    const resultado = reservar(libro);
    if (resultado.tipo === 'prestamo') {
      agregarAviso(
        `Listo: ${libro.titulo} es tuyo hasta el ${formatearFecha(resultado.vence)}.`,
      );
    } else if (resultado.tipo === 'espera') {
      agregarAviso(
        `Te anotamos en la lista de espera de ${libro.titulo}. Estás en el lugar ${resultado.posicion}.`,
      );
    }
    // Cierra el modal y lleva a /reservas: la confirmación no queda en el historial.
    router.dismissTo('/reservas');
  }

  if (yaReservado) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.aviso}>Ya reservaste este libro. No se puede reservar dos veces.</Text>
        <Boton texto="Ver mis reservas" onPress={() => router.dismissTo('/reservas')} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.subtitulo}>{libro.autor}</Text>
      {hayPrestamo ? (
        <Text style={estilos.exito}>
          Hay un ejemplar para vos. Te lo prestamos por {DIAS_PRESTAMO} días: lo tenés que
          devolver antes del{' '}
          {formatearFecha(calcularVencimiento(ahora))}.
        </Text>
      ) : (
        <Text style={estilos.aviso}>
          Ahora no hay ejemplares. Si confirmás, entrás a la lista de espera en el lugar{' '}
          {(cola?.tamanio ?? 0) + 1}.
        </Text>
      )}
      <Boton
        texto={hayPrestamo ? 'Confirmar préstamo' : 'Anotarme en la lista'}
        onPress={confirmar}
      />
      <Boton texto="Cancelar" variante="secundario" onPress={() => router.back()} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    gap: espaciado.md,
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  subtitulo: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
  },
  exito: {
    fontSize: tamanios.texto,
    color: colores.exito,
    backgroundColor: colores.exitoFondo,
    padding: espaciado.md,
    borderRadius: tamanios.radio,
  },
  aviso: {
    fontSize: tamanios.texto,
    color: colores.aviso,
    backgroundColor: colores.avisoFondo,
    padding: espaciado.md,
    borderRadius: tamanios.radio,
  },
});
