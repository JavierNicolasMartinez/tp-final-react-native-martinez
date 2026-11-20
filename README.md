# Biblioteca IPF

App de la biblioteca del Instituto Politécnico Formosa: catálogo, reservas con lista de espera, recordatorio de devolución y mostrador para el personal.

Trabajo Práctico N° 4 · Taller Complementario – React Native II · Tecnicatura Superior en Desarrollo de Software Multiplataforma.
Alumno: **Martínez, Javier Nicolás**.

- **Expo SDK 58** (expo `~58.0.26`, expo-router `~58.0.32`, React Native `0.88.1`, React `19.3.0`).
- TypeScript estricto, Expo Router con rutas tipadas (`experiments.typedRoutes`) y React Compiler.
- Se ejecuta con Expo Go en el teléfono, y también en la web (`npx expo start` y la tecla `w`).

## Cómo ejecutarlo

```bash
npm install
npx expo start
```

Escanear el QR con **Expo Go** (tiene que ser una versión compatible con el SDK 58).

Otros comandos:

```bash
npx expo lint      # lint
npx tsc --noEmit   # chequeo de tipos
npm test           # pruebas de Pila y Cola (jest-expo)
```

**Personal de biblioteca** (para `/login` y `/mostrador`): usuario `biblioteca`, clave `ipf2026`.

**ISBN para probar el escáner**: cualquiera de `src/data/libros.ts`. Todos son ISBN reales de ediciones que existen, así que se puede buscar la imagen del código de barras y escanearla desde otra pantalla. Por ejemplo: `9788499089508` (*Ficciones*), `9789875805231` (*El túnel*), `9780132350884` (*Clean Code*).

La app guarda préstamos, listas de espera y vistos recientemente con AsyncStorage. Para empezar de cero hay que borrar los datos de Expo Go (o desinstalar y volver a instalar).

## Árbol de rutas (`src/app`)

```
src/app/
├── _layout.tsx                 Stack raíz · BibliotecaProvider · Stack.Protected · anchor: (tabs)
├── (tabs)/
│   ├── _layout.tsx             Tabs (expo-router/js-tabs) con íconos de @expo/vector-icons
│   ├── (catalogo)/
│   │   ├── _layout.tsx         Stack propio de la tab Catálogo · anchor: index
│   │   ├── index.tsx           /                 Catálogo (link "Personal" en el header)
│   │   └── libro/
│   │       └── [isbn].tsx      /libro/[isbn]     Detalle
│   └── reservas.tsx            /reservas         Mis reservas
├── buscar.tsx                  /buscar?q=        Buscador (Stack raíz)
├── escanear.tsx                /escanear         Escáner EAN-13 (Stack raíz)
├── reservar/
│   └── [isbn].tsx              /reservar/[isbn]  presentation: "modal"
├── permisos/
│   └── [recurso].tsx           /permisos/camara · /permisos/notificaciones  presentation: "modal"
├── login.tsx                   /login            modal · solo existe SIN sesión
├── mostrador.tsx               /mostrador        solo existe CON sesión
├── reserva.tsx                 /reserva          <Redirect href="/reservas" />
└── +not-found.tsx              cualquier otra URL: 404 que muestra la ruta
```

| Layout | Navegador | Qué decide |
|---|---|---|
| `src/app/_layout.tsx` | Stack (raíz) | Provider del Context, modales, `Stack.Protected` de `login` y `mostrador`, `anchor: '(tabs)'` para que un deep link a `/buscar` deje las pestañas debajo. |
| `src/app/(tabs)/_layout.tsx` | Tabs | Dos pestañas: Catálogo y Mis reservas. |
| `src/app/(tabs)/(catalogo)/_layout.tsx` | Stack | Catálogo y detalle; `anchor: 'index'` para que un deep link a `/libro/…` tenga el Catálogo debajo. |

Sobre el import de las tabs: la página de tabs de docs.expo.dev muestra `import { Tabs } from 'expo-router'`, pero en el SDK 58 los tipos instalados marcan ese import como `@deprecated` y piden `expo-router/js-tabs`. Por eso uso `import { Tabs } from 'expo-router/js-tabs'`.

## Estructura de `src`

