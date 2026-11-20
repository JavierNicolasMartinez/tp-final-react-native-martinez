import { PermissionStatus } from 'expo';
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { CANAL_PRESTAMOS, SEGUNDOS_RECORDATORIO } from '../constants/notificaciones';

// Si el sistema no deja consultar (por ejemplo en la web), se trata como bloqueado
// y la app avisa adentro en lugar de mandar notificaciones.
const SIN_SOPORTE: NotificationPermissionsStatus = {
  status: PermissionStatus.DENIED,
  granted: false,
  canAskAgain: false,
  expires: 'never',
};

// Para que la notificación también se vea si la app está abierta.
export function configurarNotificaciones(): void {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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

export async function programarRecordatorio(titulo: string): Promise<string> {
  return scheduleNotificationAsync({
    content: {
      title: 'Acordate de devolver tu libro',
      body: `Se vence el préstamo de ${titulo}. Devolvelo en la biblioteca.`,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SEGUNDOS_RECORDATORIO,
      channelId: CANAL_PRESTAMOS,
    },
  });
}

export async function cancelarRecordatorio(id: string): Promise<void> {
  try {
    await cancelScheduledNotificationAsync(id);
  } catch {
    // Si ya llegó o el sistema la borró, no queda nada que cancelar.
  }
}
