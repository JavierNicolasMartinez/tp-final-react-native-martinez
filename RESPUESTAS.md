# Parte B · Estado, efectos y renderizado

## B1. El ciclo de vida de useLibros

### a)

En mi app `useLibros` no tiene un estado `cargando` aparte. Guardo dos cosas: un contador `intento` y el `resultado` del último pedido, que trae anotado a qué intento pertenece. `cargando` se calcula: es verdadero mientras no llegó la respuesta del intento actual (`src/hooks/useLibros.ts:35-43`).

```tsx
// Está cargando mientras no llegó la respuesta del intento actual.
const actual = resultado !== null && resultado.intento === intento ? resultado : null;

return {
  libros: actual?.libros ?? [],
  cargando: actual === null,
  error: actual?.error ?? null,
  reintentar,
};
```

Lo hice así porque ESLint de este SDK trae la regla `react-hooks/set-state-in-effect`, que no deja hacer `setCargando(true)` directo dentro del efecto. Así el estado de carga no se puede desincronizar: sale del mismo dato que la respuesta.

**Cuando todo sale bien** hay 2 renders del Catálogo:

| Render | Qué lo provoca | intento | libros | cargando | error |
|---|---|---|---|---|---|
| 1 | Se monta el Catálogo | 0 | `[]` | `true` | `null` |
| 2 | Llega la respuesta (800 ms) y el `.then` hace `setResultado` | 0 | 16 libros | `false` | `null` |

Después del render 1 corre el efecto (`src/hooks/useLibros.ts:17-29`) y llama a `obtenerLibros()`. En pantalla se ve el indicador (`src/app/(tabs)/(catalogo)/index.tsx:15`). Cuando la promesa se resuelve, `setResultado({ intento: 0, libros, error: null })` provoca el render 2 y aparece la lista.

**Cuando falla y la persona toca "Reintentar"** hay 4 renders:

| Render | Qué lo provoca | intento | libros | cargando | error |
|---|---|---|---|---|---|
| 1 | Se monta el Catálogo | 0 | `[]` | `true` | `null` |
| 2 | `obtenerLibros()` falla y el `.catch` hace `setResultado` con el mensaje | 0 | `[]` | `false` | "No pudimos cargar el catálogo…" |
| 3 | Toca "Reintentar": `setIntento(1)` | 1 | `[]` | `true` | `null` |
| 4 | Llega la respuesta del intento 1 | 1 | 16 libros (o error otra vez) | `false` | `null` (o el mensaje) |

En el render 2 se ve `EstadoError` con el botón (`index.tsx:16`). En el render 3 fijate que `resultado` todavía tiene el error del intento 0, pero como `resultado.intento` (0) no es igual a `intento` (1), `actual` da `null` y la pantalla muestra el indicador, no el error viejo. Después del render 3 el efecto se vuelve a ejecutar porque cambió `intento`, y el render 4 llega con la respuesta nueva.

### b)

No, en ninguno de los dos casos. Las tabs dejan montadas las pantallas que ya visitaste, solo las esconden. Y cuando abro un detalle, el detalle se apila arriba del Catálogo en el Stack de la tab, entonces el Catálogo sigue montado abajo.

[COMPLETAR JAVIER: poner un `console.log('limpieza useLibros')` dentro del `return () => { … }` de `src/hooks/useLibros.ts:26-28`, cambiar a "Mis reservas", volver, abrir un detalle y volver. Anotar si aparece el log en la consola de Metro. (Predicción: no aparece en ninguno de esos casos. Sí aparece cuando tocás "Reintentar" y cuando guardás un archivo y se recarga con Fast Refresh.) Después borrar el console.log.]

O sea, en mi app la limpieza corre en dos situaciones reales:

1. Cuando cambia `intento` (tocaste "Reintentar"): React limpia el efecto del intento anterior antes de correr el nuevo. Si el pedido viejo todavía no había vuelto, `vigente = false` hace que su respuesta se ignore.
2. Cuando el Catálogo se desmonta de verdad (por ejemplo al recargar la app o con Fast Refresh en desarrollo). Ahí la limpieza evita que una respuesta que llega tarde haga `setResultado` en un componente que ya no existe.

### c)

Porque una función `async` siempre devuelve una promesa, y `useEffect` espera que el efecto devuelva nada o una función de limpieza. Si le paso una `async`, React recibe una promesa en lugar de la limpieza (y avisa con un warning), y yo me quedo sin lugar para devolver la limpieza de verdad.

Lo resolví llamando a la promesa adentro del efecto con `.then` y `.catch`, y devolviendo la limpieza normal (`src/hooks/useLibros.ts:17-29`):

```tsx
useEffect(() => {
  let vigente = true;
  obtenerLibros()
    .then((libros) => {
      if (vigente) setResultado({ intento, libros, error: null });
    })
    .catch(() => {
      if (vigente) setResultado({ intento, libros: [], error: mensajes.errorCatalogo });
    });
  return () => {
    vigente = false;
  };
}, [intento]);
```

### d)

`reintentar` solo suma uno al contador (`src/hooks/useLibros.ts:31-33`):

```tsx
const reintentar = useCallback(() => {
  setIntento((anterior) => anterior + 1);
}, []);
```

Lo que hace que el pedido se repita es que `intento` está en el array de dependencias del efecto (`useLibros.ts:29`). Cambia el número, React vuelve a renderizar, ve que la dependencia es distinta y vuelve a correr el efecto, que pide los libros otra vez.

Elegí un contador porque **cada toque genera un valor nuevo**. Si usara algo como `error` o un booleano, podría pasar que el valor no cambie (por ejemplo, falla dos veces seguidas y `error` tiene el mismo texto), y entonces el efecto no se vuelve a ejecutar. Tampoco podría usar `libros`, porque el efecto mismo lo cambia y entraría en un bucle. Además el número me sirve para etiquetar cada resultado y saber si es del intento actual.

## B2. La condición de carrera del buscador

Mi buscador tiene además un debounce de 300 ms (el pedido sale recién cuando la persona deja de escribir 300 ms), así que con mi código la tabla queda distinta a lo que plantea la consigna. Lo aclaro abajo de la tabla.

| Momento | Qué pasa | Sin limpieza: qué se ve | Con mi código: qué se ve |
|---|---|---|---|
| t = 0 ms | Escribe "bor" → se pide `buscarLibros("bor")`, que tarda 1.400 ms. | El campo dice "bor" y abajo "Buscando…". | "Buscando…". Todavía no sale ningún pedido: arranca el temporizador de 300 ms. |
| t = 200 ms | Escribe "borges" → se pide `buscarLibros("borges")`, que tarda 300 ms. | "Buscando…". Hay dos pedidos en vuelo. | "Buscando…". La limpieza borra el temporizador de "bor", así que ese pedido nunca sale. Arranca uno nuevo para "borges". |
| t = 500 ms | Llega la respuesta de "borges". | Aparecen los resultados de "borges". | Recién acá sale `buscarLibros("borges")` (vence el debounce). Sigue "Buscando…" y los resultados aparecen a los 800 ms. |
| t = 1.400 ms | Llega la respuesta de "bor". | La respuesta vieja pisa a la nueva: el campo dice "borges" pero la lista es la de "bor". | Nada cambia. No hay respuesta de "bor" porque nunca se pidió. |

En mi catálogo da la casualidad de que "bor" y "borges" traen los mismos dos libros (*Ficciones* y *El Aleph*), así que con esas palabras el error no se notaría. Lo probé en la versión web con "e" (lenta) y "el aleph" (rápida): sin la limpieza, la lista de "e" hubiera pisado la de "el aleph".

