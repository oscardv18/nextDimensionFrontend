# Navegación espacial — Fase 2.1

Documento de Fase 2.1. El ajuste posterior de lienzo completo y herramientas flotantes está documentado en [composición inmersiva](composicion-inmersiva.md).

## Resultado

`/campus-3d` conserva el escenario y la arquitectura de Fase 2.0. Navegación guiada por defecto, seis encuadres propios, vista general equilibrada, transiciones interrumpibles, etiquetas secundarias atenuadas y renderizado bajo demanda. No se modificaron GLB, contratos, IDs ni archivos de Blender.

Controles adicionales de prueba:

- **Reservar espacio para panel:** simula un panel derecho de hasta 320 px (28% del visor) a partir de 760 px de ancho del visor. Por debajo, reserva una franja inferior de hasta 160 px (30% de la altura). Es una guía de encuadre, sin implementar el Shell.
- **Órbita libre (depuración):** habilita arrastre y zoom manual. Al desactivarla, vuelve suavemente al encuadre actual. Los botones y Escape siguen disponibles durante el vuelo y la depuración.
- La cubierta de Compras mantiene el estado elegido al navegar. Ocultarla o restaurarla no recalcula ni desplaza la cámara.

## Calibración y área segura

`camera-framing.ts` separa perfiles, área segura, ajuste de cámara y amortiguación. Las posiciones se calculan con las cotas reales del GLB; no hay coordenadas de edificios copiadas o inventadas.

Cada encuadre de departamento usa:

1. Su nodo focus como referencia espacial.
2. Los límites completos del grupo padre del proxy, incluidos muelles, voladizos y marquesinas.
3. Su ancla de etiqueta.
4. Las esquinas proyectadas, FOV, zoom, relación de aspecto, márgenes e insets del visor.

Las cotas se calculan una vez al resolver el activo. Ocultar la cubierta no cambia esos límites. La distancia se resuelve para contener los puntos dentro del área segura; con panel, se desplazan cámara y objetivo de mirada para colocar el foco en el centro del espacio restante. `pose.focus` conserva la referencia original, separada de `pose.target`.

| Departamento     | Dirección relativa del perfil (X, Y, Z glTF) | Intención                                                        |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Compras          | −1; 0,95; 1,2                                | Acceso y volumen de oficinas, con altura para revisar interiores |
| Almacén          | 1; 1,15; 1                                   | Nave y muelle desde el lado este                                 |
| Operaciones      | −1; 1; 1,2                                   | Patio y sala de control desde el exterior del campus             |
| Ventas           | −0,6; 0,9; 1,3                               | Fachada comercial y marquesina desde el sur                      |
| Administración   | 1; 1,05; 0,7                                 | Niveles y terraza desde el este                                  |
| Recursos Humanos | 0,65; 1,2; −1                                | Patio y pabellón desde el norte                                  |

Son direcciones editoriales del consumidor, normalizadas al calcular la posición; requieren aprobación visual en navegador. La vista general equilibra la silueta proyectada en cinco iteraciones y aplica un margen final de 4%. Los departamentos aplican 6%, además del margen de seguridad para etiquetas y bordes.

[Calibración numérica](calibracion-2.1.json): incluye los catorce encuadres de referencia (vista general y seis departamentos, con/sin reserva) para un visor de 1366 × 600 px, FOV 45°, con hash del activo. La vista general ocupa **95,35% del área segura en su eje limitante**; no significa que el campus llene el 95% de todos los píxeles del visor.

## Transiciones y estabilidad

La cámara y el objetivo usan amortiguación crítica con posición y velocidad conservadas al cambiar de destino. No se encolan vuelos ni se ejecutan temporizadores de finalización. La revisión de selección identifica el último comando y evita mostrar una selección anterior como terminada.

El primer encuadre se coloca directamente, antes de que exista una vista útil. Las siguientes transiciones parten del estado actual. El paso temporal se limita a 50 ms para evitar un salto tras suspender una pestaña. Se respetan la preferencia de movimiento reducido del sistema y la existente en la aplicación: en ese caso el encuadre se coloca directamente.

La órbita está desactivada por defecto. Al activarla, una interacción manual interrumpe el vuelo; desactivarla o seleccionar otro encuadre retoma la guía. Las etiquetas secundarias quedan a opacidad 0,16 durante el enfoque; la etiqueta seleccionada y los controles mantienen su protagonismo.

## Validación

