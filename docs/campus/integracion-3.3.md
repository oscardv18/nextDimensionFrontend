# Fase 3.3 — GLB 0.3.0 y apariencia coordinada

## Alcance y procedencia

Se inspeccionaron `CLAUDE.md`, los informes del campus, Shell, cámaras, proxies, etiquetas, exploración, iluminación y el almacén de apariencia. El productor está en `/home/oddv/Renders/arxnet-3d`. Se leyeron `docs/themes.md`, el manifiesto del activo, `build.json`, el GLB y `manifests/themes/arxnet.campus-themes.json`.

La copia activa está en `public/assets/arxnet.scene.campus-pilot/0.3.0/asset.glb`. Manifiesto, build y temas se copiaron literalmente a `src/features/campus/assets/`; el perfil de temas es **1.0.0, provisional**. [Procedencia](provenance-0.3.0.json) registra rutas, bytes y hashes de las cuatro copias. [Especificación del productor](themes-source-1.0.0.md) conserva su documento literalmente. No se modifica el productor, Blender, GLB original ni contrato.

SHA-256 GLB 0.3.0: `4ce11ad8dc6fd67264d77b35b2feefa87d2c49ac7c4085bb4f87d515eaaa5c47`.

Se conserva `public/assets/arxnet.scene.campus-pilot/0.2.0/asset.glb` y sus manifiesto/build en `src/features/campus/assets/0.2.0/`. SHA-256 antiguo: `b31cdb3b0b91d46e860125a1870ee3194db7b6d19bb1d5dc01d5161f446f55aa`. La reversión requiere restaurar también el consumidor anterior compatible; **no existe un selector de versión en ejecución** y cambiar únicamente el GLB no es suficiente para este adaptador de materiales.

## Integridad y límites

`pnpm assets:verify` verifica tamaño, SHA-256, estructura GLB y jerarquía. Los 94 registros anteriores conservan identidad, nombre, rol y padre; se conservan los seis identificadores e interacciones departamentales, incluidos anclas, cámaras, proxies y cubierta. Ahora hay 99 nodos, 79 mallas, 19.454 triángulos, 23 materiales y cuatro PNG incrustados de 512×512. No requiere extensiones glTF.

Los cinco nodos `environmentNodeIds` se renderizan, pero se excluyen de `campus.bounds`. Los límites navegables resultan iguales a 0.2.0, comprobados por prueba con ambas geometrías. El suelo nuevo mide **420 m de radio**, según el productor (más de 800 m de anchura); no se usa para calcular cámaras o exploración. El encuadre general sigue usando la arquitectura de los seis departamentos y los perfiles departamentales siguen usando sus dimensiones/anclas. No cambia la escala ni el algoritmo de cámara.

## Temas e integración

`CampusTheme` consume exclusivamente el manifiesto copiado. Su `applyTheme` retoma los valores actuales al recibir un cambio rápido, interpola durante 320 ms con la curva especificada y aplica valores exactos al finalizar. Con movimiento reducido el cambio es inmediato. Se actualizan fondo, niebla, exposición, entorno, colores/intensidades de hemisferio y luces direccionales, direcciones, intensidad de sombras, emisión, opacidad y parámetros PBR autorizados.

`CampusThemeRig` monta una sola instancia y un entorno PMREM de `RoomEnvironment` por carga. Las 14 luces locales permanecen en sus padres contractuales y posiciones locales reales; en Claro su intensidad llega a cero sin desmontarlas. El target de iluminación usa el centro navegable. La luz de relleno reutiliza la distancia del perfil direccional principal para construir su posición: su iluminación depende de la dirección, no de atenuación por distancia.

Los materiales se clonan una vez al preparar la escena, respetando materiales originales compartidos y sus variantes. Los proxies tienen clones independientes invisibles para que sigan seleccionando sin ocultar superficies. Al alternar no se crean materiales, luces, texturas o entornos, ni se cambia `needsUpdate`, transparencia, cara, mapas o defines. Se restaura la emisión base definida por el productor antes de aplicar intensidades, evitando aplicar dos veces el factor exportado por glTF.

El renderer usa `NeutralToneMapping`, salida sRGB y sombras PCF suaves. Las sombras direccionales mantienen el mapa y volumen especificados. El vidrio conserva cara frontal y transparencia, usa `depthWrite=false` y orden de render 1; los opacos reciben/proyectan sombras, y el suelo ampliado solo las recibe. Esta política no resuelve universalmente todas las intersecciones transparentes: necesita inspección visual real. La diferencia entre Eevee y WebGL no se da por validada.

El menú Oscuro/Claro utiliza **el mismo `useAppearance`** que el resto de la aplicación y su persistencia. La apariencia resuelta controla `data-tone` del Shell y el tema del visor; las preferencias de sistema existentes también se resuelven por ese almacén. Se activan los tokens claros existentes y se adaptan colores de etiquetas/superficies, sin cambiar su distribución o componentes. La cámara, selección, reservas, diagnóstico y controles permanecen.