Si la persona escribe más lento (más de 300 ms entre "bor" y "borges"), los dos pedidos sí salen como en la consigna. Ahí lo que descarta la respuesta vieja es la variable `vigente`, que explico en a).

### a)

La limpieza está en `src/hooks/useBusqueda.ts:38-41`:

```tsx
return () => {
  vigente = false;
  clearTimeout(temporizador);
};
```

Hace dos cosas:

1. `clearTimeout(temporizador)`: si el pedido todavía no salió (estaba esperando el debounce), lo cancela.
2. `vigente = false`: si el pedido ya salió, no lo puedo frenar, pero marco que su respuesta está vencida. Cuando llega, el `.then` pregunta `if (vigente)` (`useBusqueda.ts:28`), da falso y no toca el estado.

Cada vez que corre el efecto se crea una variable `vigente` nueva, propia de ese pedido. La limpieza cambia la del pedido viejo, no la del nuevo.

¿Cuándo se ejecuta? Cuando cambia `texto` o `intento` (las dependencias, `useBusqueda.ts:42`): React primero limpia el efecto anterior y después corre el nuevo. O sea, en cada letra que escribís. También corre cuando se desmonta la pantalla, por ejemplo si tocás atrás con un pedido en vuelo.

### b)

No funciona. El `.then` es una función que se creó adentro del efecto de un render, y esa función "ve" el `q` de ese render, no el actual. Eso es una **clausura**: una función se acuerda de las variables que existían donde se creó, aunque después se ejecute mucho más tarde.

Entonces, en el pedido de "bor", `texto` vale "bor" y el `q` que ve el `.then` también vale "bor" (es el mismo render). La comparación `texto === q` da siempre verdadera y la respuesta vieja pasa igual. El `q` nuevo ("borges") existe en otro render, en otra clausura, y la función vieja no lo puede ver.

Para que esa idea funcione habría que comparar contra algo que no quede congelado, como un `useRef` que se actualice en cada render. La limpieza hace lo mismo, pero más simple.

### c)

Cada letra hace `router.setParams({ q: texto })` (`src/app/buscar.tsx:17`). Eso cambia los parámetros de la pantalla que ya está abierta: la URL pasa por `/buscar?q=b`, `/buscar?q=bo`… hasta `/buscar?q=borges`, pero no se apila ninguna pantalla nueva. Por eso el botón atrás te saca del buscador de un toque y vuelve a donde estabas (el Catálogo).

Con `router.push` cada letra apilaría otra pantalla `/buscar`. Para salir del buscador tendrías que tocar atrás una vez por cada letra ("borge", "borg", "bor"…), y cada una de esas pantallas tendría su propio efecto y su propio pedido.

[COMPLETAR JAVIER: en el teléfono, buscar "borges" y tocar atrás una vez. (Predicción: vuelve directo al Catálogo.)]

## B3. Mutar o reemplazar

### a)

Muestra "Personas en espera: 0" las tres veces. `encolar` modifica el objeto `Cola` que ya está guardado en el estado, pero nadie llama a una función `set…`. React solo vuelve a dibujar cuando se le avisa con un `set`, y aunque se le avisara con el mismo objeto, React compara la referencia: es el mismo objeto de antes, entonces piensa que nada cambió. El dato cambió por adentro, pero la pantalla no se enteró.

### b)

Al escribir en el `TextInput` controlado se llama a su `setTexto`, y eso sí provoca un render de todo el componente. En ese render se vuelve a leer `espera.tamanio`, y como el objeto fue modificado tres veces por adentro, ahora vale 3. El número "salta" por un render que no tiene nada que ver con la cola.

Un error que aparece a veces es peor porque depende de otra cosa que pasa por casualidad (en este caso, que algo más provoque un render). Cuando lo probás puede andar bien, cuando lo querés mostrar no, y es muy difícil encontrar la causa porque el código de la cola "parece" correcto. Un error que aparece siempre lo ves enseguida y lo arreglás.

### c)

En mi Context nunca modifico una `Cola` o una `Pila` que ya está en el estado. Para cada cambio armo una nueva a partir de la anterior con `aArray()`, le aplico la operación y guardo la nueva (`src/context/BibliotecaContext.tsx:141-143`):

```tsx
const nueva = new Cola(cola?.aArray() ?? []);
nueva.encolar(ALUMNO);
setEsperas({ ...esperas, [libro.isbn]: nueva });
```

Lo mismo para entregar (`BibliotecaContext.tsx:165-167`) y para la pila de recientes (`BibliotecaContext.tsx:117-124`). Como la referencia es otra, React se entera y vuelve a dibujar.

| Estrategia | Ventaja | Costo |
|---|---|---|
| Cola nueva a partir de la anterior (la mía) | Funciona con cómo React compara: referencia nueva, render seguro. Además `useMemo` y las dependencias de los efectos se enteran del cambio. | Copio el array entero en cada operación (O(n)), así que pierdo la ventaja de mi Cola sin `shift()`. Con listas de 2 o 3 personas no se nota. |
| Contador de versión (`setVersion(v + 1)` después de mutar) | No copio nada, cada operación sigue siendo O(1). | Es fácil olvidarse el `set` en algún lugar y vuelve el error de B3. El objeto sigue siendo el mismo, así que un `useMemo` que dependa de la cola no se actualiza. |
| `useReducer` | Todas las operaciones quedan juntas en un solo lugar y se leen fácil. | Más código. Y adentro del reducer igual tengo que devolver una cola nueva: no me salva de elegir entre copiar o mutar. |

## B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en mi app | Por qué ahí y no en otro lugar |
|---|---|---|
| Texto del buscador | **URL**: parámetro `q` (`src/app/buscar.tsx:12`) | Así un link como `/buscar?q=borges` abre la búsqueda hecha y el botón atrás funciona bien. Solo lo usa esa pantalla, no tiene sentido ponerlo en el Context. |
| Préstamos y reservas | **Context** (`prestamos` y las colas de `esperas`), guardado en AsyncStorage | Lo usan varias pantallas: el detalle, la reserva, Mis reservas y el mostrador. Si viviera en una sola pantalla, las demás no lo verían. |
| Listas de espera | **Context**: `esperas`, un objeto ISBN → `Cola` | Las escribe la reserva y el mostrador, y las leen el detalle y Mis reservas. |
| Vistos recientemente | **Context**: `recientes`, una `Pila` | Lo escribe el detalle y lo lee el Catálogo, que son pantallas distintas. |
| Sesión del personal | **Context**: `sesion` | La necesita el layout raíz para `Stack.Protected`. No la guardo en AsyncStorage a propósito: al cerrar la app, el personal tiene que volver a entrar. |
| Ejemplares disponibles de un libro | **Se calcula**: `disponibles()` (`src/context/BibliotecaContext.tsx:105-114`) | Sale de los ejemplares iniciales menos mis préstamos que salieron del estante. Si lo guardara aparte, tendría el mismo dato en dos lugares y se podrían desincronizar. |
| Estado del permiso de cámara | **Sistema operativo**. La app lo lee con `useCameraPermissions` dentro de `usePermiso` | El dueño es el sistema: la persona lo puede cambiar en Ajustes sin pasar por la app. Por eso lo vuelvo a consultar al recibir el foco y al volver a primer plano, en vez de guardarlo. |
| Identificador de la notificación programada | **Context**, adentro de cada préstamo (`notificacionId`), y guardado en AsyncStorage | Va pegado al préstamo porque lo necesito para cancelar la notificación al devolver o al apagar "Recordarme". |