- Hash, 94 nodos y seis interacciones: **aprobados** mediante `scripts/verify-campus.mjs`.
- **58 pruebas unitarias aprobadas**, conservando las existentes. Las 19 nuevas pruebas de cámara comprueban 84 combinaciones de encuadre (siete destinos × seis tamaños, desde 294 px útiles en un móvil de 320 px × dos reservas), además de raycast desde la vista general, encuadre estable con cubierta oculta, ocupación general, insets personalizados, redirección rápida y convergencia a 30/60/120 FPS.
- TypeScript, ESLint y Prettier: **aprobados**.
- Compilación de producción: **aprobada**, con aviso de tamaño del chunk 3D.
- Diez pruebas Playwright de campus preparadas: incluyen las originales y comprobaciones de proyección real, selección por proxies, cubierta real, interacción rápida, reposo del renderer, órbita opcional, movimiento reducido y tamaños de 390/768/1366 px.
- **Pruebas de navegador no ejecutables aquí:** el servidor Vite falla al abrir el puerto con `EPERM`; Chrome también termina con `setsockopt: Operation not permitted`. No se afirma una revisión visual nueva, ni FPS/GPU medidos. La comprobación visual de Fase 2.0 comunicada por el usuario se mantiene como antecedente.

Comandos normales en un entorno que permita servidor y navegador:

```sh
pnpm assets:verify
pnpm check
pnpm test
pnpm build
pnpm test:e2e
```

## Problemas detectados y resueltos

- **Margen excesivo y composición general descentrada:** el ajuste con esfera y centro geométrico desaprovechaba espacio. Se ajusta la proyección y su silueta.
- **Cotas incompletas:** el proxy no abarca todos los elementos exteriores. Ahora se contiene el grupo completo y su ancla.
- **Reserva responsive incoherente con el visor:** la guía visual usa consultas de contenedor, con el mismo ancho y umbral que la cámara, en lugar del ancho de ventana.
- **Órbita como navegación principal:** desactivada por defecto; se ofrece explícitamente para depuración.
- **Desplazamiento táctil bloqueado por controles desactivados:** OrbitControls escribe `touch-action: none` incluso desactivado. En navegación guiada se fuerza `pan-y`; en depuración se conserva el gesto de órbita.
- **Consumo continuo en reposo:** `frameloop="demand"` solicita fotogramas durante el vuelo y cambios reales. Las mediciones del canvas permiten comprobar el reposo en Playwright, pendiente de ejecución local.
- **Pruebas GLTF previas fallaban en jsdom:** el buffer obtenido de Node pertenecía a otro contexto y GLTFLoader no lo reconocía con `instanceof ArrayBuffer`. Ahora se copia a un buffer del entorno de prueba. Los cuatro ensayos originales pasan con el binario real.
- **Conflicto de tipos previo en `TextLink`:** incorporar R3F amplió los elementos JSX y rompió el componente polimórfico. `createElement` conserva comportamiento y API, y permite compilar sin alterar las capas.

## Rendimiento y límites pendientes

El activo permanece en 544 864 bytes y 9 492 triángulos, incluidos proxies. El DPR conserva su límite 1–1,5. No se añadieron efectos, sombras dinámicas ni recursos externos. La carga del GLB no se repite al seleccionar departamentos.

La muestra local de 1000 cálculos de encuadre de departamento promedió **0,0111 ms** con cotas ya resueltas. Solo mide CPU del cálculo matemático; no permite inferir FPS, fluidez en móviles ni latencia de carga. La compilación advierte un chunk 3D de aproximadamente **946 kB minificados / 254 kB gzip**; permanece bajo carga diferida y necesita contrastarse con los objetivos de red/dispositivo del producto.

Pendientes de revisión visual: posible oclusión entre edificios durante vuelos, solapamiento de etiquetas en vista general, cristal BLEND desde los nuevos ángulos y claridad de interiores de Compras. Las pruebas de contención garantizan espacio dentro del frustum, no visibilidad de cada superficie tras otras superficies del campus.

## Integración posterior del Shell cinematográfico

1. Pasar los insets reales de rail, cabecera y paneles a `cameraPose`. Reservar solo espacio realmente ocupado; mantener el cambio a panel inferior en móvil. La reserva actual es una simulación provisional.
2. Mantener separados el foco contractual y el objetivo de mirada desplazado por la composición. No cambiar el GLB para compensar la UI.
3. Aprobar visualmente los seis perfiles y la vista general, con/sin panel, en móvil, tableta y escritorio. Mantener las comprobaciones de contención y retorno como regresión.
4. Medir carga fría, GPU, fotogramas durante vuelos, reposo y memoria en dispositivos reales antes de definir FPS objetivo o sumar bloom, ambiente HDR, profundidad de campo o sombras.
5. Mantener la órbita dentro de herramientas de depuración. Integrar los futuros controles de navegación con el mismo estado de selección/revisión, evitando remontar Canvas o recargar el activo.
6. Revisar las etiquetas de vista general y los ángulos de transparencia con el diseño final; mantener reducción de movimiento y navegación de lista como alternativas.

Referencias de implementación: [cámara perspectiva de Three.js](https://threejs.org/docs/pages/PerspectiveCamera.html) y [renderizado bajo demanda de R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
