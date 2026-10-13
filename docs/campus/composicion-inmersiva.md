# Ajuste de composición inmersiva

El Shell construido sobre esta composición está en [Fase 3.0](shell-3.0.md).

## Cambios

`/campus-3d` presenta ahora la escena como fondo de todo el viewport. Se eliminaron el límite de 1600 px del contenedor, el padding que reducía el visor y la altura `clamp(380px, 65vh, 850px)`. La página ocupa `100dvh`; `.campus-viewport` cubre su superficie completa mediante `position: absolute; inset: 0`.

Las herramientas son capas flotantes independientes. El botón **Vista general** permanece visible arriba. **Mostrar diagnóstico** abre los controles existentes de departamentos, cubierta, reserva de panel, órbita de depuración, instrucciones e inspección del activo. Al entrar, el diagnóstico está plegado para dar protagonismo al campus. Desplegarlo no desmonta ni redimensiona el canvas; su contenido puede desplazarse dentro de una altura máxima del 45% del viewport.

`use-overlay-insets.ts` observa con ResizeObserver el visor, la barra superior y el diagnóstico. Sus medidas se convierten en márgenes de composición para la cámara. El futuro Shell podrá sustituir esas medidas por las de sus barras y paneles, manteniendo independiente el lienzo.

## Cámara general

La caja global del campus obligaba a incluir esquinas vacías a la altura del edificio más alto, incluso sobre zonas de terreno bajo. Ahora se almacenan las ocho esquinas de la caja local de cada malla visual, transformadas a coordenadas mundiales. La composición general usa esos puntos reales y las seis anclas de etiquetas. Los proxies siguen siendo exclusivamente geometría de selección.

Se mantiene el equilibrio de la silueta en perspectiva y se reduce el margen final de la vista general del 4% al 2,5%. El margen periférico general es menor que el de enfoque: hasta 56 px horizontal y 18 px vertical, además del espacio medido para herramientas. Los márgenes se adaptan al área restante cuando el viewport es bajo.

Ejemplo matemático con visor completo de 1366 × 657 px y reservas superior/inferior de 64 px:

| Medición                                   | Resultado                                                      |
| ------------------------------------------ | -------------------------------------------------------------- |
| Distancia con puntos por malla             | 138,00 m                                                       |
| Distancia con caja global, mismos márgenes | 151,30 m                                                       |
| Huella proyectada de los puntos del campus | Aproximadamente 788 × 479 px                                   |
| Con panel derecho de 320 px                | Distancia 138,00 m; composición desplazada hacia la zona libre |

Estas medidas describen el encuadre, no una captura visual ni una medición de FPS. En este ejemplo la reserva lateral cabe sin alejar la cámara; en otras proporciones puede necesitar una distancia mayor para conservar todo el campus visible.

No se modifica la escala de objetos, vértices, materiales, contrato ni archivo GLB. Los seis enfoques conservan sus nodos focus, anclas y cotas del grupo completo. La amortiguación, las interrupciones de vuelo, el regreso general, la cubierta y la alternativa sin WebGL continúan funcionando con el mismo estado y ciclo de vida.

## Paneles y responsive

La reserva contextual se dibuja sobre el canvas completo. A partir de 760 px de ancho del visor, ocupa hasta 320 px a la derecha. Por debajo, se apila sobre el diagnóstico y ocupa hasta 160 px o el 30% de la altura que queda libre entre herramientas. La cámara suma esa reserva a las medidas del diagnóstico; el canvas conserva sus dimensiones.

La guía CSS y el cálculo de cámara comparten medidas mediante variables `--campus-ui-top` y `--campus-ui-bottom`. Las consultas de contenedor usan el ancho del visor. La barra superior y el diagnóstico respetan los safe areas del dispositivo. Se mantienen el movimiento reducido, la navegación por botones y el desplazamiento táctil dentro del diagnóstico.

## Validación

- `pnpm check`: aprobado (Prettier, ESLint y TypeScript).
- `pnpm test`: **68 pruebas aprobadas**, conservando las existentes.
- `pnpm build`: aprobado; copia y contrato del GLB verificados antes de compilar.
- SHA-256 del GLB sin cambios: `b31cdb3b0b91d46e860125a1870ee3194db7b6d19bb1d5dc01d5161f446f55aa`.
- Nuevas pruebas numéricas: seis viewports completos (320 × 568, 640 × 320, 768 × 1024, 1366 × 657, 1920 × 1080 y 2560 × 1080), diagnóstico abierto/cerrado y reserva activada/desactivada, para vista general y seis departamentos. Se comprueban límites de proyección y planos cercano/lejano.
- Se verifica que la nueva composición acerca la cámara frente a la caja global, con escalas de todos los nodos iguales a uno. También se comprueba que plegar el diagnóstico conserva el visor y permite regresar.
- La suite de campus tiene **13 pruebas Playwright**, incluidas tres nuevas para tamaño completo del canvas, persistencia al abrir herramientas y ausencia de scroll del documento. Las existentes se adaptaron para desplegar el diagnóstico.

`pnpm test:e2e -- e2e/campus.spec.ts` no pudo iniciar el servidor de pruebas en este entorno: la apertura del puerto está restringida. Las pruebas de navegador quedan pendientes aquí; la revisión previa del usuario en Brave corresponde a Fase 2.1, antes de este ajuste.

## Limitaciones y preparación del Shell

- Conservar el campus completo limita cuánto puede llenar simultáneamente ambos ejes: móviles verticales y ventanas ultrapanorámicas mantendrán cierta superficie de fondo libre. No se fuerza un zoom que corte edificios.
- Abrir el diagnóstico o reservar un panel puede alejar la cámara para evitar ocultaciones. Plegarlo recupera el encuadre inmersivo mediante la misma transición suave.
- Las cajas por malla son más ajustadas que la caja global, pero no representan una silueta exacta por triángulo. Se conservan márgenes para no cortar contenido.
- Debe revisarse visualmente en Brave la colocación de etiquetas, las transparencias y los vuelos con paneles. La contención geométrica no detecta toda oclusión entre edificios.
- El canvas completo aumenta los píxeles procesados frente al visor anterior. Se conserva el DPR máximo de 1,5 y el renderizado bajo demanda; el rendimiento de GPU requiere dispositivos reales.
- Sigue el aviso de tamaño del bundle 3D, aproximadamente 946 kB minificados / 255 kB gzip. No se añadieron efectos ni dependencias.

Para el Shell final, conservar el canvas como capa independiente y entregar a la cámara los insets reales de sus elementos flotantes. Coordinar la aparición de paneles con el encuadre y mantener el diagnóstico como herramienta plegable. Este ajuste no incorpora el diseño cinematográfico definitivo.

Referencias: [Canvas de R3F](https://r3f.docs.pmnd.rs/api/canvas) y [cajas de límites de Three.js](https://threejs.org/docs/pages/Box3.html).