Cuando cambia el `value` del Context, se vuelven a renderizar **todos los componentes que lo leen** con `useBiblioteca` (que adentro usa `useContext`). La pantalla del Catálogo en sí no lee el Context, pero sus hijos sí: `VistosRecientes` y cada `FilaLibro` (esta última para mostrar los disponibles). Entonces sí: si activo "Recordarme" en la otra pestaña, cambia `prestamos`, el `value` es un objeto nuevo (`BibliotecaContext.tsx:196-235`) y esos componentes se vuelven a renderizar, aunque el Catálogo esté escondido.

Para evitarlo podría separar el Context en varios (por ejemplo uno solo para recientes) o usar una librería con selectores, que avisa solo a quien lee la parte que cambió. En una app de este tamaño no vale la pena: son 16 filas y el render es instantáneo. Antes de complicar el código lo mediría con el Profiler de React DevTools, y solo si viera un problema real lo separaría.

# Parte C · Navegación y rutas

## C1. La pila en tu app

En mi app hay dos Stacks: el **Stack raíz** (`src/app/_layout.tsx` con `NavegacionRaiz`) y el **Stack de la tab Catálogo** (`src/app/(tabs)/(catalogo)/_layout.tsx`). La tab "Mis reservas" no tiene Stack propio, es una sola pantalla. Escribo las pilas de base a tope.

| # | Acción | Pilas resultantes |
|---|---|---|
| 1 | Abre la app. | Stack raíz: `(tabs)`. Stack de Catálogo: `Catálogo`. Tab activa: Catálogo. |
| 2 | Toca un libro del Catálogo. | Stack raíz: `(tabs)`. Stack de Catálogo: `Catálogo → Detalle`. |
| 3 | Toca "Reservar". | Stack raíz: `(tabs) → Reservar (modal)`. Stack de Catálogo: `Catálogo → Detalle` (queda abajo, tapado por el modal). |
| 4 | Toca "Confirmar". | Stack raíz: `(tabs)` (el modal se fue). Tab activa: Mis reservas. Stack de Catálogo: sigue `Catálogo → Detalle`. |
| 5 | Toca atrás (Android). | Stack raíz: `(tabs)`. Tab activa: Catálogo, que muestra el tope de su Stack: `Catálogo → Detalle`. O sea, la persona ve el Detalle. |
| 6 | Toca la tab "Catálogo". | Stack raíz: `(tabs)`. Stack de Catálogo: `Catálogo` (vuelve al tope). |

[COMPLETAR JAVIER: en el teléfono Android hacer los pasos 1 a 6 y anotar qué se ve en el 5 y en el 6. (Predicción: en el 5 atrás no vuelve al modal de confirmación, cambia a la tab Catálogo y se ve el Detalle del libro; en el 6, como la tab Catálogo ya está activa, tocarla otra vez vuelve al Catálogo. Si en el 5 la app se cierra en lugar de ir a Catálogo, anotarlo y corregir la fila.)]

### a)

Usé `router.dismissTo('/reservas')` (`src/components/ConfirmacionReserva.tsx:36-37`):

```tsx
// Cierra el modal y lleva a /reservas: la confirmación no queda en el historial.
router.dismissTo('/reservas');
```

`dismissTo` va sacando pantallas del Stack raíz hasta llegar a la que tiene `/reservas`. Como `(tabs)` ya está abajo del modal, saca el modal y cambia a la tab Mis reservas. La confirmación desaparece del historial.

- Con **push**, `/reservas` se apilaría arriba del modal (una segunda copia de las tabs). Al tocar atrás volverías a la confirmación y podrías tocar "Confirmar" otra vez.
- Con **replace**, el modal se cambia por una pantalla nueva de tabs. Atrás ya no vuelve a la confirmación, pero quedan dos copias de las tabs una arriba de la otra, y atrás te lleva a las tabs viejas.
- Con **dismissTo** no se duplica nada: se reutilizan las tabs que ya estaban.

Lo elegí por la idea que ya usé en el TP 2: una pantalla de paso, que solo existe para tomar una decisión que ya se tomó, no tiene que quedar en el historial.

### b)

Depende de dónde esté parada la persona cuando toca la tab. Lo probé en la versión web:

- Si está en **Mis reservas** y toca "Catálogo", ve el **Detalle**, porque cada tab guarda su propio Stack tal como lo dejaste.
- Si ya está en la tab Catálogo (como después del paso 5) y la vuelve a tocar, el Stack de la tab vuelve al tope y ve el **Catálogo**.

Me parece correcto para esta app. Guardar el Stack sirve si cambiaste de tab un segundo para mirar tus reservas y querés volver al libro que estabas leyendo. Y si querés volver al inicio, tocás la tab otra vez, que es lo que la gente espera de las apps con tabs.

## C2. El escáner que dispara de más

### a)

Cada llamada a `router.push` mete una acción de navegación en la cola del navegador, y esas acciones se ejecutan todas, en orden. Es lo mismo que vimos en el TP 2: dos toques son dos pantallas. Si el código queda frente a la cámara un segundo, `onBarcodeScanned` puede llamar diez veces y se apilarían diez Detalles iguales. Para volver habría que tocar atrás diez veces.

### b)

Usé `useRef` (`src/hooks/useLectorIsbn.ts:7-9`):

```tsx
// Un ref cambia al instante; un estado recién se ve en el próximo render,
// y la cámara puede llamar varias veces antes de que ese render ocurra.
const yaNavego = useRef(false);
```

Al principio de `abrir` pregunto `if (yaNavego.current) return;` (`useLectorIsbn.ts:14`), y lo pongo en `true` justo antes de navegar (`useLectorIsbn.ts:32`).

Un `useState` puesto en `true` no alcanza porque el valor nuevo recién aparece en el próximo render. Las llamadas de `onBarcodeScanned` que llegan antes de ese render usan la función del render anterior, y esa función tiene guardado (por clausura) el valor viejo, `false`. Entonces todas pasan el `if` y todas navegan. El ref, en cambio, es un objeto único que dura toda la vida del componente: cuando cambio `yaNavego.current`, la próxima llamada lo ve al instante, sin esperar ningún render.

### c)

Porque el escáner es una pantalla de paso. Con `router.replace` (`useLectorIsbn.ts:33-34`) el escáner se cambia por el Detalle, y atrás te lleva a donde estabas antes de escanear (el Catálogo).

Con `push`, al tocar atrás desde el Detalle volverías al escáner con la cámara prendida. En mi app sería peor todavía: `yaNavego` quedó en `true` porque la pantalla nunca se desmontó, así que la cámara vería el código y no haría nada. La persona quedaría frente a un escáner que no responde.

### d)

Muestra un aviso dentro de la pantalla ("El libro con ISBN … no está en el catálogo. Podés probar con otro.") y deja la cámara funcionando para escanear otro libro (`useLectorIsbn.ts:24-29`):

```tsx
if (!buscarLibroPorIsbn(isbn)) {
  // El mismo código sigue frente a la cámara: ya avisamos, no repetimos el aviso.
  if (desdeCamara && ultimoDesconocido.current === isbn) return;
  ultimoDesconocido.current = isbn;
  setAviso(`El libro con ISBN ${isbn} no está en el catálogo. Podés probar con otro.`);
  return;
}
```

Para que no aparezca diez veces guardo en otro ref el último código desconocido. Si la cámara vuelve a leer el mismo, salgo sin hacer nada. Si lee uno distinto, sí aviso, porque es información nueva. Cuando el ISBN se escribe a mano el aviso sale siempre, porque ahí la persona tocó el botón a propósito.

