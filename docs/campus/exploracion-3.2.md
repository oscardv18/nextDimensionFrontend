# Fase 3.2 — Exploración híbrida del campus

## Alcance

Se revisaron el controlador, la selección por proxies, etiquetas, capas del Shell, contratos, documentos de composición y pruebas. La línea base tenía 88 pruebas unitarias aprobadas. La referencia disponible en `references/` es el mockup aprobado; no hay videos locales para verificar su interacción.

Se conserva el encuadre general aceptado provisionalmente, los seis perfiles departamentales y el mecanismo de reservas. No se cambia `camera-framing.ts`, el GLB, sus identificadores, Blender, el Shell visual, sus componentes o las rutas. No se añaden dependencias.

## Controles

| Entrada sobre escena 3D                | Acción                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Botón izquierdo + arrastre             | Desplazamiento horizontal del campus, sin rotar cámara                                                    |
| Clic sin arrastre en un edificio       | Selección mediante su proxy y vuelo al departamento                                                       |
| Clic/Enter/Espacio en tarjeta          | Enfoque mediante la navegación existente                                                                  |
| Rueda / scroll de trackpad             | Zoom hacia el punto del plano bajo el cursor, sujeto a límites                                            |
| Un dedo                                | Desplazamiento                                                                                            |
| Dos dedos                              | Pinch para zoom y desplazamiento con el punto medio                                                       |
| Escape / botón Control / Vista general | Regreso al encuadre general calculado existente                                                           |
| Buscador / diagnóstico                 | Alternativa visible y accesible para elegir departamentos                                                 |
| Órbita libre de diagnóstico            | Rotación manual de depuración; desactiva el adaptador de exploración y al salir vuelve al encuadre guiado |

El arrastre también puede empezar sobre un edificio: supera el umbral y desplaza, sin seleccionarlo al soltar. Las barras, tarjetas y paneles HTML conservan sus eventos y su scroll. Los controles se describen en los catálogos es/en del diagnóstico.

## Integración y estados

`manual-navigation.ts` adapta entradas del **canvas** a objetivos de posición/target. No tiene loop de render ni anima una segunda cámara. `CampusScene` aplica esos objetivos con el mismo `advanceSpring`, velocidades, cámara de Fiber y target de OrbitControls que usa para los vuelos.

El estado visible se deriva de la selección, revisión y encuadre asentado existentes; no hay otro almacén de navegación. `data-navigation` permite diagnosticar:

- `overview`: encuadre general asentado.
- `manual`: exploración (incluye la breve convergencia del resorte).
- `transition`: vuelo automático en curso.
- `focused`: departamento enfocado.

La exploración conserva el departamento y el panel seleccionados, incluida la cubierta de Compras. No cambia de departamento por mover la cámara. En un departamento siguen ocultas las etiquetas secundarias según la política existente; para recuperarlas, regresar a vista general.

**Arbitraje:** un arrastre válido o zoom interrumpe un vuelo desde la posición visible y reinicia las velocidades de ese vuelo. Elegir un departamento, repetir la selección o regresar a general cancela los punteros pendientes y reemplaza el objetivo manual por el encuadre guiado; la selección más reciente gana. Cambiar el tamaño del viewport o las reservas del panel durante exploración no fuerza un regreso inesperado a la cámara guiada. Una nueva orden explícita usa las dimensiones y reservas vigentes.

Con movimiento reducido se aplica el objetivo en un fotograma, tanto manual como guiado. Las entradas se ignoran mientras no exista el primer encuadre o si una cámara de depuración está todavía por debajo de la altura segura/orientada hacia arriba al salir de ese modo. Así no se toma como posición manual válida una vista incompatible con el plano del campus.

## Clic, arrastre y HTML

El umbral es **6 píxeles CSS**. Se registra si hubo un arrastre en cualquier momento, no solo la distancia entre pulsar y soltar: un movimiento de ida y vuelta no se convierte en clic. Dos dedos también inhiben selección. El siguiente gesto nuevo restablece la posibilidad de clic.

Los listeners nativos en captura del canvas detienen el clic derivado de un arrastre antes de que alcance los eventos de selección de Fiber; el proxy añade la misma comprobación como defensa. La captura de puntero mantiene un arrastre activo al salir del canvas. `pointercancel`, pérdida de captura, pérdida de foco, órdenes automáticas y desmontaje liberan los punteros y listeners.

`touch-action: none` se aplica **solo al canvas**. La rueda sobre él usa un listener no pasivo y evita el scroll de página; los eventos iniciados en HTML no pasan por ese listener. No se añade un listener global de rueda ni se impide el desplazamiento táctil de paneles.

