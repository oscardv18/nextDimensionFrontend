/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { Box3, PerspectiveCamera, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareCampus, resolveCampus } from './asset';
import type { Campus } from './asset';
import { measureOverlayInsets } from './use-overlay-insets';
import {
    advanceSpring,
    boxCorners,
    cameraPose,
    fitCamera,
    panelInsets,
} from './camera-framing';

let campus: Campus;
beforeAll(async () => {
    const file = readFileSync(
        'public/assets/arxnet.scene.company-world/0.2.0/asset.glb',
    );
    const bytes = new ArrayBuffer(file.byteLength);
    new Uint8Array(bytes).set(file);
    campus = resolveCampus(
        (await new GLTFLoader().parseAsync(bytes, '')).scene,
    );
});
const viewports = [
    { width: 294, height: 380 },
    { width: 390, height: 500 },
    { width: 740, height: 380 },
    { width: 768, height: 500 },
    { width: 1280, height: 500 },
    { width: 1920, height: 850 },
];

function expectInside(
    camera: PerspectiveCamera,
    pose: ReturnType<typeof cameraPose>,
) {
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    for (const point of pose.points) {
        const ndc = point.clone().project(camera);
        expect(ndc.x).toBeGreaterThanOrEqual(pose.area.left - 1e-6);
        expect(ndc.x).toBeLessThanOrEqual(pose.area.right + 1e-6);
        expect(ndc.y).toBeGreaterThanOrEqual(pose.area.bottom - 1e-6);
        expect(ndc.y).toBeLessThanOrEqual(pose.area.top + 1e-6);
        expect(ndc.z).toBeGreaterThan(-1);
        expect(ndc.z).toBeLessThan(1);
    }
}