## C3. Deep links y rutas protegidas

En Expo Go el esquema propio no abre la app, así que se prueba con `exp://IP:8081/--/ruta` (está explicado en el README).

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de mi código lo decide |
|---|---|---|---|
| `bibliotecaipf://libro/` + un ISBN existente | El Detalle de ese libro, con su título en el header. | El Catálogo, dentro de la tab Catálogo. | `anchor: 'index'` en `src/app/(tabs)/(catalogo)/_layout.tsx:6-9` y la validación de `libro/[isbn].tsx:14-15`. |
| `bibliotecaipf://libro/123` | "Ese código no es un ISBN" y el botón "Ir al catálogo". | El Catálogo. | `esIsbnValido` (`src/lib/catalogo.ts:4-6`) y el primer `if` de `libro/[isbn].tsx:23-33`. |
| `bibliotecaipf://buscar?q=borges` | El buscador con "borges" escrito y los dos libros de Borges. | Las tabs con el Catálogo. | `anchor: '(tabs)'` en `src/app/_layout.tsx:12-15` y la lectura de `q` en `src/app/buscar.tsx:12`. |
| `bibliotecaipf://mostrador` (sin sesión) | El Catálogo: sin sesión la ruta del mostrador no existe. | Nada, es la base de la pila. | `Stack.Protected guard={sesion}` en `src/components/NavegacionRaiz.tsx:39-41`. |
| `bibliotecaipf://reserva` | Mis reservas. | Las tabs (la tab Catálogo con su Catálogo). | `<Redirect href="/reservas" />` en `src/app/reserva.tsx:5`. |
| `bibliotecaipf://escanear` (cámara bloqueada) | El escáner con el mensaje de cámara bloqueada, el botón "Habilitar la cámara" y el campo para escribir el ISBN. | Las tabs con el Catálogo. | `calcularEstado` (`src/lib/permisos.ts:11-15`) y el último caso de `src/components/ZonaCamara.tsx:53-58`. |

[COMPLETAR JAVIER: abrir cada link en Expo Go con `exp://IP:8081/--/…` (con `adb shell am start -a android.intent.action.VIEW -d "…"` o pegándolo en el navegador del teléfono), tocar atrás y anotar si lo que se ve y lo que queda debajo coincide con la tabla. (Predicción: coincide. En la versión web ya comprobé /libro/… con el Catálogo debajo, /libro/123, /mostrador sin sesión, que termina en el Catálogo, y /reserva, que termina en /reservas.)]

El link `/libro/123` llega a mi pantalla de Detalle porque el router decide solo por la forma de la URL: `libro/[isbn]` es un segmento dinámico y acepta cualquier texto en esa posición. El router no sabe qué es un ISBN ni qué libros existen. La responsabilidad de responder bien es de la pantalla, o sea mía: por eso el Detalle valida que sean 13 números y que el libro exista, y si no, muestra un mensaje con salida al Catálogo (`libro/[isbn].tsx:23-45`).

## C4. Foco, montaje y primer plano

### a)

- **`useEffect` con `[]`**: detecta el **montaje**, cuando el componente aparece por primera vez. Como las tabs dejan las pantallas montadas, corre una sola vez.
- **`useFocusEffect`**: detecta cuando la pantalla **recibe el foco dentro de la navegación**: al cambiar de tab, al volver de otra pantalla o al cerrarse un modal. Su limpieza corre cuando pierde el foco.
- **`AppState`**: detecta cuando **la app entera** pasa de segundo plano a primer plano (`'active'`) o al revés. Es un evento del sistema, no de la navegación.

### b)

- Sale a Ajustes, habilita y vuelve: se entera **`AppState`** (cambia a `'active'`). `useFocusEffect` no, porque dentro de la app la pantalla nunca perdió el foco. `useEffect` con `[]` tampoco, porque no se volvió a montar.
- Va a Catálogo y vuelve a Mis reservas: se entera **`useFocusEffect`**. `AppState` no, porque la app nunca salió de primer plano. `useEffect` con `[]` tampoco, porque la pantalla ya estaba montada.

[COMPLETAR JAVIER: con el permiso de notificaciones denegado, ir a Ajustes, habilitarlo, volver y mirar el texto de arriba de Mis reservas. (Predicción: cambia solo a "Notificaciones permitidas…" sin tocar nada.)]

### c)

Uso las dos, `useFocusEffect` y `AppState`, dentro de `usePermiso` (`src/hooks/usePermiso.ts:23-36`). Mis reservas lo usa a través de `EstadoNotificaciones`, y también lo usan el escáner y la pantalla previa:

```tsx
useFocusEffect(
  useCallback(() => {
    consultar();
  }, [consultar]),
);

useEffect(() => {
  const suscripcion = AppState.addEventListener('change', (estadoApp) => {
    if (estadoApp === 'active') consultar();
  });
  return () => suscripcion.remove();
}, [consultar]);
```

No uso `useEffect` con `[]` para consultar: el primer foco ya cubre el montaje. Por eso los hooks de permisos van con `{ get: false }` (`usePermiso.ts:19-20`), para no consultar dos veces al abrir.

Si hubiera usado solo `useFocusEffect`, la pantalla mostraría un estado viejo en el caso de Ajustes: la persona habilita las notificaciones, vuelve, y Mis reservas sigue diciendo "bloqueadas" hasta que cambie de tab y vuelva. Si hubiera usado solo `AppState`, el estado viejo aparecería al revés: si el permiso cambia mientras estás en otra pantalla de la app (por ejemplo, lo concedés en la pantalla previa desde "Recordarme"), al volver a Mis reservas no se actualizaría.

# Parte D · Permisos en tu app

## D1. Recorrido completo de la cámara

Un detalle de mi app: al tocar "Escanear" se abre el escáner, que en estado preguntable muestra para qué sirve la cámara, el botón "Usar la cámara" y el campo para escribir el ISBN. "Usar la cámara" abre la pantalla previa `/permisos/camara`, y ahí está el único botón ("Continuar" o "Abrir Ajustes").

| # | Acción | Qué muestra mi app | status | canAskAgain |
|---|---|---|---|---|
| 1 | Toca "Escanear" por primera vez. | Escáner en estado **preguntable**: "Usamos tu cámara para…", botón "Usar la cámara" y el campo del ISBN. Al tocar "Usar la cámara" aparece la pantalla previa con "Continuar". | `undetermined` | `true` |
| 2 | "Continuar" → "No permitir". | Vuelve al escáner, otra vez **preguntable**. Se puede seguir escribiendo el ISBN. | `denied` | `true` |
| 3 | Toca "Escanear" otra vez. | Lo mismo: **preguntable**, y la pantalla previa sigue mostrando "Continuar". | `denied` | `true` |
| 4 | "Continuar" → "No permitir". | Escáner en estado **bloqueado**: "La cámara está bloqueada…", botón "Habilitar la cámara" y el campo del ISBN. | `denied` | `false` |
| 5 | Toca "Escanear" otra vez. | **Bloqueado**. "Habilitar la cámara" abre la pantalla previa, que ahora muestra "Abrir Ajustes". | `denied` | `false` |
| 6 | "Abrir Ajustes" → habilita la cámara → vuelve a la app. | La pantalla previa se actualiza sola a **concedido** y muestra "Continuar". Al tocarlo vuelve al escáner, que ya muestra la cámara. | `granted` | `true` |

