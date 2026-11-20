import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { textosPermiso } from '../constants/permisos';
import { colores, espaciado, tamanios } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { usePermiso } from '../hooks/usePermiso';
import { useRecordatorio } from '../hooks/useRecordatorio';
import type { Recurso } from '../types/permisos';
import { Boton } from './Boton';
import { EstadoCargando } from './EstadoCargando';

type Props = {
  recurso: Recurso;
  // Si se llegó desde "Recordarme", el préstamo al que hay que programarle el recordatorio.
  isbn?: string;
};

function volver() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function PantallaPermiso({ recurso, isbn }: Props) {
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);
  const { programar } = useRecordatorio();
  const { agregarAviso } = useBiblioteca();
  const textos = textosPermiso[recurso];

  // El diálogo del sistema aparece recién acá, cuando la persona ya leyó para qué sirve.
  async function continuar() {
    const concedido = estado === 'concedido' || (await pedir()).granted;
    if (recurso === 'notificaciones' && isbn) {
      if (concedido) await programar(isbn);
      else agregarAviso('Sin notificaciones no podemos recordarte: revisá la fecha acá.');
    }
    volver();
  }

  if (estado === 'cargando') return <EstadoCargando mensaje="Revisando el permiso…" />;

  return (
    <View style={estilos.contenedor}>
      <Ionicons
        name={recurso === 'camara' ? 'camera-outline' : 'notifications-outline'}
        size={tamanios.iconoGrande}
        color={colores.primario}
      />
      <Text style={estilos.titulo}>{textos.titulo}</Text>
      <Text style={estilos.texto}>
        {estado === 'bloqueado' ? textos.bloqueado : textos.beneficio}
      </Text>
      {estado === 'bloqueado' ? (
        <Boton texto="Abrir Ajustes" icono="settings-outline" onPress={abrirAjustes} />
      ) : (
        <Boton texto="Continuar" onPress={continuar} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.md,
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
