import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PMREMGenerator, PCFShadowMap, PCFSoftShadowMap, Mesh } from 'three';
import type { Scene, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Campus } from './asset';
import { CampusTheme } from './campus-theme';
import type { ThemeName } from './campus-theme';
import { recordCameraDiagnostic } from './camera-diagnostics';
import { architectureFogRange } from './fog-safety';
import { campusGraphics } from './graphics-quality';
import { requestShadowUpdate, cacheShadowMaps } from './shadow-cache';

function mountTheme(
    campus: Campus,
    scene: Scene,
    gl: WebGLRenderer,
    theme: ThemeName,
) {
    const lighting = new CampusTheme(campus, scene, gl, theme, campusGraphics);
    const generator = new PMREMGenerator(gl),
        room = new RoomEnvironment();
    let environment;
    try {
        environment = generator.fromScene(room, 0.04);
    } catch (error) {
        lighting.dispose();
        throw error;
    } finally {
        generator.dispose();
        room.dispose();
    }
    const previous = scene.environment;
    const previousShadows = {
        autoUpdate: gl.shadowMap.autoUpdate,
        enabled: gl.shadowMap.enabled,
        type: gl.shadowMap.type,
    };
    const releaseCache = cacheShadowMaps(gl);
    gl.shadowMap.enabled = campusGraphics.shadows;
    gl.shadowMap.type = campusGraphics.softShadows
        ? PCFSoftShadowMap
        : PCFShadowMap;
    gl.shadowMap.needsUpdate = true;
    const changed: { node: Mesh; visible: boolean }[] = [];
    campus.scene.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
        if (
            !campusGraphics.transparency &&
            materials.some((m) => m.transparent)
        ) {
            changed.push({
                node,
                visible: node.visible,
            });
            node.visible = false;
        }
    });
    scene.environment = environment.texture;
    return {
        lighting,
        dispose: () => {
            lighting.dispose();
            releaseCache();
            Object.assign(gl.shadowMap, previousShadows);
            changed.forEach(({ node, visible }) =>
                Object.assign(node, { visible }),
            );
            if (scene.environment === environment.texture)
                scene.environment = previous;
            environment.dispose();
        },
    };
}

export function CampusThemeRig({
    campus,
    theme,
    reducedMotion,
}: {
    campus: Campus;
    theme: ThemeName;
    reducedMotion: boolean;
}) {
    const { scene, gl, camera, invalidate } = useThree();
    const rig = useRef<CampusTheme | null>(null);
    const initial = useRef(theme);
    const frames = useRef(0);
    const previousTime = useRef(0);
    useEffect(() => {
        const mounted = mountTheme(campus, scene, gl, initial.current);
        rig.current = mounted.lighting;
        frames.current = 0;
        invalidate();
        return () => {
            mounted.dispose();
            rig.current = null;
        };
    }, [campus, scene, gl, invalidate]);
    useEffect(() => {
        rig.current?.applyTheme(theme, reducedMotion);
        previousTime.current = performance.now();
        invalidate();
    }, [theme, reducedMotion, invalidate]);
    useFrame(() => {
        frames.current++;
        const now = performance.now();
        const moving =
            rig.current?.step((now - previousTime.current) / 1000) ?? false;
        previousTime.current = now;
        if (rig.current?.key.shadow.needsUpdate) requestShadowUpdate(gl);
        recordCameraDiagnostic(gl.domElement, 'theme', theme);
        recordCameraDiagnostic(gl.domElement, 'themeSettled', String(!moving));
        // gl.info refleja el render anterior: un segundo fotograma permite medir el GLB ya compilado.
        recordCameraDiagnostic(
            gl.domElement,
            'performanceReady',
            String(frames.current > 1),
        );
        if (!moving && import.meta.env.DEV)
            recordCameraDiagnostic(
                gl.domElement,
                'performance',
                JSON.stringify({
                    calls: gl.info.render.calls,
                    triangles: gl.info.render.triangles,
                    programs: gl.info.programs?.length,
                    textures: gl.info.memory.textures,
                    geometries: gl.info.memory.geometries,
                    exposure: gl.toneMappingExposure,
                    bloom: false,
                    localLights: rig.current?.locals.length ?? 0,
                }),
            );
        if (moving || frames.current === 1) invalidate();
    }, -3);
    // Después del controlador existente de cámara; no depende de su posición del fotograma anterior.
    useFrame(() => {
        if (!rig.current) return;
        const base = rig.current.fogRange;
        const range = architectureFogRange(
            campus.overviewPoints,
            camera,
            base.near,
            base.far,
        );
        rig.current.fog.near = range.near;
        rig.current.fog.far = range.far;
        if (import.meta.env.DEV)
            recordCameraDiagnostic(
                gl.domElement,
                'fogOffset',
                String(range.offset),
            );
    }, -0.5);
    return null;
}