| Carpeta | Qué tiene |
|---|---|
| `app` | Solo rutas. |
| `components` | Componentes, uno por archivo. |
| `hooks` | `useLibros`, `useBusqueda`, `usePermiso`, `useLectorIsbn`, `useRecordatorio`, `useBiblioteca`. |
| `lib` | Lógica sin React: API simulada, catálogo, permisos, notificaciones, fechas, sesión, almacenamiento. |
| `context` | `BibliotecaContext` (préstamos, listas de espera, recientes, sesión y avisos). |
| `estructuras` | `Pila` y `Cola` (con `#items`, `tamanio` y `aArray()`; la Cola sin `shift()`) y sus pruebas. |
| `data` | Catálogo de 16 libros y listas de espera iniciales. |
| `types` | Tipos (`Libro`, préstamos, permisos). |
| `constants` | Tema (colores, tamaños, espaciados), textos y constantes. |

## Bloque `plugins` de `app.json`

JSON no admite comentarios, así que acá va el bloque copiado con comentarios (en `app.json` está sin ellos):

```jsonc
"plugins": [
  // Rutas basadas en archivos.
  "expo-router",
  // Pantalla de inicio (queda visible hasta que se carga lo guardado).
  ["expo-splash-screen", {
    "backgroundColor": "#208AEF",
    "image": "./assets/images/splash-icon.png",
    "imageWidth": 76
  }],
  ["expo-camera", {
    // Texto de propósito que ve la persona en el diálogo de iOS.
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrirlo al instante",
    // La app no graba video: no pide micrófono en iOS...
    "microphonePermission": false,
    // ...ni agrega RECORD_AUDIO en Android.
    "recordAudioAndroid": false
  }],
  // Notificaciones locales (recordatorio de devolución y aviso de entrega).
  "expo-notifications"
]
```

## Permisos

| Recurso | Módulo | Cuándo se pide | Si no se concede |
|---|---|---|---|
| Cámara | `expo-camera` (`useCameraPermissions` dentro de `usePermiso`) | Al tocar "Usar la cámara" en `/escanear`: primero se muestra `/permisos/camara` y el diálogo del sistema sale recién al tocar "Continuar". | Se escribe el ISBN a mano en la misma pantalla. Si está bloqueado, la pantalla previa ofrece "Abrir Ajustes". |
| Notificaciones | `expo-notifications` | Solo al activar "Recordarme" en un préstamo: primero `/permisos/notificaciones`; en Android se crea el canal `prestamos` antes de pedir. | Los avisos aparecen dentro de la app, en `/reservas`. La fecha de devolución siempre está a la vista. |

### Permisos de Android

Los revisé con `npx expo config --type introspect` y con los `AndroidManifest.xml` de cada librería:

| Permiso | Lo agrega | ¿Queda? |
|---|---|---|
| `CAMERA` | `expo-camera` | Sí, para el escáner. |
| `POST_NOTIFICATIONS` | `expo-notifications` | Sí, para el recordatorio (Android 13+). |
| `RECEIVE_BOOT_COMPLETED` | `expo-notifications` | Sí, para que una notificación programada sobreviva a un reinicio. |
| `VIBRATE` | Expo (plantilla) | Sí, la usan las notificaciones. |
| `INTERNET` | Expo (plantilla) | Sí, la usa Expo Go / Metro en desarrollo. |

### Justificación de `blockedPermissions`

```json
"blockedPermissions": [
  "android.permission.RECORD_AUDIO",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION"
]
```

- `RECORD_AUDIO`: `expo-camera` lo agrega para grabar video con sonido. La app solo lee códigos de barras. `recordAudioAndroid: false` ya evita que el plugin lo agregue; el bloqueo además lo saca si alguna librería lo trae en su manifiesto.
- `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE`: los declara `expo-file-system` (viene con `expo`) y también la plantilla. La app no lee ni escribe archivos del teléfono.
- `READ_MEDIA_IMAGES`: la app no accede a la galería.
- `SYSTEM_ALERT_WINDOW`: lo agrega la plantilla para dibujar encima de otras apps. Esta app no lo necesita.
- `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION`: la app no usa ubicación. Se bloquean por mínimo privilegio, por si alguna dependencia los suma más adelante.

