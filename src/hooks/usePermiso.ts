import { createPermissionHook } from 'expo';
import { useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState, Linking } from 'react-native';

import { consultarPermisoNotificaciones, pedirPermisoNotificaciones } from '../lib/notificaciones';
import { calcularEstado } from '../lib/permisos';
import type { Recurso } from '../types/permisos';

// expo-notifications no trae un hook: lo armo igual que useCameraPermissions.
const usePermisoNotificaciones = createPermissionHook({
  getMethod: consultarPermisoNotificaciones,
  requestMethod: pedirPermisoNotificaciones,
});

export function usePermiso(recurso: Recurso) {
  // Los dos hooks se llaman siempre (regla de los hooks); solo se usa el del recurso.
  const camara = useCameraPermissions({ get: false });
  const notificaciones = usePermisoNotificaciones({ get: false });
  const [respuesta, pedir, consultar] = recurso === 'camara' ? camara : notificaciones;

  // Vuelve a consultar cada vez que la pantalla recibe el foco...
  useFocusEffect(
    useCallback(() => {
      consultar();
    }, [consultar]),
  );

  // ...y cuando la app vuelve a primer plano (por ejemplo, al volver de Ajustes).
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') consultar();
    });
    return () => suscripcion.remove();
  }, [consultar]);

  const abrirAjustes = useCallback(() => {
    Linking.openSettings();
  }, []);

  return {
    estado: calcularEstado(respuesta),
    pedir,
    abrirAjustes,
  };
}
