import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { addAfterEffect, useFrame, useThree } from '@react-three/fiber';
import { Mesh, Texture, InterleavedBufferAttribute } from 'three';
import type { WebGLRenderer, BufferAttribute } from 'three';
import type { Campus } from './asset';
import { campusGraphics } from './graphics-quality';

export class FrameSamples {
    private times: number[] = [];
    add(ms: number) {
        if (!Number.isFinite(ms) || ms <= 0) return;
        this.times.push(ms);
        if (this.times.length > 120) this.times.shift();
    }
    summary() {
        const sorted = [...this.times].sort((a, b) => a - b);
        const mean = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1);
        return {
            samples: sorted.length,
            fps: mean ? 1000 / mean : null,
            meanMs: mean || null,
            p50Ms: sorted[Math.floor(sorted.length * 0.5)] ?? null,
            p95Ms:
                sorted[
                    Math.min(
                        sorted.length - 1,
                        Math.ceil(sorted.length * 0.95) - 1,
                    )
                ] ?? null,
            maxMs: sorted.at(-1) ?? null,
        };
    }
    durations() {
        const { samples, meanMs, p50Ms, p95Ms, maxMs } = this.summary();
        return { samples, meanMs, p50Ms, p95Ms, maxMs };
    }
}

/** Estimación parcial de buffers y texturas RGBA8, nunca memoria GPU medida. */
export function resourceEstimate(campus: Campus) {
    const arrays = new Set<ArrayBufferLike>();
    const textures = new Set<Texture>();
    let visibleMeshes = 0,
        transparentMeshes = 0,
        casters = 0,
        receivers = 0;
    campus.scene.traverse((node) => {
        if (!(node instanceof Mesh) || node.userData.arxnet_role === 'hit')
            return;
        visibleMeshes++;
        if (node.castShadow) casters++;
        if (node.receiveShadow) receivers++;
        for (const attribute of Object.values(node.geometry.attributes) as (
            BufferAttribute | InterleavedBufferAttribute
        )[]) {
            const buffer =
                attribute instanceof InterleavedBufferAttribute
                    ? attribute.data.array.buffer
                    : attribute.array.buffer;
            arrays.add(buffer);
        }
        if (node.geometry.index) arrays.add(node.geometry.index.array.buffer);
        const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
        if (materials.some((m) => m.transparent)) transparentMeshes++;
        for (const material of materials)
            for (const value of Object.values(material))
                if (value instanceof Texture) textures.add(value);
    });
    let textureRgba8EstimateBytes = 0;
    for (const texture of textures) {
        const image = texture.image as
            { width?: number; height?: number } | undefined;
        if (image?.width && image.height)
            textureRgba8EstimateBytes += Math.ceil(
                image.width *
                    image.height *
                    4 *
                    (texture.generateMipmaps ? 4 / 3 : 1),
            );
    }
    return {
        visualMeshInventory: visibleMeshes,
        transparentMeshes,
        casters,
        receivers,
        bufferBackingEstimateBytes: [...arrays].reduce(
            (sum, buffer) => sum + buffer.byteLength,
            0,
        ),
        textureRgba8EstimateBytes,
        note: 'Partial estimate: excludes PMREM, framebuffer, shadows, driver overhead and compression.',
    };
}