La selección sigue la [semántica de eventos de React Three Fiber](https://r3f.docs.pmnd.rs/api/events). Se conserva [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) como target y herramienta de diagnóstico, sin dos controles de entrada activos simultáneamente.

## Plano, límites y zoom

Los límites se calculan con `campus.bounds`, procedentes del GLB real. Son configurables en `manualNavigationConfig`:

- Plano de movimiento: Y mínima del campus.
- Target X/Z: caja real, ampliada un 25 % por eje.
- Distancia mínima: 12 % de la diagonal, elevada si hace falta para mantener la cámara por encima de los edificios.
- Distancia máxima: seis diagonales.
- Altura mínima: cota máxima real + 1,2 % de la diagonal + plano cercano de cámara.
- Sensibilidad de rueda: factor exponencial `exp(deltaPixels × 0.0015)`, con delta acotado a ±160 px por evento. Líneas y páginas se normalizan antes del cálculo.

El zoom calcula la intersección del rayo del cursor con el plano antes y después del cambio de distancia, y traslada posición y target en XZ para conservar ese punto bajo el cursor. Una copia temporal de cámara se usa únicamente para calcular proyecciones del objetivo; no renderiza ni controla la escena. Cuando el rayo no corta el plano o se alcanza un límite, prima la estabilidad y el zoom puede dejar de conservar exactamente el punto del cursor.

La orientación se conserva durante pan y zoom. La altura protege contra techos de manera conservadora en todo el campus: **no es un sistema de colisiones detallado por habitación**. Los objetivos y cada fotograma manual se limitan; se retiran velocidades residuales al tocar un límite para evitar penetraciones u oscilaciones durante entradas rápidas. Los vuelos aprobados conservan su comportamiento.

## Rendimiento

Posiciones, velocidades y punteros viven fuera del estado React. React recibe una notificación al entrar en exploración o cambiar de orden, no una actualización por cada movimiento. Las etiquetas siguen proyectándose después del controlador de cámara, con el layout adaptativo existente.

Se mantiene `frameloop="demand"`. El adaptador solicita fotogramas al recibir entrada y el resorte mientras converge; una escena manual asentada descansa. Las suscripciones se retiran al desmontar o entrar en depuración. No se han medido FPS, memoria o latencia táctil con un navegador.

La compilación del visor ronda **961 kB minificados / 260 kB gzip**. Persiste el aviso de chunk >500 kB, sin aumentar su límite. No se añade una biblioteca de gestos ni posprocesado.

## Validación real

| Comprobación                    | Resultado                                                               |
| ------------------------------- | ----------------------------------------------------------------------- |
| `pnpm check`                    | Prettier, ESLint y TypeScript aprobados                                 |
| `pnpm test`                     | 102 pruebas aprobadas en 12 archivos; se conservan las 88 anteriores    |
| `pnpm build`                    | Aprobada; SHA-256, 94 nodos y seis interacciones verificados            |
| Playwright Fase 3.2             | Bloqueado al conectar/iniciar Vite: `EPERM ::1:5173` y `127.0.0.1:5173` |
| Validación visual y táctil real | Pendiente; no hubo navegador ni capturas de esta fase                   |

Las nuevas pruebas cubren pan y límites, orientación, zoom a tres posiciones, normalización de rueda, altura mínima/máxima, clic pequeño, arrastre de ida y vuelta, pinch, cancelación, aislamiento de HTML y retirada de listeners. Las pruebas del controlador montan `CampusScene` con el GLB real y una **simulación de Fiber/OrbitControls**, sin WebGL: verifican exploración → Compras → regreso exacto, cambios rápidos, movimiento reducido, cambios de panel y reposo.

Se amplía la E2E anterior de órbita para comprobar pan sin rotación, manteniendo su recorrido de depuración. Se preparan dos nuevos recorridos para escritorio (arrastre, rueda, panel, selección rápida, cubierta y retorno exacto) y móvil táctil (pan, pinch y regreso). **No se presentan como ejecutados.**

Para repetir en un entorno que permita Vite y Chrome:

```sh
pnpm exec playwright test e2e/campus.spec.ts --grep 'Fase 3.2|exploración desplaza'
```

El GLB conserva el SHA-256 `b31cdb3b0b91d46e860125a1870ee3194db7b6d19bb1d5dc01d5161f446f55aa`.

## Revisión pendiente y próxima fase

1. Revisar mouse y trackpad en Brave a 1440×900 y 1920×1080, y gestos reales en un teléfono/tableta. Ajustar sensibilidad solo con esa evidencia; no cambiar el encuadre inicial.
2. Comprobar pan que cruza un edificio y vuelve al punto inicial, selección inmediatamente después, wheel sobre tres zonas del campus, Escape durante un drag y selección durante un vuelo.
3. Abrir Compras, retirar/restaurar cubierta, explorar, cambiar pestañas y desplazar listas del panel: las listas deben moverse sin mover la escena. Comprobar también resize, plegado del panel, pérdida de foco y modo de movimiento reducido.
4. Validar que el límite conservador de altura permite suficiente acercamiento. Si se requiere explorar interiores, diseñar límites y colisiones locales a partir de geometría real en otra tarea; no relajar esta protección sin pruebas.
5. El zoom apunta al plano horizontal, no a la superficie exacta del edificio. Valorar raycast a superficies visuales en una próxima iteración si las pruebas de usuario muestran que hace falta.
6. Decidir más adelante si la exploración de un departamento debe recuperar etiquetas secundarias; aquí se conserva la decisión visual existente. Medir coste de blur y latencia antes de añadir efectos.
