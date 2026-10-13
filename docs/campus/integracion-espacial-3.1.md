# Fase 3.1 — Integración espacial del Shell

**Informe histórico:** la composición general descrita aquí fue rechazada visualmente. Su encuadre se sustituye por la [corrección puntual provisional](correccion-composicion.md), pendiente de revisión visual humana. Las cifras de esta tabla pertenecen al algoritmo anterior.

## Alcance e inspección

Se revisaron `CLAUDE.md`, el plan de migración, `shell-3.0.md`, la composición inmersiva, la navegación 2.1, el contrato GLB y los componentes de `src/features/campus/`. Se inspeccionó `references/arxnet-approved-mockup.png` y las capturas históricas de Fase 3.0. Estas imágenes son referencias previas; **no son capturas de esta implementación**.

Se conserva el Shell aprobado: tarjetas, colores, iluminación nocturna, materiales, barras, paneles, transiciones y herramientas de diagnóstico. No se añaden dependencias ni se modifican el GLB, sus identificadores, el contrato, Blender o la escala geométrica.

La línea base pasó `pnpm check` y 72 pruebas unitarias. La validación actual se detalla más abajo.

## Cámara y regiones del Shell

Se amplía `useOverlayInsets`, el mecanismo existente, para entregar dos vistas de las mismas mediciones:

- Márgenes de cámara, según el borde declarado por cada slot.
- Rectángulos ocupados, relativos al canvas, para la resolución de etiquetas.

`--cc-inset: none` excluye una superficie de la reserva de cámara, pero **no** de las colisiones de etiquetas. Así «Atención ahora» puede seguir flotando sin alejar todo el campus. El título contextual se mide como obstáculo local para tarjetas, sin reservar una franja superior completa. También se incluyen menús y resultados del buscador que sobresalen de sus slots, el diagnóstico y la guía de reserva de panel.

ResizeObserver detecta cambios de tamaño; MutationObserver detecta menús, cambios de contenido y plegado aunque el slot conserve dimensiones. Las medidas se agrupan en un requestAnimationFrame y se actualizan al finalizar animaciones/transiciones. Se retiran observaciones de elementos desmontados. La cámara depende únicamente de los cuatro márgenes: cambiar un menú o mover una tarjeta no reinicia el vuelo.

Se elimina `LABEL_HEADROOM = 48`: ese suplemento fijo reducía todo el encuadre para proteger etiquetas que ahora se componen individualmente. Se mantienen los márgenes de seguridad y los siete perfiles de cámara existentes, calculados con anclas y límites reales. En móvil horizontal, un panel lateral real puede reservar hasta el 60 % del ancho, evitando el recorte que producía el anterior tope del 40 %. Los demás topes siguen protegiendo un área mínima útil.

El canvas continúa a viewport completo, sin remontaje por apertura del panel. La cámara conserva su resorte interrumpible, la selección más reciente, la órbita solo de diagnóstico y el salto al encuadre final con movimiento reducido. Su actualización ocurre antes de la proyección de etiquetas. La vuelta general recalcula exactamente la misma posición y objetivo para las mismas dimensiones y márgenes; no acumula deltas.

## Comparación reproducible de encuadres

Resultados numéricos del **GLB real**, usando huellas representativas del Shell declaradas en `camera-framing.test.ts`. No son mediciones visuales de CSS en Brave. Se compara el código anterior (margen superior extra de 48 px) con la composición actual. La extensión corresponde a todos los puntos de encuadre, incluido el zócalo y las anclas.

| Viewport  | Extensión anterior, px | Extensión actual, px |
| --------- | ---------------------- | -------------------- |
| 320×568   | 237×132                | 237×126              |
| 390×844   | 289×166                | 289×161              |
| 640×360   | 128×74                 | 226×121              |
| 768×844   | 572×353                | 572×342              |
| 1440×900  | 1044×643               | 1152×689             |
| 1920×1080 | 1330×817               | 1439×863             |

Huellas de la prueba: arriba 64 px; izquierda 70 px en escritorio y 0 en móvil; abajo 90 px en escritorio y `min(200, alto×0,4)` en móvil; sin reserva lateral en general. Los seis enfoques se prueban además con panel lateral de hasta 440 px o franja inferior de hasta la mitad del alto. El caso horizontal de esta tabla aísla la eliminación del margen fijo; la reserva lateral real tiene su propia prueba.

