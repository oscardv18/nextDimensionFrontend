import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { useTranslation } from 'react-i18next';
import {
    constrainManualPose,
    navigationLimits,
    ManualNavigation,
} from './manual-navigation';
import type { ManualPose } from './manual-navigation';
import { CampusThemeRig } from './campus-theme-rig';
import type { ThemeName } from './campus-theme';
import { AdaptiveLabels } from './adaptive-labels';
import { annotationPosition } from './asset';
import type { Campus } from './asset';
import type { Insets } from './camera-framing';
import type { ScreenRect } from './use-overlay-insets';
import { recordCameraDiagnostic } from './camera-diagnostics';
import { advanceSpring, cameraPose, panelInsets } from './camera-framing';
import { CameraFlight } from './camera-flight';
import { requestShadowUpdate } from './shadow-cache';
import { applyRevealLayers, validateRevealLayers } from './reveal-layers';
import { campusGraphics } from './graphics-quality';

type Props = {
    theme: ThemeName;
    campus: Campus;
    selected: string | null;
    roofHidden: boolean;
    revision: number;
    reservePanel: boolean;
    insets: Insets;
    regions: ScreenRect[];
    debugOrbit: boolean;
    reducedMotion: boolean;
    onSelect: (id: string) => void;
    onSettled: (id: string | null, revision: number) => void;
    onMoving: (manual?: boolean) => void;
    onContextLost: () => void;
    /** Contenido de la etiqueta de cada departamento; por defecto, su nombre. */
    renderLabel?: (departmentId: string) => ReactNode;
    /** Marcadores adicionales anclados al centro superior de nodos reales del contrato. */
    annotations?: Annotation[];
};

export type Annotation = {
    id: string;
    active?: boolean;
    nodeId: string;
    content: ReactNode;
    label: string;
    onSelect: () => void;
};

// El lienzo pertenece a Three.js; el cursor se ajusta fuera del estado de React.
function setPointerCursor(canvas: HTMLCanvasElement, pointer: boolean) {
    canvas.style.cursor = pointer ? 'pointer' : '';
}