[COMPLETAR JAVIER: hacer el recorrido en el teléfono Android (con Expo Go recién instalado o borrándole los permisos) y anotar si cada fila coincide. (Predicción: coincide. En Android 11 o más el segundo "No permitir" deja `canAskAgain` en `false`. Ojo: en Expo Go el permiso es de la app Expo Go, así que "Abrir Ajustes" abre los ajustes de Expo Go.)]

### a)

En iOS el diálogo del sistema aparece **una sola vez**. El resultado cambia en el **paso 2**: después del primer "No permitir", iOS ya devuelve `status: denied` con `canAskAgain: false`. Entonces en el paso 3 mi app muestra directamente el estado **bloqueado**, y la pantalla previa ofrece "Abrir Ajustes" en lugar de "Continuar". El paso 4 tal como está escrito no existe en iOS: no hay forma de volver a ver el diálogo.

[COMPLETAR JAVIER: si tenés un iPhone, confirmarlo. Si no, dejar esta respuesta como razonamiento.]

### b)

La línea que decide el botón está en `src/components/PantallaPermiso.tsx:54-58`:

```tsx
{estado === 'bloqueado' ? (
  <Boton texto="Abrir Ajustes" icono="settings-outline" onPress={abrirAjustes} />
) : (
  <Boton texto="Continuar" onPress={continuar} />
)}
```

Y `estado` sale de `calcularEstado`, que mira el campo **`canAskAgain`** (`src/lib/permisos.ts:9-15`):

```tsx
// No alcanza con mirar status: "denied" puede ser preguntable o bloqueado.
// Lo que decide si se puede volver a mostrar el diálogo es canAskAgain.
export function calcularEstado(respuesta: PermissionResponse | null): EstadoPermiso {
  if (respuesta === null) return 'cargando';
  if (respuesta.granted) return 'concedido';
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}
```

No alcanza con `status` porque en los pasos 2 y 4 de la tabla `status` vale lo mismo, `denied`, pero la situación es distinta. En el paso 2 todavía se puede preguntar; en el 4 no. Si mirara solo `status`, en el paso 4 mostraría "Continuar", la persona lo tocaría, el sistema no mostraría ningún diálogo y la app parecería rota.

### c)

Se entera el listener de `AppState` de `usePermiso` (`src/hooks/usePermiso.ts:30-36`). Cuando la app vuelve a primer plano (`'active'`) vuelve a consultar el permiso, `calcularEstado` da `concedido` y el botón cambia.

```tsx
useEffect(() => {
  const suscripcion = AppState.addEventListener('change', (estadoApp) => {
    if (estadoApp === 'active') consultar();
  });
  return () => suscripcion.remove();
}, [consultar]);
```

Si esa parte no existiera, al volver de Ajustes la app seguiría mostrando "Abrir Ajustes", con el permiso viejo. Recién se actualizaría al cambiar de pantalla y volver (por el `useFocusEffect`). La persona pensaría que habilitar la cámara no funcionó.

## D2. Notificaciones y consistencia

### a)

A los 15 segundos llegaría "Acordate de devolver tu libro… Devolvelo en la biblioteca" de un libro que **ya devolvió**. La app diría una cosa (no tenés ese préstamo) y la notificación otra. Por eso al devolver cancelo la notificación si había una programada (`src/components/TarjetaPrestamo.tsx:23-28`):

```tsx
function alDevolver() {
  // Si quedaba un recordatorio programado, se cancela: el libro ya no está prestado.
  if (prestamo.notificacionId) cancelarRecordatorio(prestamo.notificacionId);
  devolver(prestamo.isbn);
  agregarAviso(`Devolviste ${titulo}. ¡Gracias!`);
}
```

### b)

Lo guardo en el Context, adentro del préstamo (`notificacionId`), y como hice el desafío de persistencia también queda guardado en AsyncStorage.

Si la app se cierra antes de que llegue:

- **La notificación** llega igual. La programé en el sistema operativo, no en la app, así que no depende de que la app esté abierta.
- **El identificador**, si solo viviera en memoria, se perdería al cerrar la app. Al volver a abrir, el interruptor "Recordarme" aparecería apagado aunque haya una notificación pendiente, y si devolvés el libro no la podrías cancelar porque no sabés su id. Ahí aparece la notificación de un libro devuelto.

Mi app guarda el id, pero eso trae el problema al revés: si la notificación llegó mientras la app estaba cerrada, el id guardado ya no corresponde a nada, y el interruptor quedaría prendido sin ningún recordatorio pendiente. Lo resolví así: al arrancar, comparo los ids guardados con los que el sistema todavía tiene programados (`getAllScheduledNotificationsAsync`), y los que ya no están los limpio (`src/context/BibliotecaContext.tsx:65-87` y `src/lib/notificaciones.ts:98-106`). Así el interruptor muestra la verdad.

### c)

En Android 13 o más, mostrar notificaciones es un permiso que se pide en tiempo de ejecución (`POST_NOTIFICATIONS`), y el sistema muestra el diálogo recién cuando la app tiene al menos un **canal** de notificación (un canal es una categoría, como "Préstamos", que la persona puede configurar aparte en Ajustes). Si pido el permiso sin canal, el diálogo puede no aparecer. Por eso `pedirPermisoNotificaciones` crea el canal `prestamos` antes de pedir (`src/lib/notificaciones.ts:39-46` y `56-63`):

```tsx
export async function pedirPermisoNotificaciones(): Promise<NotificationPermissionsStatus> {
  try {
    await crearCanalPrestamos();
    return await requestPermissionsAsync();
  } catch {
    return SIN_SOPORTE;
  }
}
```

En Android 12 no existe ese permiso en tiempo de ejecución: las notificaciones vienen permitidas al instalar la app, `requestPermissionsAsync` devuelve `granted` sin mostrar ningún diálogo y la persona solo las puede apagar desde Ajustes. El canal igual hace falta (desde Android 8 toda notificación sale por un canal), pero ya no tiene nada que ver con el diálogo.

### d)

Me entero por un aviso dentro de la app, en Mis reservas ("¡Te entregaron *Ficciones*! Pasá a buscarlo por la biblioteca."). El código que decide está en `src/app/mostrador.tsx:29-34`:

```tsx
if (persona === ALUMNO) {
  const notificado = await notificarEntrega(libro.titulo);
  if (!notificado) {
    agregarAviso(`¡Te entregaron ${libro.titulo}! Pasá a buscarlo por la biblioteca.`);
  }
}
```

Y `notificarEntrega` consulta el permiso **en ese momento** (`src/lib/notificaciones.ts:79-83`):

```tsx
// Consulta el permiso en este momento (no usa un valor guardado, que puede estar viejo).
// Devuelve false si no se pudo notificar, para que la app avise adentro.
export async function notificarEntrega(titulo: string): Promise<boolean> {
  const permiso = await consultarPermisoNotificaciones();
  if (!permiso.granted) return false;
```

Importa porque el permiso lo puede cambiar la persona en Ajustes en cualquier momento, sin pasar por la app. Si usara un valor guardado de antes, podría pasar que lo crea concedido cuando ya no lo está: la notificación no aparecería y tampoco el aviso, y la persona no se enteraría de nada. O al revés, que lo crea denegado cuando ya lo habilitó, y le mande solo el aviso interno.