En iOS la única clave de uso es `NSCameraUsageDescription` (con `microphonePermission: false` no aparece `NSMicrophoneUsageDescription`).

## Deep links de prueba

El esquema propio (`bibliotecaipf://`) funciona en una build propia. En Expo Go se usa la URL equivalente `exp://IP:8081/--/ruta` (la IP es la que muestra `npx expo start`):

| Link | Equivalente en Expo Go |
|---|---|
| `bibliotecaipf://libro/9788499089508` | `exp://IP:8081/--/libro/9788499089508` |
| `bibliotecaipf://libro/123` | `exp://IP:8081/--/libro/123` |
| `bibliotecaipf://buscar?q=borges` | `exp://IP:8081/--/buscar?q=borges` |
| `bibliotecaipf://mostrador` | `exp://IP:8081/--/mostrador` |
| `bibliotecaipf://reserva` | `exp://IP:8081/--/reserva` |
| `bibliotecaipf://escanear` | `exp://IP:8081/--/escanear` |

En Android se pueden abrir desde la compu con:

```bash
adb shell am start -a android.intent.action.VIEW -d "exp://IP:8081/--/buscar?q=borges"
```

## Decisiones técnicas (resumen)

- **Mutar o reemplazar**: la `Pila` y las `Cola` nunca se mutan dentro del estado. Para cada cambio se arma una estructura nueva con `new Cola(anterior.aArray())`, se le aplica la operación y se guarda la nueva. Así React ve otra referencia y vuelve a dibujar.
- **Ejemplares disponibles**: no se guardan, se calculan (ejemplares iniciales menos los préstamos que salieron del estante).
- **Confirmar reserva**: `router.dismissTo('/reservas')`. Cierra el modal y lleva a Mis reservas, y la confirmación no queda en el historial.
- **Escáner**: freno con `useRef` (navega una sola vez) y `router.replace` al detalle; un ISBN desconocido se avisa una sola vez por código.
- **Buscador**: `q` vive en la URL (`router.setParams`), la limpieza del efecto descarta respuestas viejas y hay un debounce de 300 ms.
- **Permisos**: `usePermiso(recurso)` usa `useCameraPermissions` para la cámara y un hook armado con `createPermissionHook` para notificaciones. Vuelve a consultar al recibir el foco y al volver a primer plano (`AppState`).
- **Persistencia**: préstamos (con el id de la notificación), recientes y listas de espera en AsyncStorage. Mientras se cargan queda la pantalla de inicio, así la app no se ve vacía. Al iniciar se limpian los ids de notificaciones que ya no están programadas.

## Desafíos opcionales hechos

- Persistencia con AsyncStorage sin pantalla vacía al iniciar.
- Pruebas de `Pila` y `Cola` con jest-expo (10 casos, incluido desencolar una cola vacía).
- Debounce de 300 ms en el buscador, con limpieza del temporizador.

## Salida de lint, tipos y pruebas

```
$ npx expo lint
(sin errores ni advertencias; termina con código 0)

$ npx tsc --noEmit
(sin errores; termina con código 0)

$ npm test
Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
```

## Capturas

Están en [`docs/capturas/`](docs/capturas/). Las respuestas de las Partes B a E están en [`RESPUESTAS.md`](RESPUESTAS.md).

Las capturas son de la versión web de la app, en tamaño de teléfono (390 × 844). Algunas necesitaron preparar el navegador:

- `12-escaner-concedido.png`: la cámara de prueba del navegador muestra el código de barras EAN-13 real de *Ficciones*. Después de la captura el lector lo leyó y abrió `/libro/9788499089508`, o sea que el escáner funciona de punta a punta.
- `14-escaner-bloqueado.png`: en la web el navegador siempre deja volver a preguntar (`canAskAgain` es `true`), así que simulé la respuesta que da el teléfono cuando el permiso queda bloqueado (`denied` con `canAskAgain: false`). La pantalla es la que dibuja la app con esa respuesta.
- `15-aviso-de-entrega-en-la-app.png`: en la web no existen las notificaciones del sistema. Muestra el camino alternativo: el personal entregó *Ficciones* desde el mostrador y, como no hay notificaciones, el aviso aparece dentro de Mis reservas.
