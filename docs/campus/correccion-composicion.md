# Corrección puntual de encuadre — provisional

**Estado: pendiente de revisión visual humana.** El código y las comprobaciones geométricas están preparados; no se ha podido ejecutar `/campus-3d` en un navegador en este entorno. El paso de pruebas técnicas no constituye aceptación de la composición.

## Referencia y diagnóstico

Se revisó `references/arxnet-approved-mockup.png`: en su vista general la arquitectura ocupa casi todo el ancho, llega cerca del dock inferior y se prolonga detrás de las capas flotantes. Las tarjetas son anotaciones sobre una escena dominante. También se revisó `capturas-3.0/overview.png`, una captura real **histórica**, que muestra mucho suelo oscuro libre debajo. No se presenta como captura de Fase 3.1 ni de esta corrección.

El cálculo anterior tenía tres problemas:

1. Los puntos de encuadre incluían las mallas del terreno, terrazas y soporte, cuyas cajas abarcan también espacio sin edificios. La iteración centraba esa silueta completa. Aunque los extremos encajasen bien, la **masa arquitectónica** quedaba pequeña y por encima del centro útil.
2. Las anclas de las seis etiquetas formaban parte de los puntos que fijaban la distancia y el centro. Fase 3.1 eliminó un suplemento vertical de 48 px, pero conservó esa dependencia y el encuadre del terreno; no resolvió la causa principal.
3. Los 56 px de margen horizontal general estaban concebidos también para texto. La elevación de unos 36,6° reforzaba la lectura de maqueta sobre una plataforma. El mockup sugiere una vista oblicua más baja, con protagonismo de fachadas y edificios.

La proyección del GLB confirma el diagnóstico: con huellas de interfaz representativas a 1440×900, el centro vertical de los edificios era **y≈299 px**, aunque el centro de la región útil era **y≈437 px**. Medir la ocupación del soporte completo, como en el informe anterior, ocultaba ese desequilibrio.

## Ajuste implementado

Se modifica únicamente la política de **vista general** dentro de `cameraPose` y la selección de sus puntos geométricos en `resolveCampus`:

- `overviewPoints` contiene las esquinas mundiales de las mallas visuales pertenecientes a los seis departamentos. La pertenencia se deriva de los grupos padres reales de sus proxies contractuales; no se inventan identificadores, posiciones o dimensiones.
- Los nodos del terreno y terrazas siguen cargados y renderizados. Pueden prolongarse detrás del Shell o fuera de los bordes del viewport; su perímetro ya no obliga a alejar los edificios.
- Las anclas y tarjetas dejan de determinar distancia y objetivo **generales**. El posicionamiento adaptativo de etiquetas sigue independiente, sin rediseñar sus componentes.
- La misma iteración de centrado existente equilibra ahora la silueta arquitectónica en los dos ejes. No se añade otro sistema de cámara.
- Dirección general `[-1, 0.82, 1]`, en lugar de `[-1, 1.05, 1]`: elevación aproximada de **30,1°**, manteniendo el azimut. La distancia y el objetivo siguen calculándose con dimensiones reales, no con una posición fija.
- Márgenes generales de **16 px horizontales y 12 px verticales**, además de las reservas medidas del Shell, y el factor de seguridad existente `1.025`. No hay margen CSS nuevo, transformación del canvas, cambio de FOV ni escala del modelo.

**Los seis enfoques departamentales se conservan:** mismos perfiles, puntos, anclas, márgenes, posiciones y objetivos para iguales dimensiones y reservas. El panel contextual mantiene el mecanismo existente; la cubierta de Compras, la órbita de diagnóstico, el resorte interrumpible, el responsive y el retorno determinista siguen disponibles. Una prueba de regresión compara los doce enfoques (seis departamentos, dos viewports) con las posiciones y objetivos anteriores.

## Comparación antes/después: proyección, no capturas

Se proyectan los mismos puntos de arquitectura real con el algoritmo anterior de Fase 3.1 y con el corregido. Las huellas usadas son arriba 64 px, izquierda 70 px, abajo 90 px; la columna «reserva derecha» distingue el caso sin reserva adicional del caso con 320 px para panel. Son **fixtures geométricos**, no mediciones de CSS ni imágenes renderizadas en Brave.