## D3. Lo que tu app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
|---|---|---|---|
| Android | `CAMERA` | Escanear el código de barras del libro. | `expo-camera` (su plugin y su manifiesto). |
| Android | `POST_NOTIFICATIONS` | Recordatorio de devolución y aviso de entrega (Android 13+). | `expo-notifications` (su manifiesto). |
| Android | `RECEIVE_BOOT_COMPLETED` | Que un recordatorio programado no se pierda si el teléfono se reinicia. | `expo-notifications` (su manifiesto). |
| Android | `VIBRATE` | Vibración de las notificaciones. | La plantilla de Expo. |
| Android | `INTERNET` | Conectarse con Metro en desarrollo (y con la API, si fuera real). | La plantilla de Expo. |
| iOS | `NSCameraUsageDescription` = "Usamos tu cámara para leer el código de barras del libro y abrirlo al instante" | Escanear el código de barras. | El plugin de `expo-camera`, con el texto que puse en `cameraPermission`. |
| iOS | (sin clave en Info.plist) notificaciones | Recordatorio y aviso de entrega. | `expo-notifications` lo pide en tiempo de ejecución; no necesita texto de propósito. |

Esto lo saqué con `npx expo config --type introspect` y leyendo el `AndroidManifest.xml` de cada librería. Ahí también vi que `expo-file-system` (que viene con `expo`) declara `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE`, y por eso los bloqueo.

### a)

Porque se lo dije a `expo-camera` con `recordAudioAndroid: false` (y `microphonePermission: false` para iOS). Por defecto el plugin lo agrega para poder grabar video con sonido, pero mi app solo lee códigos de barras. Además está en `blockedPermissions`, que lo saca del manifiesto final aunque alguna librería lo declare. Fragmentos de `app.json` (líneas 21-22 y 45-52):

```json
"blockedPermissions": [
  "android.permission.RECORD_AUDIO",
```

```json
[
  "expo-camera",
  {
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrirlo al instante",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }
],
```

### b)

Usaría `expo-image-picker` con `launchImageLibraryAsync`. Para elegir una foto de la galería no hace falta pedir permiso: la documentación dice "No permissions request is necessary for launching the image library", porque el selector del sistema solo le pasa a la app la imagen que la persona eligió. Igual tendría que revisar los permisos que suma la librería: por defecto agrega `RECORD_AUDIO` (se saca con `microphonePermission: false`) y su manifiesto trae `CAMERA` y los de almacenamiento, que yo ya tengo bloqueados.

No alcanza con una actualización OTA: hace falta una **build nueva**. Una OTA solo cambia el JavaScript y los recursos, y `expo-image-picker` trae código nativo que tiene que estar compilado dentro del binario. Además su plugin modifica el manifiesto y el Info.plist, y eso también se aplica recién al compilar. (En Expo Go funcionaría sin compilar porque Expo Go ya trae ese módulo incluido, pero la app publicada no.)

### c)

No pude verificar del todo en Expo Go:

- **El texto de propósito de la cámara**: en Expo Go el diálogo es el de Expo Go, con su propio texto. Mi `cameraPermission` se aplica recién al compilar mi app.
- **`blockedPermissions` y `recordAudioAndroid`**: Expo Go tiene su propio manifiesto con muchísimos permisos. Lo que bloqueé en `app.json` no lo cambia.
- **Los permisos en general**: se le dan a Expo Go, no a mi app. Por eso "Abrir Ajustes" abre los ajustes de Expo Go.
- **El esquema `bibliotecaipf://`**: Expo Go no lo registra, por eso los deep links se prueban con `exp://…/--/`.
- **El canal de Android**: la app lo crea en tiempo de ejecución, así que sí debería verse en Expo Go, pero dentro de los ajustes de Expo Go y no de una app propia.

Para verificarlos haría una development build (`npx expo run:android` o `eas build --profile development`) y revisaría los archivos nativos que genera `npx expo prebuild`. Lo que sí revisé sin compilar fue `npx expo config --type introspect`, que muestra el manifiesto y el Info.plist que se generarían: quedan `INTERNET`, `VIBRATE` y `CAMERA` más los de `expo-notifications`, y en iOS solo `NSCameraUsageDescription` con mi texto.

[COMPLETAR JAVIER: en el teléfono Android, después de activar "Recordarme" y conceder el permiso, entrar a Ajustes → Apps → Expo Go → Notificaciones y anotar si aparece el canal "Préstamos". (Predicción: aparece.)]

# Parte E · Buenas prácticas y decisiones de diseño

## E1. Revisión de código

### a)

Lo reviso como un pedido de cambios. Uso la clasificación del TP 1: error de ejecución, advertencia, rendimiento u optimización, mala práctica.

| Línea | Problema | Tipo | Por qué pasa | Cómo lo corrijo |
|---|---|---|---|---|
| 10 y 22 | `useState<any[]>` y `libro: any` | Mala práctica | Con `any` TypeScript deja de revisar: un `libro.titlo` mal escrito compila igual y rompe en el teléfono. | Usar el tipo `Libro` de `src/types`. |
| 13-16 | Pide cámara y notificaciones al abrir el Catálogo | Mala práctica | La persona ve dos diálogos del sistema antes de ver un solo libro, sin saber para qué. Lo más probable es que diga que no a los dos. | Pedir cada permiso cuando se usa: la cámara al tocar "Escanear" (con pantalla previa) y las notificaciones al activar "Recordarme". |
| 14-15 | Las promesas de los permisos no se esperan ni se manejan | Advertencia | Si alguna falla queda un rechazo de promesa sin manejar. | Se resuelve sacando esas líneas (ver la fila anterior). |
| 16 | `[]` sin `pedirPermiso` en las dependencias | Advertencia | El lint marca `react-hooks/exhaustive-deps`: el efecto usa algo que no declara. | Se va con la corrección de 13-16. |
| 18-20 | `useEffect` sin array de dependencias | Rendimiento | Corre después de cada render, y como hace `setLibros`, provoca otro render: un bucle de pedidos (lo detallo en b). | Poner `[]` o, mejor, usar `useLibros` con su dependencia `intento`. |
| 19 | Sin `.catch`, sin cargando y sin error | Error de ejecución | `obtenerLibros()` falla 1 de cada 5 veces: queda un rechazo sin manejar y la pantalla en blanco, sin mensaje ni forma de reintentar. | Estados de cargando, error con "Reintentar" y vacío (`useLibros` + `EstadoCargando`, `EstadoError`, `EstadoVacio`). |
| 19 | El efecto no tiene limpieza | Advertencia | Si la persona sale antes de que llegue la respuesta, `setLibros` se ejecuta igual y una respuesta vieja puede pisar a una nueva. | Limpieza con una bandera `vigente`. |
| 22-30 | `Fila` declarado adentro de `Catalogo` | Rendimiento | En cada render se crea una función componente nueva. React la ve como un tipo distinto y desmonta y vuelve a montar todas las filas. | Declararlo a nivel de módulo, en su propio archivo (`src/components/FilaLibro.tsx`). |
| 24 | `'/libro/' + libro.isbn` | Mala práctica | Al armar la ruta pegando texto se pierden las rutas tipadas: un error de tipeo en la ruta no lo detecta nadie. | `router.push({ pathname: '/libro/[isbn]', params: { isbn } })`. |
| 24 y 37 | `Pressable` sin `accessibilityRole` | Mala práctica | El lector de pantalla no anuncia que es un botón. | `accessibilityRole="button"`. |
| 25 | Estilo en línea con `#333`, `16` y `12` | Mala práctica | Los valores quedan repetidos y sueltos; cambiar el color de la app obliga a buscarlos uno por uno. Además el objeto se crea en cada render. | `StyleSheet.create` con valores de `src/constants/tema.ts`. |
| 33-36 | `ScrollView` + `map` | Rendimiento | Dibuja todos los libros juntos, aunque no se vean. Con un catálogo grande se nota. | `FlatList`, que dibuja solo lo visible. |
| 35 | `key={i}` | Advertencia | Si la lista cambia de orden o se filtra, React confunde las filas porque la key va con la posición y no con el libro. | `keyExtractor` con el ISBN. |
| 37-39 | Botón de solo ícono, sin etiqueta y de 28 × 28 | Mala práctica | El lector de pantalla no sabe qué hace, y el área táctil es menor a 44 × 44. | `accessibilityLabel="Escanear"` y `minHeight`/`minWidth` de 44, o un botón con texto e ícono como el mío. |

