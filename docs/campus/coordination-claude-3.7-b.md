# Fase 3.7-B — Coordinación propuesta con Claude / arxnet-3d

Estado: pendiente de propuesta artística y aprobación. Este documento es una solicitud técnica, **no una modificación del contrato, GLB o manifiesto**. No se ha enviado ningún mensaje externo. Evidencia y evaluación de costes en [diagnóstico web](visual-unity-3.7-b.md).

Actualización tras aprobación condicionada: se leyó `arxnet-3d/docs/visual-unity.md` y se prepararon variantes comparables de desarrollo. [Implementación, matriz de compatibilidad y pendientes](calibracion-renderer-3.7-b.md). La candidata no se integra; intensidad absoluta/relativa sigue pendiente de acuerdo explícito.

## Base que debe conservarse

Activo 0.4.0, contrato 1.0.0, perfil 1.0.0 provisional, seis departamentos y 99 identidades anteriores compatibles. Un GLB para ambos temas; carga única, materiales compartidos y adaptador `CampusTheme`. Los enfoques aprobados, escala, anclas, proxies, labels, navegación, cubierta y Shell están fuera de esta intervención.

Oscuro debe contrastar exterior grafito e interiores cálidos, con acento moderado. Claro necesita referencia aprobada propia: no existe un mockup diurno equivalente. Blender y web deben usar cámara y dimensiones reales existentes al comparar, sin prometer paridad Eevee/WebGL.

## Qué puede ajustarse sin nuevos materiales o GLB

| Responsable        | Parámetros existentes                                                                                      | Condición para implementar                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Productor + web    | `background`, `fog.color/near/far`, `exposure`, `environmentIntensity`                                     | Acuerdo visual y actualización coordinada de copias si cambian valores del perfil     |
| Productor + web    | `lights.hemisphere`, intensidad/color/dirección de key y fill, `localLightIntensityScale`                  | Conservar cantidad/tipo de luces entre modos; revisar volumen y luz interior          |
| Productor + web    | `localLights`: colores, intensidad, posición, alcance, decay                                               | No inventar posiciones; mantener referencias locales al padre real y acordar unidades |
| Web con aprobación | Intensidad individual efectiva de entorno en vidrio, cache/ajustes de sombra por calidad                   | Verificar semántica de Three y shader; no duplicar PMREM o escena                     |
| Productor + web    | Opacidad del vidrio, emisiones autorizadas, color de `mat_ground_surround`, parámetros declarados de bloom | Respetar `themeKeys`; bloom aún no está implementado                                  |

Los valores del manifiesto no se sobrescribirán mediante presets web escondidos. El tipo de tone mapping, mapas, `side`, transparencia, defines y cantidad/tipo de luces permanecen fijos durante cambios de apariencia. Un experimento con otro tone mapping es una decisión de perfil común, no un cambio por tema.

### Resolver primero la semántica del reflejo

Actualmente se propone vidrio `envMapIntensity=1,0/1,4` y ambiente global `0,2/0,7`. Three 0.180 usa la intensidad global si el material no tiene `envMap` explícito. Confirmar si los valores de vidrio son **absolutos** o **multiplicadores** del ambiente. Si son multiplicadores, las intensidades efectivas serían 0,2/0,98; si son absolutas serían 1,0/1,4. Ninguna de esas decisiones se debe inferir silenciosamente.

Propuesta web tras acuerdo: reutilizar el mismo PMREM como mapa explícito del vidrio y escribir intensidad efectiva, creada/configurada al montar. Comprobar rotación, interpolación, programas y limpieza; otros materiales siguen con entorno de escena. No aprobar la corrección solo porque un test observe la propiedad `material.envMapIntensity`.

## Qué requiere propuesta de materiales o activos nuevos

| Necesidad                                            | Solicitud para Claude                                                                                                             | Límite del consumidor actual                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Pavimento/piedra/madera con respuesta menos uniforme | Revisar escalas reales de patrón y proponer mapas de rugosidad/normal/AO donde aporten lectura; especificar UV y espacio de color | 0.4.0 solo contiene texturas de color base; no fabricar mapas ni aumentar geometría aquí              |
| Vidrio arquitectónico                                | Definir aproximación alfa aceptable y, opcionalmente, variante física con IOR/transmission/thickness/absorción y presupuesto      | GLB actual sin extensiones; PhysicalMaterial implica coste y nueva compatibilidad de exportación      |
| Contactos en interiores                              | Comparar AO horneada frente a AO web, manteniendo luces cálidas y vidrio legible                                                  | AO no ilumina; sombras interiores dinámicas masivas no son alternativa segura                         |
| Vegetación menos dominante                           | Revisar color/roughness y lenguaje geométrico con referencia artística                                                            | Sus colores son compartidos; no autorizados para recoloreado por tema                                 |
| Señales especulares exteriores                       | Proponer entorno de referencia exterior suave con procedencia/licencia y orientación reproducible                                 | `RoomEnvironment` actual es genérico; un HDR externo sería otro activo, aunque no requiera editar GLB |
| Bordes y reflejos arquitectónicos                    | Evaluar normales/biseles cuando sean necesarios para lectura                                                                      | Posprocesado no puede crear detalle geométrico ausente                                                |