| Viewport  | Reserva derecha | Arquitectura antes | Arquitectura después | Centro vertical antes → después |
| --------- | --------------- | ------------------ | -------------------- | ------------------------------- |
| 1440×900  | 0 px            | 879×415 px         | 1300×580 px          | 299 → 434 px                    |
| 1440×900  | 320 px          | 678×345 px         | 990×459 px           | 346 → 435 px                    |
| 1920×1080 | 0 px            | 1106×513 px        | 1765×772 px          | 348 → 522 px                    |
| 1920×1080 | 320 px          | 1056×498 px        | 1456×657 px          | 361 → 524 px                    |

La región útil tiene centro vertical en 437 px y 527 px, respectivamente. El ajuste coloca la silueta arquitectónica a unos 3–5 px de esos centros y aumenta su anchura sin escalar geometría. La distancia calculada en el primer caso pasa de ≈129,1 a ≈90,8 unidades del activo.

Datos completos, incluida la regresión de enfoques departamentales: [composicion-corregida.json](composicion-corregida.json). La tabla histórica de Fase 3.1 medía soporte y anclas completos; no debe compararse directamente con esta tabla, que mide exclusivamente arquitectura.

**Comparación visual antes/después: pendiente.** No se ha generado una imagen sintética para sustituir capturas reales. El mockup contiene un activo de mayor riqueza que este blockout; esta corrección solo busca su intención de composición, no reproduce mobiliario o detalles mediante efectos.

## Validación y capturas preparadas

- `pnpm check`: formato, ESLint y TypeScript aprobados.
- `pnpm test`: **88 pruebas aprobadas**, incluidas las 85 anteriores. Las nuevas comprueban centrado y presencia arquitectónica en escritorio con/sin reserva, independencia de las anclas de etiquetas y preservación de los seis enfoques.
- Se mantienen las pruebas de siete encuadres en distintos viewports, selección real por proxies, vidrio, cubierta, transiciones interrumpidas, movimiento reducido y etiquetas.
- `pnpm build`: aprobada con verificación del GLB; persiste la advertencia de bundle 3D grande. No se eleva el umbral.
- Intento de Playwright: `DEBUG=pw:webserver pnpm exec playwright test e2e/campus.spec.ts --grep 'Shell:'`. Bloqueado antes de abrir el navegador: `connect EPERM ::1:5173` y `127.0.0.1:5173`, y el servidor Vite termina con código 1.

Se añadieron dos recorridos E2E de revisión visual, a **1440×900** y **1920×1080**. Preparan capturas reales de vista general con «Atención ahora», **Compras con interior y panel contextual**, y regreso general con reserva de panel, sin reducir el canvas. **No se han ejecutado ni generado esas capturas aquí.**

En un entorno con navegador y puertos disponibles:

```sh
pnpm exec playwright test e2e/campus.spec.ts --grep 'revisión visual provisional'
```

Los archivos esperados son `test-results/camera-correction-{1440,1920}-{overview,procurement,overview-panel}.png`. La captura automatizada aporta evidencia, pero sigue haciendo falta revisión humana contra el mockup.

## Revisión humana solicitada

Revisar `/campus-3d` en Brave a ambos tamaños y comparar con la vista superior del mockup:

1. ¿La arquitectura domina el fondo y ocupa también la zona vertical central/inferior?
2. ¿La vista oblicua evita la sensación de maqueta pequeña y mantiene reconocibles los seis departamentos?
3. ¿El terreno puede extenderse detrás de las barras sin que el recorte parezca accidental?
4. ¿«Atención ahora» y la reserva lateral mantienen información e interacciones esenciales? Al permitir arquitectura detrás de superficies flotantes, no se garantiza que cada edificio sea visible en su totalidad bajo cada panel.
5. ¿Compras conserva el encuadre aprobado, panel, interior y restauración de cubierta? ¿Las tarjetas dejan de dominar por su proporción respecto a los edificios?
6. ¿El regreso y los cambios rápidos mantienen estabilidad en móvil y escritorio?

Si la perspectiva, densidad o recorte del contexto aún no encajan, ajustar el perfil general a partir de **estas capturas**, manteniendo las regresiones departamentales. No considerar esta corrección visualmente aceptada hasta completar esa revisión.

El GLB v0.2.0, Blender, el contrato, el Shell y las escalas geométricas permanecen intactos. SHA-256: `b31cdb3b0b91d46e860125a1870ee3194db7b6d19bb1d5dc01d5161f446f55aa`.