### b)

Sin array, el efecto corre después de **cada** render. Paso a paso:

1. Render 1 con `libros = []`. Corre el efecto y pide los libros.
2. A los 800 ms llega la respuesta y `setLibros(datos)` provoca el render 2.
3. Después del render 2 el efecto corre otra vez y vuelve a pedir.
4. A los 800 ms llega un array **nuevo** (la API devuelve copias), `setLibros` provoca el render 3, y así sigue.

O sea, un pedido nuevo cada 800 ms, la lista dibujándose una y otra vez, y datos y batería gastándose sin que la persona haga nada. A eso se suma el otro efecto: cuando `useCameraPermissions` actualiza su estado, hay un render extra que dispara otro pedido.

En mi caso hay un detalle más: la API falla 1 de cada 5 veces. Cuando falla no hay `setLibros`, entonces no hay render nuevo y el bucle se corta solo. En promedio corta a los pocos segundos, pero vuelve a arrancar en cuanto otra cosa provoca un render (por ejemplo, un cambio de permiso). Durante el primer minuto la app va alternando entre ráfagas de pedidos y momentos quietos, sin ningún patrón que se pueda prever.

Si `obtenerLibros()` devolviera **siempre el mismo array**, el bucle se cortaría enseguida. Cuando a `setLibros` le pasás exactamente el mismo objeto que ya tenías, React compara con `Object.is`, ve que es igual y no vuelve a renderizar. Habría un pedido, un render con los libros, un segundo pedido que devuelve el mismo array, y ahí se frena. El problema es que eso es "suerte": depende de un detalle de la API que en una API real nunca pasa, porque cada respuesta trae objetos nuevos.

### c)

Mi pantalla de Catálogo ya es esa reescritura (`src/app/(tabs)/(catalogo)/index.tsx:12-33`). Lo central son las líneas 13-22:

```tsx
  const { libros, cargando, error, reintentar } = useLibros();

  if (cargando) return <EstadoCargando mensaje="Cargando el catálogo…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={reintentar} />;

  return (
    <FlatList
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <FilaLibro libro={item} />}
```

Lo que cambió respecto del código del compañero:

- Los datos vienen de `useLibros` (tipado, con limpieza, cargando, error y reintentar).
- No pide ningún permiso. El escáner se abre con el botón "Escanear" de `AccesosCatalogo`, que tiene texto, ícono, rol de botón y 44 de alto. El permiso se pide recién en `/permisos/camara`.
- `FilaLibro` está en su propio archivo, con `router.push` tipado, `accessibilityRole` y estilos de `tema.ts`.
- `FlatList` con `keyExtractor` por ISBN y `ListEmptyComponent`.

### d)

**Rechazo en la tienda**: pedir la cámara y las notificaciones apenas se abre la app, sin que la persona haya hecho nada que las necesite (líneas 13-16). Las guías de Apple piden que un permiso se solicite cuando la función se va a usar y con un texto que explique para qué. Una app que pide la cámara en la pantalla de inicio, sin contexto, es un motivo típico de rechazo en la revisión.

**Desinstalación**: la línea 19 sin manejo de error. Una de cada cinco veces la primera carga falla y el Catálogo queda en blanco: sin mensaje, sin "Reintentar", sin nada. Quien abre la app por primera vez y ve una pantalla vacía piensa que la app no anda y la borra. Si a eso le sumás los dos diálogos de permisos al entrar, la primera impresión es la peor posible.

## E2. Organización y acoplamiento

### a)

Así importan las carpetas en mi proyecto (la flecha es "importa de"):

| Carpeta | Importa de |
|---|---|
| `app` | `components`, `hooks`, `lib`, `context`, `constants`, `types` |
| `components` | `hooks`, `lib`, `estructuras` (solo el tipo `Cola` en `FilaMostrador`), `constants`, `types` y otros componentes |
| `hooks` | `context`, `lib`, `constants`, `types` |
| `context` | `estructuras`, `lib`, `data`, `constants`, `types` |
| `lib` | `data`, `constants`, `types` |
| `data` | `types` |
| `constants` | `types` y otras constantes (`navegacion` usa `tema`) |
| `estructuras` y `types` | Nada |

No hay ninguna importación "hacia arriba": lo comprobé buscando `from '../app'` fuera de `src/app` y no aparece nada. Las dependencias van siempre de las capas de pantalla hacia las de lógica y datos.

Sería un problema que, por ejemplo, un hook importara algo de `src/app` porque cada archivo de `app` es una ruta. Importarlo ejecuta ese módulo de pantalla y ata el hook a una ruta: si mañana cambio la URL o muevo la pantalla, se rompe un hook que no tenía nada que ver. Además se forman ciclos (la pantalla importa el hook y el hook importa la pantalla), que en JavaScript pueden dejar valores `undefined` al arrancar.

### b)

Cambiarían más de dos archivos:

- `src/lib/api.ts`: `fetch` en lugar de la simulación.
- `src/data/libros.ts`: desaparece, o queda solo para pruebas.
- `src/lib/catalogo.ts`: `buscarLibroPorIsbn` busca en `LIBROS` de forma sincrónica, y con una API pasaría a ser asincrónica.
- Por eso también todos los que la usan: el Detalle, el modal de reserva, el mostrador, `TarjetaPrestamo`, `MisEsperas`, `useLectorIsbn` y `useRecordatorio`. Hoy leen el libro "al instante", y con una API tendrían que manejar su propio cargando y error.

Eso me dice que mi diseño tiene un acoplamiento que no se ve a simple vista. El Catálogo pasa por `useLibros` y está bien aislado, pero el resto de la app saltea esa capa y lee los datos locales directo. Lo mejoraría con una sola fuente: por ejemplo, guardar en el Context los libros que trae `useLibros` (como caché) y un hook `useLibro(isbn)` que lea de ahí. Así, cambiar a una API real tocaría `api.ts` y nada más.

### c)

**Lo que ganaría**: menos código en cada pantalla y los cuatro estados resueltos siempre igual, en un solo lugar.

**Lo que perdería**:

- Un envoltorio así muestra a los hijos solo si hay permiso. En mi escáner, el campo para escribir el ISBN tiene que aparecer siempre, con o sin cámara: la app nunca se tiene que bloquear. Con `<ConPermiso>` envolviendo todo, sin permiso desaparecería también la alternativa. Habría que agregarle props para eso, y deja de ser tan simple.
- La pantalla previa hoy es una ruta (`/permisos/[recurso]`): se abre como modal, tiene botón atrás y se puede abrir por URL. Adentro de un componente se pierde todo eso.

Para las notificaciones no me serviría. Un componente decide qué mostrar cuando se dibuja, y el permiso de notificaciones no se pide al abrir una pantalla, sino cuando la persona toca un interruptor: es una acción, no algo que se dibuja. Por eso prefiero el hook: `usePermiso` me sirve en los dos casos. El escáner lee `estado` para elegir qué mostrar, y "Recordarme" consulta y navega a la pantalla previa solo cuando se toca (`src/hooks/useRecordatorio.ts:30-44`).

