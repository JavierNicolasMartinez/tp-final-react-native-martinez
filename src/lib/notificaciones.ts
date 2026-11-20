import { PermissionStatus } from 'expo';
import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { CANAL_PRESTAMOS } from '../constants/notificaciones';

// Si el sistema no deja consultar (por ejemplo en la web), se trata como bloqueado
// y la app avisa adentro en lugar de mandar notificaciones.
const SIN_SOPORTE: NotificationPermissionsStatus = {
  status: PermissionStatus.DENIED,
  granted: false,
  canAskAgain: false,
  expires: 'never',
};

// En Android 13 o más el canal tiene que existir antes de pedir el permiso.
async function crearCanalPrestamos(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await setNotificationChannelAsync(CANAL_PRESTAMOS, {
    name: 'Préstamos',
    importance: AndroidImportance.HIGH,
  });
}

export async function consultarPermisoNotificaciones(): Promise<NotificationPermissionsStatus> {
  try {
    return await getPermissionsAsync();
  } catch {
    return SIN_SOPORTE;
  }
}

export async function pedirPermisoNotificaciones(): Promise<NotificationPermissionsStatus> {
  try {
    await crearCanalPrestamos();
    return await requestPermissionsAsync();
  } catch {
    return SIN_SOPORTE;
  }
}