En escritorio y horizontal bajo aumenta la presencia del campus. En vertical el ancho limita el encuadre: su extensión horizontal se mantiene y la altura puede disminuir ligeramente por el cambio de objetivo y perspectiva. No se promete una ampliación uniforme ni se recorta el modelo para lograrla.

Comando de análisis usado en esta fase (con el código actual describe el encuadre corregido, no reproduce la tabla histórica):

```sh
CAMPUS_REPORT=1 pnpm exec vitest run src/features/campus/camera-framing.test.ts --silent=false
```

## Etiquetas adaptativas

`AdaptiveLabels` reutiliza Html de Drei y los componentes visuales `SpatialLabel` y `SpatialHotspot`. Las seis etiquetas siguen las anclas contractuales del GLB. Los tres puntos del interior de Compras siguen el centro superior de sus nodos reales, como en Fase 3.0.

`label-layout.ts` resuelve tarjetas en pantalla con una política determinista:

1. Departamento seleccionado; después hotspot activo, otros hotspots y etiquetas secundarias, con prioridad adicional al pasar sobre un edificio.
2. Intentar mantener la tarjeta cerca del ancla y de su desplazamiento anterior.
3. Buscar huecos junto a límites, obstáculos y tarjetas ya colocadas, con 8 px de separación.
4. Limitar el desplazamiento: 96 px en escritorio, 72 px en móvil y 144 px para la selección.
5. Ocultar la tarjeta si no hay un hueco válido. Los departamentos secundarios siguen desapareciendo al enfocar otro, según la decisión de Fase 3.0.

Los desplazamientos convergen con interpolación dependiente del tiempo; si una tarjeta seleccionada necesita evitar una colisión inmediata, adopta el hueco seguro sin atravesar el control. Una línea tenue conecta la tarjeta desplazada con su ancla a partir de 8 px. El estilo de las tarjetas y sus tallos se conserva.

Las tarjetas son botones accesibles (`Enfocar Compras`, etc.) y usan el mismo callback de selección que los proxies, buscador y diagnóstico. Enter/Espacio utilizan el comportamiento nativo del botón. Solo la tarjeta captura el puntero; conectores, tallos y espacios vacíos lo dejan pasar a los edificios. En vista general se protegen los centros de los proxies de los demás departamentos para que una tarjeta desplazada no intercepte esos puntos de selección. Las etiquetas ocultas quedan fuera del tabulador y del árbol accesible; se libera el foco si una tarjeta deja de ser visible. La navegación del Shell y la lista siguen disponibles cuando hay poco espacio.

## Rendimiento y materiales

- Se conserva `frameloop="demand"` y DPR limitado a 1–1,5. La composición solo solicita fotogramas mientras converge; no mantiene un temporizador de etiquetas en reposo.
- El controlador proyecta hasta nueve anclas por fotograma solicitado y, en vista general, los seis centros de proxies, además de las proyecciones que Html ya realiza. Reutiliza un Vector3 y almacena dimensiones; no lee layout ni actualiza estado de React en cada movimiento de cámara. Las dimensiones se refrescan por cambios de contenido, tamaño, hover y fuentes.
- Los callbacks de montaje son estables para conservar desplazamientos al actualizar contenido. Se memorizan las entradas y se evita repetir escrituras de transformación/visibilidad idénticas.
- La búsqueda descarta desplazamientos fuera de rango antes de ordenar y elimina coordenadas duplicadas. Es deliberadamente pequeña y acotada a seis departamentos y tres hotspots.
- Los materiales de los seis proxies tienen `visible=false`: Three omite sus draw calls y Mesh.raycast conserva la selección. Las pruebas con el GLB real verifican los seis proxies, los cristales y la cubierta. No cambia la visibilidad de los objetos ni el contrato.
- Se conserva el blur aprobado. No se ha medido su coste en GPU ni la memoria con un navegador; no se atribuyen mejoras de FPS sin evidencia.

