import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, tamanios } from '../constants/tema';
import { usePermiso } from '../hooks/usePermiso';
import type { EstadoPermiso } from '../types/permisos';
import { IconoDecorativo } from './IconoDecorativo';

const TEXTOS: Record<EstadoPermiso, string> = {
  cargando: 'Revisando las notificaciones…',
  concedido: 'Notificaciones permitidas: te recordamos cuándo devolver.',
  preguntable: 'Activá "Recordarme" en un préstamo para recibir un recordatorio.',
  bloqueado: 'Notificaciones bloqueadas: los avisos te aparecen acá, dentro de la app.',
};

export function EstadoNotificaciones() {
  const { estado } = usePermiso('notificaciones');

  return (
    <View style={estilos.fila}>
      <IconoDecorativo
        nombre={estado === 'concedido' ? 'notifications' : 'notifications-off-outline'}
        tamanio={tamanios.icono}
        color={estado === 'concedido' ? colores.exito : colores.textoSecundario}
      />
      <Text style={estilos.texto}>{TEXTOS[estado]}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  texto: {
    flex: 1,
    fontSize: tamanios.textoChico,
    color: colores.textoSecundario,
  },
});