Los parámetros de bloom se conservan en el manifiesto, pero **bloom no se renderiza**. El productor lo declara opcional; se evita añadir una dependencia para esta integración. La coherencia de emisión, iluminación y exposición se implementa sin ese efecto. La activación futura deberá valorar legibilidad y coste en dispositivos reales.

## Rendimiento disponible

| Medida                            | Resultado                                              |
| --------------------------------- | ------------------------------------------------------ |
| GLB 0.2.0 → 0.3.0                 | 544.864 → 1.113.320 bytes                              |
| Triángulos 0.3.0                  | 19.454                                                 |
| Materiales / luces locales        | 23 / 14                                                |
| Texturas                          | 4 PNG 512×512; 275.636 bytes incrustados               |
| Bundle del visor                  | Aproximadamente 981,66 kB minificados / 266,13 kB gzip |
| Aviso del compilador              | Chunk >500 kB, conservado sin aumentar el límite       |
| FPS, latencia, memoria GPU y blur | No medidos: navegador bloqueado                        |

Se conserva `frameloop="demand"`; cámara, etiquetas y animación de temas se actualizan fuera del estado React por fotograma. El adaptador solicita renders mientras converge y después descansa. No se vuelve a descargar o parsear el GLB al cambiar apariencia. Texturas, geometrías, materiales, luces y PMREM se liberan al desmontar. El blur del Shell no se modifica y su coste sigue pendiente de medición.

El canvas expone `data-theme`, `data-theme-settled`, `data-performance-ready` y `data-performance`: llamadas, triángulos, programas, texturas/geometrías residentes, exposición y estado de bloom/luces. Son contadores de Three del último render, no FPS ni bytes GPU. El segundo fotograma permite medir tras el primer render del GLB.

## Resultados reales

| Comprobación                                        | Resultado                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm check`                                        | Prettier, ESLint y TypeScript aprobados                                         |
| `pnpm test`                                         | 109 pruebas aprobadas en 13 archivos                                            |
| `pnpm build`                                        | Aprobado, con verificación del activo y aviso de bundle                         |
| Verificador `scripts/check_themes.py` del productor | Aprobado; [informe](validation-themes-0.3.0.json)                               |
| Playwright Fase 3.3                                 | Intentado; bloqueado antes de navegador por `EPERM ::1:5173` y `127.0.0.1:5173` |
| Capturas oscuro/claro                               | No generadas; revisión visual pendiente                                         |

Las pruebas conservadas cargan la geometría 0.3.0 y comprueban encuadres, selección, navegación y cubierta. Las nuevas pruebas cubren compatibilidad de los 94 nodos, límites idénticos a 0.2.0, perfiles, mapas/color space, transparencia y sombras, emisión, cambios rápidos, movimiento reducido, identidad estable de materiales y luces, versiones de materiales y limpieza. La prueba del menú comprueba apariencia/persistencia sin WebGL.

En jsdom se **simula la decodificación de imágenes con `TextureLoader`**: el resto del GLTFLoader carga el GLB real. Esto permite verificar asignación de mapas, pero no píxeles, shaders, cristales, sombras o fidelidad visual. Ninguna prueba unitaria se presenta como inspección visual.

## Revisión visual pendiente y controles

Ejecutar en un entorno con Vite y Chrome/Brave disponibles:

```sh
pnpm exec playwright test e2e/campus.spec.ts --grep 'Fase 3.3|Fase 3.2'
```

La suite 3.3 prepara oscuro/claro a **1440×900, 1920×1080 y 390×844**, con arrastre, rueda, retorno, Compras, cubierta oculta/restaurada y Almacén. Captura vista general y ambos departamentos (18 archivos esperados en `test-results/campus-0.3-*.png`). También verifica que el mismo canvas/GLB se conserve, la cámara general vuelva a su objetivo exacto y los contadores de programas/texturas no aumenten al alternar. Estos recorridos están preparados, **no ejecutados**.

Controles: menú Apariencia → Oscuro/Claro; arrastre izquierdo sobre canvas para desplazar; rueda para zoom al cursor; clic en edificio/etiqueta o buscador para enfoque; Escape/Control para vista general; Ver interior en Compras para cubierta. Se conservan gestos táctiles, alternativa del diagnóstico y controles de teclado.

Antes de aprobar visualmente, revisar cristal/interior en ambos modos, sombras y posible orden incorrecto de transparencia; comprobar contraste de etiquetas sobre suelos claros, panel abierto durante exploración y pequeños viewports. Medir renders/programas tras alternancias, FPS durante vuelos y coste del blur con GPU real. La siguiente iteración debe ajustar el perfil provisional con evidencia visual compartida con el productor, sin cambiar el encuadre aceptado ni iniciar modelado 0.4.0.