export default function CampusScene({
    campus,
    theme,
    selected,
    roofHidden,
    revision,
    reservePanel,
    insets,
    regions,
    debugOrbit,
    reducedMotion,
    onSelect,
    onSettled,
    onMoving,
    onContextLost,
    renderLabel,
    annotations = [],
}: Props) {
    const { t } = useTranslation();
    const { camera, size, gl, invalidate } = useThree();
    const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
    const motion = useRef({
        moving: true,
        manual: null as ManualPose | null,
        revision: -1,
        debugOrbit,
        initialized: false,
        frames: 0,
        positionVelocity: new Vector3(),
        targetVelocity: new Vector3(),
        flight: new CameraFlight(),
        manualTime: 0,
    });
    const limits = useMemo(() => {
        const limits = navigationLimits(campus.bounds);
        if (camera instanceof PerspectiveCamera) {
            const overview = cameraPose(
                campus,
                null,
                camera,
                size.width / size.height,
                size,
                insets,
            );
            limits.maxDistance = Math.max(
                limits.maxDistance,
                overview.position.distanceTo(overview.target) * 1.6,
            );
        }
        return limits;
    }, [campus, camera, size, insets]);
    const input = useRef<ManualNavigation | null>(null);
    const pose = useMemo(() => {
        if (!(camera instanceof PerspectiveCamera))
            throw new Error('Perspective camera required');
        const viewport = { width: size.width, height: size.height };
        return cameraPose(
            campus,
            selected,
            camera,
            size.width / size.height,
            viewport,
            panelInsets(viewport, reservePanel, {
                top: insets.top,
                right: insets.right,
                bottom: insets.bottom,
                left: insets.left,
            }),
        );
    }, [
        campus,
        selected,
        camera,
        size.width,
        size.height,
        reservePanel,
        insets.top,
        insets.right,
        insets.bottom,
        insets.left,
    ]);
    const labels = useMemo(
        () =>
            campus.departments.map((entry) => ({
                ...entry,
                position: entry.label.getWorldPosition(new Vector3()).toArray(),
                proxyPosition: new Box3()
                    .setFromObject(entry.hit)
                    .getCenter(new Vector3())
                    .toArray(),
            })),
        [campus],
    );

    /*
     * Las etiquetas se montan un ciclo después del lienzo. En desarrollo (StrictMode), <Html> de drei
     * desmonta su raíz mientras Fiber aún renderiza; el desmontaje diferido vaciaba la primera etiqueta
     * (Compras). Montadas fuera de ese primer render, la raíz se desmonta de forma síncrona.
     */
    const [labelsReady, setLabelsReady] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setLabelsReady(true));
        return () => cancelAnimationFrame(frame);
    }, []);
    const markers = useMemo(
        () =>
            annotations.flatMap((entry) => {
                const node = campus.nodes.get(entry.nodeId);
                if (!node) return [];
                const position = annotationPosition(node);
                return [{ ...entry, position: position.toArray() }];
            }),
        [annotations, campus],
    );
    const spatialEntries = useMemo(
        () => [
            ...labels.map((department) => ({
                id: department.departmentId,
                position: department.position as [number, number, number],
                proxyPosition:
                    selected === null
                        ? (department.proxyPosition as [number, number, number])
                        : undefined,
                label: t('cc.focusDepartment', {
                    name: t(`campus.${department.departmentId}`),
                }),
                content:
                    renderLabel?.(department.departmentId) ??
                    t(`campus.${department.departmentId}`),
                onSelect: () => onSelect(department.departmentId),
                selected: selected === department.departmentId,
                secondary:
                    selected !== null && selected !== department.departmentId,
                hovered: hovered === department.departmentId,
            })),
            ...markers.map((marker) => ({
                ...marker,
                position: marker.position as [number, number, number],
                selected: marker.active,
                annotation: true,
            })),
        ],
        [labels, markers, t, renderLabel, onSelect, selected, hovered],
    );
    useEffect(() => {
        const state = motion.current;
        const command =
            state.revision !== revision || state.debugOrbit !== debugOrbit;
        state.revision = revision;
        state.debugOrbit = debugOrbit;
        if (command || !state.manual) {
            input.current?.cancelAll();
            state.manual = null;
            state.moving = true;
            if (controls.current)
                state.flight.begin(
                    camera.position,
                    controls.current.target,
                    pose,
                    performance.now(),
                );
            state.positionVelocity.set(0, 0, 0);
            state.targetVelocity.set(0, 0, 0);
            onMoving();
        }
        invalidate();
    }, [
        pose,
        revision,
        debugOrbit,
        reducedMotion,
        invalidate,
        onMoving,
        camera,
    ]);
    useEffect(() => {
        if (debugOrbit || !(camera instanceof PerspectiveCamera)) return;
        const navigation = new ManualNavigation(
            gl.domElement,
            camera,
            campus.bounds,
            () => {
                const state = motion.current;
                if (
                    !state.initialized ||
                    !controls.current ||
                    camera.position.y < limits.minHeight + camera.near ||
                    camera.position.y <= controls.current.target.y + 1e-4
                )
                    return null;
                if (!state.manual) {
                    state.manualTime = performance.now();
                    state.manual = {
                        position: camera.position.clone(),
                        target: controls.current!.target.clone(),
                    };
                    state.positionVelocity.set(0, 0, 0);
                    state.targetVelocity.set(0, 0, 0);
                    onMoving(true);
                }
                return state.manual;
            },
            () => {
                if (!motion.current.moving)
                    motion.current.manualTime = performance.now();
                motion.current.moving = true;
                recordCameraDiagnostic(gl.domElement, 'manualSettled', 'false');
                invalidate();
            },
        );
        input.current = navigation;
        return () => {
            navigation.dispose();
            input.current = null;
        };
    }, [camera, campus, gl, debugOrbit, invalidate, onMoving, limits]);
    useEffect(() => {
        validateRevealLayers(campus);
        applyRevealLayers(campus, selected, roofHidden, campusGraphics.name);
        recordCameraDiagnostic(
            gl.domElement,
            'reveal',
            JSON.stringify({
                selected,
                interiorOpen: roofHidden,
                layers: Object.fromEntries(
                    Object.entries(campus.bundle.manifest.revealLayers).map(
                        ([id, layers]) => [
                            id,
                            Object.fromEntries(
                                Object.entries(layers).map(([layer, ids]) => [
                                    layer,
                                    ids.map(
                                        (nodeId) =>
                                            campus.nodes.get(nodeId)!.visible,
                                    ),
                                ]),
                            ),
                        ],
                    ),
                ),
            }),
        );
        requestShadowUpdate(gl);
        recordCameraDiagnostic(
            gl.domElement,
            'roofVisible',
            String(
                Object.entries(campus.bundle.manifest.revealLayers)
                    .filter(
                        ([owner]) =>
                            !selected ||
                            campus.departments.find(
                                (department) =>
                                    department.departmentId === selected,
                            )?.hit.parent === campus.nodes.get(owner),
                    )
                    .every(([, layers]) =>
                        layers.roof.every(
                            (id) => campus.nodes.get(id)!.visible,
                        ),
                    ),
            ),
        );
        invalidate();
    }, [campus, selected, roofHidden, gl, invalidate]);
    useEffect(
        () => setPointerCursor(gl.domElement, hovered !== null),
        [gl, hovered],
    );
    useEffect(() => {
        const canvas = gl.domElement;
        const lost = (event: Event) => {
            event.preventDefault();
            onContextLost();
        };
        canvas.addEventListener('webglcontextlost', lost);
        return () => canvas.removeEventListener('webglcontextlost', lost);
    }, [gl, onContextLost]);
    useFrame(() => {
        const state = motion.current;
        recordCameraDiagnostic(gl.domElement, 'frames', String(++state.frames));
        if (import.meta.env.DEV)
            recordCameraDiagnostic(
                gl.domElement,
                'cameraMoving',
                String(state.moving),
            );
        if (!controls.current || !state.moving) return;
        if (state.manual)
            constrainManualPose(state.manual, limits, camera.near);
        const goal = state.manual ?? pose;
        let flightDone = false;
        if (!state.initialized || reducedMotion) {
            camera.position.copy(goal.position);
            controls.current.target.copy(goal.target);
            state.positionVelocity.set(0, 0, 0);
            state.targetVelocity.set(0, 0, 0);
            state.initialized = true;
            flightDone = true;
        } else if (state.manual) {
            const now = performance.now();
            const delta = (now - state.manualTime) / 1000;
            state.manualTime = now;
            advanceSpring(
                camera.position,
                state.positionVelocity,
                goal.position,
                delta,
            );
            advanceSpring(
                controls.current.target,
                state.targetVelocity,
                goal.target,
                delta,
            );
        } else {
            flightDone = state.flight.sample(
                camera.position,
                controls.current.target,
                performance.now(),
            );
            if (import.meta.env.DEV)
                recordCameraDiagnostic(
                    gl.domElement,
                    'transition',
                    JSON.stringify({
                        durationMs: state.flight.durationMs,
                        elapsedMs: state.flight.elapsedMs,
                    }),
                );
        }
        if (
            state.manual &&
            constrainManualPose(
                { position: camera.position, target: controls.current.target },
                limits,
                camera.near,
            )
        ) {
            state.positionVelocity.set(0, 0, 0);
            state.targetVelocity.set(0, 0, 0);
        }
        controls.current.update();
        camera.updateMatrixWorld();
        if (
            (state.manual || flightDone) &&
            camera.position.distanceTo(goal.position) < 0.005 &&
            controls.current.target.distanceTo(goal.target) < 0.005 &&
            state.positionVelocity.length() < 0.03 &&
            state.targetVelocity.length() < 0.03
        ) {
            state.moving = false;
            if (import.meta.env.DEV)
                recordCameraDiagnostic(gl.domElement, 'cameraMoving', 'false');
            state.positionVelocity.set(0, 0, 0);
            state.targetVelocity.set(0, 0, 0);
            camera.position.copy(goal.position);
            controls.current.target.copy(goal.target);
            controls.current.update();
            camera.updateMatrixWorld();
            if (state.manual) {
                recordCameraDiagnostic(
                    gl.domElement,
                    'manualPose',
                    JSON.stringify({
                        position: camera.position.toArray(),
                        target: controls.current.target.toArray(),
                    }),
                );
                recordCameraDiagnostic(gl.domElement, 'manualSettled', 'true');
                return;
            }
            // Diagnóstico del encuadre real para pruebas y futura integración del Shell.
            const projected = pose.points.map((point) =>
                point.clone().project(camera),
            );
            recordCameraDiagnostic(
                gl.domElement,
                'fit',
                JSON.stringify({
                    area: pose.area,
                    minX: Math.min(...projected.map((p) => p.x)),
                    maxX: Math.max(...projected.map((p) => p.x)),
                    minY: Math.min(...projected.map((p) => p.y)),
                    maxY: Math.max(...projected.map((p) => p.y)),
                    minZ: Math.min(...projected.map((p) => p.z)),
                    maxZ: Math.max(...projected.map((p) => p.z)),
                    position: camera.position.toArray(),
                    target: controls.current.target.toArray(),
                    hits: campus.departments.map((entry) => ({
                        id: entry.departmentId,
                        point: new Box3()
                            .setFromObject(entry.hit)
                            .getCenter(new Vector3())
                            .project(camera)
                            .toArray(),
                    })),
                    calls: gl.info.render.calls,
                    triangles: gl.info.render.triangles,
                }),
            );
            onSettled(selected, revision);
        } else {
            recordCameraDiagnostic(gl.domElement, 'manualSettled', 'false');
            invalidate();
        }
    }, -2);
    const departmentOf = (event: ThreeEvent<PointerEvent | MouseEvent>) =>
        campus.departments.find(
            (entry) => entry.hitNodeId === event.object.userData.arxnet_node_id,
        )?.departmentId ?? null;
    // Respuesta al pasar sobre un edificio: resalta su etiqueta e indica que es seleccionable.
    const hover = (event: ThreeEvent<PointerEvent>) => {
        const id = departmentOf(event);
        if (!id) return;
        event.stopPropagation();
        setHovered(id);
    };
    const unhover = () => setHovered(null);
    const selectProxy = (event: ThreeEvent<MouseEvent>) => {
        if (event.delta > 6 || input.current?.isClickSuppressed()) return;
        const department = campus.departments.find(
            (entry) => entry.hitNodeId === event.object.userData.arxnet_node_id,
        );
        if (department) {
            event.stopPropagation();
            onSelect(department.departmentId);
        }
    };
    return (
        <>
            <CampusThemeRig
                campus={campus}
                theme={theme}
                reducedMotion={reducedMotion}
            />
            <primitive
                object={campus.scene}
                dispose={null}
                onClick={selectProxy}
                onPointerOver={hover}
                onPointerOut={unhover}
            />
            {labelsReady && (
                <AdaptiveLabels
                    regions={regions}
                    reducedMotion={reducedMotion}
                    entries={spatialEntries}
                />
            )}
            <OrbitControls
                ref={controls}
                makeDefault
                enabled={debugOrbit}
                enableDamping={false}
                minDistance={debugOrbit ? 5 : 0}
                maxDistance={debugOrbit ? 1000 : Infinity}
                maxPolarAngle={Math.PI / 2.05}
                onStart={() => {
                    motion.current.moving = false;
                    motion.current.positionVelocity.set(0, 0, 0);
                    motion.current.targetVelocity.set(0, 0, 0);
                    onMoving(true);
                }}
            />
        </>
    );
}