No se solicita modelar otros departamentos ni editar el GLB 0.4.0 en sitio. Cualquier activo futuro requiere versión, integridad, compatibilidad y reversión coordinadas.

## Parámetros que necesitan acuerdo o ampliación del manifiesto

Los conceptos de esta tabla son **campos propuestos**, no IDs o claves existentes. Antes de implementarlos, el productor decide nombres, unidades, valores por tema, permisos y versión del esquema; el frontend añade validación y pruebas. No copiar un perfil futuro encima de los manifiestos actuales sin coordinar identidad e integridad.

| Concepto solicitado          | Datos necesarios                                                                                                                                            | Motivo                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Entorno                      | Fuente/preset, hash/licencia si externo, resolución por calidad, rotación en radianes, intensidad global y semántica de override/multiplicador por material | Reflejos consistentes y costo controlable                                     |
| Vidrio                       | Estrategia alfa/física fija al montar; parámetros autorizados, espesor/unidades, absorción e interiores que deben seguir visibles                           | Evitar traducciones arbitrarias Eevee → WebGL                                 |
| Rugosidad o color adaptables | `themeKeys` explícitas por material, rangos y mismas claves en oscuro/claro                                                                                 | El validador actual rechaza patches no autorizados                            |
| Acento semántico             | Relación entre emisor real y rol de marca; colores azul/púrpura/rojo por tono; permiso para color/emissive donde corresponda                                | `mat_emissive_blue` hoy solo admite intensidad; preservar colores funcionales |
| Emisión y luces cálidas      | Intensidad, RGB o temperatura con conversión especificada; mínimos diurnos deseados, roles y alcance                                                        | Evitar suelos uniformemente luminosos y asegurar lectura interior             |
| Selección para bloom         | Mallas/materiales emisores elegibles, prioridades, posibles grupos mixtos; límites de intensidad/umbral/radio por calidad                                   | Umbral luminoso no garantiza selección de bordes/luminarias                   |
| AO opcional                  | Intensidad, radio en unidades definidas, resolución/muestras por calidad, política sobre transparentes                                                      | Contacto de opacos sin ennegrecer cristal                                     |
| Calidad y presupuesto        | Efectos admitidos y fallback por perfil; targets medidos de frame, resolución y recursos                                                                    | Baja debe tener identidad propia sin efectos caros                            |

Mantener todas las rutas de tema sobre uniformes cuando sea posible. Texturas nuevas deben declarar sRGB para color y espacio de datos para normal/rugosidad/AO. No introducir un almacén paralelo de apariencia ni clonar materiales cada vez que cambia el selector.

## Ajustes exclusivamente del Shell

Superficies CSS, blur/saturación, halo de texto, viñeta, contraste y tokens de etiquetas pertenecen al frontend. Se auditan junto al campus, pero **no se modifican en esta fase**. Posición de etiquetas y composición/cámara tampoco se cambian. Los acentos azul/púrpura/rojo ya preparados se conectarán únicamente tras aprobación funcional y semántica.

Compartir intención de fondo, acento, estado y tono; no obligar al color físico de piedra, madera o metal a coincidir con CSS. Probar paneles y tarjetas sobre arquitectura clara/oscura antes de cambiar opacidades; no resolver legibilidad escondiendo el campus.

## Entrega esperada y orden de aceptación

1. Claude entrega diagnóstico de materiales/geometría y propuesta artística con imágenes de evaluación, identificando qué parte necesita activo nuevo y qué parte son valores del perfil. Sus imágenes Blender no se presentan como validación web.
2. Acordar los parámetros anteriores, especialmente semántica de entorno, vidrio y acento; preservar invariantes y versionar cualquier ampliación.
3. Obtener aprobación para implementación web. Calibrar primero la base de iluminación/materiales sin efectos, con cámaras actuales y matriz de ambos temas/perfiles.
4. Evaluar AO/bloom solo si resuelven una diferencia demostrada. No instalar una librería antes de justificar funciones, coste, demanda de render y mantenimiento frente a alternativas existentes.
5. Capturas actuales general/Compras/Almacén, cubierta, panel y exploración; métricas GPU real y software separadas, percentiles y estabilidad de programas/texturas. Aprobación visual de oscuro frente al mockup y de claro frente a su nueva referencia.

No se prometen cifras de FPS o memoria GPU: las mediciones web actuales de 0.4.0 siguen pendientes. Las pruebas unitarias y de integridad no sustituyen esa aprobación.