## E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
|---|---|---|
| `obtenerLibros()` falla | "No pudimos cargar el catálogo. Revisá tu conexión y probá de nuevo." y el botón "Reintentar". | `src/hooks/useLibros.ts:23-25` y `src/app/(tabs)/(catalogo)/index.tsx:16` |
| Se abre `/libro/abc` | "Ese código no es un ISBN" con la explicación y "Ir al catálogo". | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx:23-33` |
| Se escanea un ISBN que no está en el catálogo | Un aviso ("El libro con ISBN … no está en el catálogo. Podés probar con otro.") una sola vez por código; la cámara sigue andando. | `src/hooks/useLectorIsbn.ts:24-29` |
| La cámara está bloqueada | "La cámara está bloqueada… Podés habilitarla en Ajustes o escribir el ISBN a mano", el botón "Habilitar la cámara" (que lleva a "Abrir Ajustes") y el campo para escribir el ISBN. | `src/components/ZonaCamara.tsx:53-58` y `src/components/PantallaPermiso.tsx:54-58` |
| Las notificaciones están denegadas | Arriba de Mis reservas: "Notificaciones bloqueadas: los avisos te aparecen acá, dentro de la app." Los avisos (entrega, recordatorio no programado) aparecen como tarjetas en Mis reservas. | `src/components/EstadoNotificaciones.tsx:12`, `src/components/PantallaPermiso.tsx:34-37` y `src/app/mostrador.tsx:29-34` |
| Se intenta reservar un libro ya reservado | En el detalle, en lugar del botón: "Ya tenés este libro prestado" o "Estás en la lista de espera, en el lugar N". Si se llega al modal por URL: "Ya reservaste este libro. No se puede reservar dos veces." | `libro/[isbn].tsx:61-73`, `src/components/ConfirmacionReserva.tsx:40-48` y `src/context/BibliotecaContext.tsx:128-130` |
| "Entregar al siguiente" con la lista de espera vacía | "Nadie está esperando este libro." y el botón deshabilitado. Si igual llegara a ejecutarse: "Nadie está esperando …: no hay a quién entregarlo." | `src/components/FilaMostrador.tsx:21` y `31`, `src/app/mostrador.tsx:24-27` |
| Login con clave incorrecta | "El usuario o la clave no son correctos. Revisalos y probá de nuevo." | `src/components/FormularioLogin.tsx:15-19` |

En ninguna la respuesta es "nada" ni "se rompe": todas muestran un mensaje en español y dejan una salida.

## E4. Decisiones con argumentos

### a)

Me quedo con el **ISBN** como parámetro de ruta y como key.

- Es el dato que viene en el código de barras. El escáner lee el EAN-13 y con ese mismo texto abre `/libro/[isbn]`, sin traducir nada (`useLectorIsbn.ts:34`). Con un id propio necesitaría una tabla de ISBN → id.
- Dos ediciones del mismo título tienen ISBN distinto. Para una biblioteca eso está bien: son libros físicos distintos, con año y ejemplares distintos. En mi catálogo cada fila es una edición.
- `useLocalSearchParams` siempre devuelve texto (o un array de textos), nunca un número. Es lo que vimos en el E1 del TP 2: `"5"` no es igual a `5`. Con un id numérico tendría que convertir y validar en cada pantalla. El ISBN lo trato como texto desde el principio, y además así no pierdo ceros adelante ni me paso del tamaño seguro de los números de JavaScript. Lo valido con `esIsbnValido` (`src/lib/catalogo.ts:4-6`).

El punto débil son los libros sin ISBN (por ejemplo, una tesis o un libro donado muy viejo). Para esos le asignaría un código interno de 13 dígitos (como hacen muchas bibliotecas con una etiqueta propia), así el resto de la app no cambia.

### b)

Me quedo con la **clase con `#items`**, pero tratada como si no se pudiera modificar.

**Lo que me dio**:

- Encapsulamiento: nadie puede hacer `pila.items.splice(…)` por error. Solo se toca por `push`, `pop`, `encolar`, `desencolar`.
- Nombres que dicen qué hace cada operación (`tope()`, `frente()`, `tamanio`).
- Una `Cola` sin `shift()`, con desencolar O(1) amortizado.
- Pude probarlas aparte con 10 tests.

**Lo que me complicó**:

- React detecta cambios comparando referencias. Si muto la clase, no se entera (el problema de B3). Tuve que armar una estructura nueva en cada cambio (`BibliotecaContext.tsx:141-143`), y esa copia es O(n): pierdo la ventaja de la Cola eficiente.
- No se puede guardar directo en AsyncStorage, porque `JSON.stringify` de una clase con `#items` da `{}`. Tengo que pasarla a array con `aArray()` y reconstruirla al cargar (`BibliotecaContext.tsx:79-80`).

Con un array en el estado (`[...pila, x]`, `slice`) todo eso sale gratis, pero se pierden las reglas: cualquiera podría sacar del medio de la cola. Para una consigna que es justamente sobre pilas y colas, prefiero la clase.

### c)

Sí, uso los dos.

**Dónde aportan**: el `value` del Context con `useMemo` (`src/context/BibliotecaContext.tsx:196-235`). Sin eso, cada render del proveedor arma un objeto nuevo y todos los componentes que leen el Context se vuelven a renderizar aunque no haya cambiado nada. También aporta que las funciones que van en ese `value` sean estables con `useCallback`, porque si no, el `useMemo` se rompería en cada render. Y en `usePermiso`, que `consultar` sea estable evita que `useFocusEffect` y el efecto de `AppState` se vuelvan a suscribir en cada render.

**Dónde serían ruido**: por ejemplo, el `useCallback` de `reintentar` en `useLibros.ts:31-33` o los de `leerCodigo` y `escribirCodigo` en `useLectorIsbn.ts:37-38`. Esas funciones van a componentes que no están memorizados, así que se vuelven a dibujar igual. Además el proyecto tiene activado el React Compiler (`app.json`, `experiments.reactCompiler`), que memoriza solo, así que muchos `useCallback` escritos a mano no cambian nada.

**Cómo lo comprobaría**: con el Profiler de React DevTools. Grabo una interacción (por ejemplo, prender "Recordarme") y miro qué componentes se dibujaron y por qué ("why did this render"). Después saco el `useMemo` y comparo. Si el número de renders no cambia, era ruido.

### d)

Los **calculo**. `disponibles()` resta a los ejemplares iniciales los préstamos que salieron del estante (`src/context/BibliotecaContext.tsx:105-114`):

```tsx
// Se calcula: los ejemplares iniciales menos los que salieron del estante en mis préstamos.
const disponibles = useCallback(
  (libro: Libro) => {
    const prestadosDelEstante = prestamos.filter(
      (p) => p.isbn === libro.isbn && p.origen === 'estante',
    ).length;
    return Math.max(0, libro.ejemplares - prestadosDelEstante);
  },
  [prestamos],
);
```

Cuando el mismo dato vive en dos lugares, tarde o temprano alguien actualiza uno y se olvida del otro. Por ejemplo: guardo `disponibles` en el estado, lo resto al reservar, pero al devolver solo saco el préstamo de la lista. Desde ahí el Detalle dice "0 disponibles" aunque el libro está en el estante, y nadie más lo puede reservar. O al revés: me olvido de restar y dos personas se llevan el último ejemplar. Son errores que no tiran ningún mensaje, solo muestran un número equivocado.

Mi diseño lo evita porque hay **una sola fuente**: la lista de préstamos. El número de disponibles se deriva de ella en cada render, así que no se puede desincronizar. Si devuelvo, desaparece el préstamo y el número sube solo.