Se sigue el patrón de mutación imperativa durante los fotogramas recomendado por [React Three Fiber](https://r3f.docs.pmnd.rs/advanced/pitfalls) y se mantiene [Html de Drei](https://drei.docs.pmnd.rs/misc/html) para la asociación con anclas.

## Validación real

| Comprobación                       | Resultado                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm check`                       | Prettier, ESLint y TypeScript aprobados                                                                   |
| `pnpm test`                        | 85 pruebas en 10 archivos aprobadas; se conservan las 72 previas                                          |
| `pnpm build`                       | Aprobada; SHA-256, 94 nodos y seis interacciones verificados                                              |
| `pnpm exec playwright test --list` | 40 pruebas reconocidas, tres nuevas de composición responsive                                             |
| `DEBUG=pw:webserver pnpm test:e2e` | Bloqueado antes de ejecutar pruebas: `connect EPERM ::1:5173` y `127.0.0.1:5173`; Vite no puede iniciarse |
| Inspección visual de esta versión  | Pendiente: no se pudo ejecutar el navegador                                                               |

Las pruebas nuevas cubren colisiones, prioridades, márgenes en cuatro tamaños, ocultación/restauración, Enter, protección del centro seleccionable de otros edificios, reposo del controlador y siete encuadres con GLB real en seis tamaños. Se preservan las pruebas de retarget rápido, cubierta, cristal, proxies y movimiento reducido. Las E2E añadidas comprueban colisiones contra el Shell, teclado o buscador, interior/restauración de Compras, retorno exacto y capturas a 390×844, 640×360 y 1440×900. **Están preparadas, pero no ejecutadas** en este entorno.

El bundle del visor sigue cercano a 955 kB minificados / 258 kB gzip, frente a los ≈948 / 255 kB documentados en Fase 3.0. La compilación mantiene la advertencia de chunks mayores de 500 kB; no se cambian sus umbrales ni se introducen librerías. El visor sigue cargándose mediante importación diferida.

El SHA-256 del GLB permanece `b31cdb3b0b91d46e860125a1870ee3194db7b6d19bb1d5dc01d5161f446f55aa`.

## Documentación y decisiones pendientes

- `CLAUDE.md` describe la fidelidad del port original; el §12 del plan ya autoriza el Shell aislado del campus. Esta fase conserva esa separación y su dirección artística.
- `shell-3.0.md` documentaba etiquetas informativas, transparentes al clic. La Fase 3.1 pide seleccionarlas: el requisito nuevo sustituye ese comportamiento y queda anotado en el documento histórico.
- El contrato exportado menciona comprobaciones pendientes del consumidor. Se conserva como copia contractual; la evidencia de React/WebGL pertenece a los informes de integración, sin alterar el contrato.
- La recomendación histórica de excluir el zócalo inferior no se aplica: sigue formando parte de los límites reales del modelo. Decidir su tratamiento visual requiere revisar la composición aprobada antes de recortarlo.

Para la siguiente iteración:

1. Ejecutar la suite E2E y revisar Brave con GPU real, especialmente Compras, móvil horizontal, plegado del panel y cambios rápidos. Generar nuevas capturas; no reutilizar las históricas como evidencia actual.
2. Revisar la densidad de tarjetas y el límite de desplazamiento con esos resultados. En espacios saturados se ocultan incluso tarjetas prioritarias si no existe hueco; la lista y el buscador siguen operativos. No se garantizan seis tarjetas simultáneas en móvil.
3. Los rectángulos de cámara siguen siendo reservas por bordes. El título y «Atención ahora» son obstáculos locales para etiquetas y pueden superponerse a geometría; una composición de cámara alrededor de regiones irregulares necesita una decisión explícita sobre espacio vs. tamaño del campus.
4. Los avisos CSS `::after` de controles «próxima entrega» no tienen rectángulo DOM propio; las superficies de sus botones sí se protegen. Si esos avisos deben participar en colisiones, convertirlos a un elemento medible conservando su aspecto. No hay prueba de oclusión por geometría para etiquetas, únicamente clipping y colisiones en pantalla.
5. Medir CPU/GPU, memoria y `backdrop-filter` durante los vuelos antes de cambiar blur o añadir posprocesado. El bundle 3D continúa siendo el principal coste de carga; dividir chunks no reduce por sí mismo el total de Three/Fiber/Drei.
