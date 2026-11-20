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
