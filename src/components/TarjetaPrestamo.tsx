import { StyleSheet, Switch, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useRecordatorio } from '../hooks/useRecordatorio';
import { buscarLibroPorIsbn } from '../lib/catalogo';
import { formatearFecha } from '../lib/fechas';
import { cancelarRecordatorio } from '../lib/notificaciones';
import type { Prestamo } from '../types/biblioteca';
import { Boton } from './Boton';

type Props = {
  prestamo: Prestamo;
};

export function TarjetaPrestamo({ prestamo }: Props) {
  const { devolver, agregarAviso } = useBiblioteca();
  const { activar, desactivar } = useRecordatorio();
  const libro = buscarLibroPorIsbn(prestamo.isbn);
  const titulo = libro?.titulo ?? `ISBN ${prestamo.isbn}`;
  const recordar = prestamo.notificacionId !== null;

  function alDevolver() {
    // Si quedaba un recordatorio programado, se cancela: el libro ya no está prestado.
    if (prestamo.notificacionId) cancelarRecordatorio(prestamo.notificacionId);
    devolver(prestamo.isbn);
    agregarAviso(`Devolviste ${titulo}. ¡Gracias!`);
  }

  function alCambiarRecordatorio(valor: boolean) {
    if (valor) activar(prestamo.isbn);
    else desactivar(prestamo.isbn);
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.vence}>Devolvelo antes del {formatearFecha(prestamo.vence)}</Text>
      <View style={estilos.fila}>
        <Text style={estilos.etiqueta}>Recordarme</Text>
        <Switch
          value={recordar}
          onValueChange={alCambiarRecordatorio}
          accessibilityLabel={`Recordarme la devolución de ${titulo}`}
          trackColor={{ true: colores.primario, false: colores.borde }}
        />
      </View>
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: tamanios.areaTactil,
  },
  etiqueta: {
    fontSize: tamanios.texto,
    color: colores.texto,
  },
});