describe('encuadres con el GLB real', () => {
    for (const viewport of viewports) {
        for (const reserve of [false, true]) {
            it(`${viewport.width}×${viewport.height}, panel ${reserve}: campus y seis departamentos completos`, () => {
                const camera = new PerspectiveCamera(
                    20,
                    viewport.width / viewport.height,
                    0.5,
                    10000,
                );
                const insets = panelInsets(viewport, reserve);
                for (const id of [
                    null,
                    ...campus.departments.map((entry) => entry.departmentId),
                ]) {
                    const pose = cameraPose(
                        campus,
                        id,
                        camera,
                        camera.aspect,
                        viewport,
                        insets,
                    );
                    expectInside(camera, pose);
                    const focus = pose.focus.clone().project(camera);
                    expect(focus.x).toBeCloseTo(
                        (pose.area.left + pose.area.right) / 2,
                        6,
                    );
                    expect(focus.y).toBeCloseTo(
                        (pose.area.bottom + pose.area.top) / 2,
                        6,
                    );
                }
            });
        }
    }

    for (const viewport of [
        { width: 320, height: 568 },
        { width: 640, height: 320 },
        { width: 768, height: 1024 },
        { width: 1366, height: 657 },
        { width: 1920, height: 1080 },
        { width: 2560, height: 1080 },
    ]) {
        it(`viewport inmersivo ${viewport.width}×${viewport.height}: herramientas y panel sin recortes`, () => {
            const camera = new PerspectiveCamera(
                20,
                viewport.width / viewport.height,
                0.5,
                10000,
            );
            for (const diagnosticsOpen of [false, true]) {
                const height = diagnosticsOpen ? viewport.height * 0.45 : 44;
                const rect = (top: number, bottom: number) => ({
                    top,
                    bottom,
                    height: bottom - top,
                    left: 0,
                    right: viewport.width,
                    width: viewport.width,
                });
                const overlays = measureOverlayInsets(
                    rect(0, viewport.height),
                    [
                        { side: 'top', rect: rect(12, 48) },
                        {
                            side: 'bottom',
                            rect: rect(
                                viewport.height - 12 - height,
                                viewport.height - 12,
                            ),
                        },
                    ],
                );
                for (const reserve of [false, true]) {
                    const insets = panelInsets(viewport, reserve, overlays);
                    for (const id of [
                        null,
                        ...campus.departments.map(
                            (entry) => entry.departmentId,
                        ),
                    ]) {
                        expectInside(
                            camera,
                            cameraPose(
                                campus,
                                id,
                                camera,
                                camera.aspect,
                                viewport,
                                insets,
                            ),
                        );
                    }
                }
            }
        });
    }
    it('cada centro de proxy se puede seleccionar desde la cámara general', () => {
        prepareCampus(campus);
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        const overview = cameraPose(campus, null, camera);
        for (const entry of campus.departments) {
            const center = new Box3()
                .setFromObject(entry.hit)
                .getCenter(new Vector3());
            const ray = new Raycaster(
                overview.position,
                center.sub(overview.position).normalize(),
            );
            expect(
                ray.intersectObject(campus.scene, true)[0]?.object.userData
                    .arxnet_node_id,
            ).toBe(entry.hitNodeId);
        }
    });
    it('incluye el grupo completo de Compras y conserva encuadre al ocultar su cubierta', () => {
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        const department = campus.departments.find(
            (entry) => entry.departmentId === 'shared.procurement',
        )!;
        expect(
            department.bounds.containsBox(
                new Box3().setFromObject(department.hit),
            ),
        ).toBe(true);
        const visible = cameraPose(campus, department.departmentId, camera);
        campus.nodes.get('procurement.roof')!.visible = false;
        const hidden = cameraPose(campus, department.departmentId, camera);
        expect(hidden.position.toArray()).toEqual(visible.position.toArray());
        expect(hidden.target.toArray()).toEqual(visible.target.toArray());
        campus.nodes.get('procurement.roof')!.visible = true;
    });
    it('la vista general usa el espacio seguro sin el margen excesivo de una esfera', () => {
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        const pose = cameraPose(campus, null, camera);
        expectInside(camera, pose);
        const projected = pose.points.map((point) =>
            point.clone().project(camera),
        );
        const occupancy = Math.max(
            (Math.max(...projected.map((p) => p.x)) -
                Math.min(...projected.map((p) => p.x))) /
                (pose.area.right - pose.area.left),
            (Math.max(...projected.map((p) => p.y)) -
                Math.min(...projected.map((p) => p.y))) /
                (pose.area.top - pose.area.bottom),
        );
        expect(occupancy).toBeGreaterThan(0.85);
    });
    it('compone los siete encuadres con Shell responsive y recupera la vista general exacta', () => {
        const reports = [];
        for (const viewport of [
            { width: 320, height: 568 },
            { width: 390, height: 844 },
            { width: 640, height: 360 },
            { width: 768, height: 844 },
            { width: 1440, height: 900 },
            { width: 1920, height: 1080 },
        ]) {
            // Fixtures de huellas del Shell, no mediciones del navegador.
            const mobile = viewport.width < 760;
            const camera = new PerspectiveCamera(
                20,
                viewport.width / viewport.height,
                0.5,
                10000,
            );
            const base = {
                top: 64,
                left: mobile ? 0 : 70,
                right: 0,
                bottom: mobile ? Math.min(200, viewport.height * 0.4) : 90,
            };
            const start = cameraPose(
                campus,
                null,
                camera,
                camera.aspect,
                viewport,
                base,
            );
            for (const id of campus.departments.map(
                (entry) => entry.departmentId,
            )) {
                const panel = mobile
                    ? { ...base, bottom: Math.min(viewport.height * 0.5, 300) }
                    : { ...base, right: Math.min(440, viewport.width * 0.4) };
                expectInside(
                    camera,
                    cameraPose(
                        campus,
                        id,
                        camera,
                        camera.aspect,
                        viewport,
                        panel,
                    ),
                );
            }
            const returned = cameraPose(
                campus,
                null,
                camera,
                camera.aspect,
                viewport,
                base,
            );
            expect(returned.position.toArray()).toEqual(
                start.position.toArray(),
            );
            expect(returned.target.toArray()).toEqual(start.target.toArray());
            const old = cameraPose(
                campus,
                null,
                camera,
                camera.aspect,
                viewport,
                { ...base, top: base.top + 48 },
            );
            const extent = (pose: ReturnType<typeof cameraPose>) => {
                expectInside(camera, pose);
                const points = pose.points.map((point) =>
                    point.clone().project(camera),
                );
                return [
                    ((Math.max(...points.map((p) => p.x)) -
                        Math.min(...points.map((p) => p.x))) *
                        viewport.width) /
                        2,
                    ((Math.max(...points.map((p) => p.y)) -
                        Math.min(...points.map((p) => p.y))) *
                        viewport.height) /
                        2,
                ];
            };
            const before = extent(old);
            const after = extent(start);
            expect(
                after.every((value) => Number.isFinite(value) && value > 0),
            ).toBe(true);
            reports.push({
                viewport: `${viewport.width}×${viewport.height}`,
                insets: base,
                before: before.map(Math.round),
                after: after.map(Math.round),
            });
        }
        if (process.env.CAMPUS_REPORT)
            console.log(JSON.stringify(reports, null, 2));
    });
    it('las anclas de etiquetas no determinan el tamaño ni el centro de la vista general', () => {
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        const before = cameraPose(campus, null, camera);
        const positions = campus.departments.map((entry) =>
            entry.label.position.clone(),
        );
        try {
            campus.departments.forEach((entry) =>
                entry.label.position.add(new Vector3(500, 500, 500)),
            );
            campus.scene.updateMatrixWorld(true);
            const after = cameraPose(campus, null, camera);
            expect(after.position.toArray()).toEqual(before.position.toArray());
            expect(after.target.toArray()).toEqual(before.target.toArray());
        } finally {
            campus.departments.forEach((entry, index) =>
                entry.label.position.copy(positions[index]),
            );
            campus.scene.updateMatrixWorld(true);
        }
    });
    it('la reserva responde a medidas del Shell sin suponer un panel fijo', () => {
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        const viewport = { width: 1366, height: 768 };
        const pose = cameraPose(
            campus,
            'shared.sales',
            camera,
            camera.aspect,
            viewport,
            { top: 70, right: 360, bottom: 80, left: 120 },
        );
        expectInside(camera, pose);
    });
});