function mountProbe(
    gl: WebGLRenderer,
    campus: Campus,
    invalidate: () => void,
    loadTiming: { totalMs: number; fetchMs: number; parseMs: number },
) {
    let probingUntil = 0,
        previous = 0,
        began = 0,
        published = 0,
        shadowMs = 0;
    let shadowCalls = 0,
        shadowTriangles = 0,
        shadowPasses = 0;
    let renderPending = false;
    let frames = new FrameSamples(),
        cpu = new FrameSamples(),
        shadows = new FrameSamples();
    const estimate = resourceEstimate(campus);
    const originalRender = gl.shadowMap.render;
    const measuredShadow: typeof originalRender = (...args) => {
        if (
            !gl.shadowMap.enabled ||
            (!gl.shadowMap.autoUpdate && !gl.shadowMap.needsUpdate)
        ) {
            shadowMs = 0;
            shadowCalls = 0;
            shadowTriangles = 0;
            return originalRender.apply(gl.shadowMap, args);
        }
        const start = performance.now();
        const beforeCalls = gl.info.render.calls,
            beforeTriangles = gl.info.render.triangles;
        originalRender.apply(gl.shadowMap, args);
        shadowMs = performance.now() - start;
        shadowCalls = gl.info.render.calls - beforeCalls;
        shadowTriangles = gl.info.render.triangles - beforeTriangles;
        shadowPasses++;
    };
    gl.shadowMap.render = measuredShadow;
    const context = gl.getContext(),
        debug = context.getExtension('WEBGL_debug_renderer_info');
    const renderer = debug
        ? (context.getParameter(debug.UNMASKED_RENDERER_WEBGL) as string)
        : 'Unavailable';
    const benchmark = () => {
        frames = new FrameSamples();
        cpu = new FrameSamples();
        shadows = new FrameSamples();
        previous = 0;
        shadowPasses = 0;
        probingUntil = performance.now() + 5000;
        gl.domElement.dataset.benchmarkState = 'running';
        invalidate();
    };
    window.addEventListener('campus:benchmark', benchmark);
    const after = addAfterEffect(() => {
        // Fiber también ejecuta efectos globales al terminar el loop: no contar ese RAF sin render.
        if (!renderPending) return;
        renderPending = false;
        const now = performance.now();
        const active =
            probingUntil > now ||
            gl.domElement.dataset.themeSettled === 'false' ||
            gl.domElement.dataset.cameraMoving === 'true';
        const previousActive = gl.domElement.dataset.probing === 'true';
        if (previousActive && previous) frames.add(now - previous);
        previous = now;
        cpu.add(now - began);
        if (shadowMs > 0) shadows.add(shadowMs);
        gl.domElement.dataset.probing = String(active);
        if (probingUntil && now >= probingUntil)
            gl.domElement.dataset.benchmarkState = 'complete';
        if (now - published >= 500 || (probingUntil && now >= probingUntil)) {
            gl.domElement.dataset.performanceProbe = JSON.stringify({
                assetId: campus.bundle.manifest.assetId,
                assetVersion: campus.bundle.manifest.assetVersion,
                detail: JSON.parse(gl.domElement.dataset.detail ?? 'null'),
                measured: {
                    frame: frames.summary(),
                    renderCpuWall: cpu.durations(),
                    shadowCpuWall: shadows.durations(),
                    calls: gl.info.render.calls,
                    triangles: gl.info.render.triangles,
                    geometries: gl.info.memory.geometries,
                    textures: gl.info.memory.textures,
                    programs: gl.info.programs?.length,
                    shadowPasses,
                    shadowCalls,
                    shadowTriangles,
                    canvas: {
                        width: gl.domElement.width,
                        height: gl.domElement.height,
                        pixelRatio: gl.getPixelRatio(),
                    },
                    loadTiming,
                },
                estimated: estimate,
                unavailable: [
                    'GPU milliseconds',
                    'GPU resident bytes',
                    'isolated transparency milliseconds',
                    'CSS compositor/blur milliseconds',
                ],
                renderer,
                quality: campusGraphics,
                postprocessing: { enabled: false, passes: 0 },
            });
            published = now;
        }
        if (probingUntil > now) invalidate();
        else probingUntil = 0;
    });
    return {
        beforeFrame: () => {
            began = performance.now();
            renderPending = true;
        },
        dispose: () => {
            after();
            window.removeEventListener('campus:benchmark', benchmark);
            if (gl.shadowMap.render === measuredShadow)
                gl.shadowMap.render = originalRender;
        },
    };
}

export function PerformanceProbe({
    campus,
    loadTimingRef,
}: {
    campus: Campus;
    loadTimingRef: RefObject<{
        totalMs: number;
        fetchMs: number;
        parseMs: number;
    }>;
}) {
    const { gl, invalidate } = useThree();
    const probe = useRef<ReturnType<typeof mountProbe> | null>(null);
    useEffect(() => {
        const mounted = mountProbe(
            gl,
            campus,
            invalidate,
            loadTimingRef.current,
        );
        probe.current = mounted;
        return () => {
            mounted.dispose();
            probe.current = null;
        };
    }, [gl, campus, invalidate, loadTimingRef]);
    useFrame(() => probe.current?.beforeFrame(), -1000);
    return null;
}