describe('transición interrumpible', () => {
    it('conserva velocidad al redirigir y converge al último departamento y a vista general', () => {
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        const start = cameraPose(campus, null, camera);
        const position = start.position.clone();
        const target = start.target.clone();
        const velocity = new Vector3();
        const targetVelocity = new Vector3();
        for (const id of [
            ...campus.departments.map((entry) => entry.departmentId),
            null,
        ]) {
            const pose = cameraPose(campus, id, camera);
            const before = position.clone();
            const beforeVelocity = velocity.clone();
            advanceSpring(position, velocity, pose.position, 0);
            expect(position.distanceTo(before)).toBeLessThan(1e-9);
            expect(velocity.distanceTo(beforeVelocity)).toBeLessThan(1e-9);
            for (let frame = 0; frame < 6; frame++) {
                advanceSpring(position, velocity, pose.position, 1 / 60);
                advanceSpring(target, targetVelocity, pose.target, 1 / 60);
                expect(position.toArray().every(Number.isFinite)).toBe(true);
                expect(position.y).toBeGreaterThan(campus.bounds.max.y);
            }
        }
        for (let frame = 0; frame < 150; frame++) {
            advanceSpring(position, velocity, start.position, 1 / 60);
            advanceSpring(target, targetVelocity, start.target, 1 / 60);
        }
        expect(position.distanceTo(start.position)).toBeLessThan(0.005);
        expect(target.distanceTo(start.target)).toBeLessThan(0.005);
        expect(velocity.length()).toBeLessThan(0.03);
    });
    it('es consistente a 2, 30, 60 y 120 FPS y converge tras una pausa', () => {
        for (const fps of [2, 30, 60, 120]) {
            const position = new Vector3(10, 20, 30);
            const velocity = new Vector3();
            const goal = new Vector3(50, 40, 70);
            for (let frame = 0; frame < fps; frame++)
                advanceSpring(position, velocity, goal, 1 / fps);
            expect(position.distanceTo(goal)).toBeLessThan(0.08);
        }
        const position = new Vector3();
        advanceSpring(position, new Vector3(), new Vector3(100, 100, 100), 5);
        expect(position.distanceTo(new Vector3(100, 100, 100))).toBeLessThan(
            1e-8,
        );
    });
    it('encuadra también escenas pequeñas respetando el plano cercano', () => {
        const camera = new PerspectiveCamera(45, 1, 0.1, 100);
        const points = boxCorners(
            new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)),
        );
        const pose = fitCamera(
            points,
            new Vector3(),
            new Vector3(-1, 1, 1),
            camera,
            1,
            { left: -0.8, right: 0.8, top: 0.8, bottom: -0.8 },
            1.05,
        );
        expectInside(camera, pose);
    });
});
