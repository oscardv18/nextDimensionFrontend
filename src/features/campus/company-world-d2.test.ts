/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Mesh, PerspectiveCamera, Raycaster, Scene, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { activeAsset, worldFov } from './asset-bundle';
import type { AssetBundle } from './asset-bundle';
import {
    annotationPosition,
    disposeCampus,
    prepareCampus,
    resolveCampus,
} from './asset';
import { CampusTheme, validateThemeManifest } from './campus-theme';
import { applyRevealLayers, validateRevealLayers } from './reveal-layers';
import { cameraPose, panelInsets } from './camera-framing';
import framing from '../../../docs/campus/company-world-framing-c2.json';
import { architectureFogRange } from './fog-safety';

async function load(bundle: AssetBundle) {
    const file = readFileSync(
        `public/assets/${bundle.manifest.assetId}/${bundle.manifest.assetVersion}/asset.glb`,
    );
    const bytes = new ArrayBuffer(file.byteLength);
    new Uint8Array(bytes).set(file);
    const campus = resolveCampus(
        (await new GLTFLoader().parseAsync(bytes, '')).scene,
        bundle,
    );
    prepareCampus(campus);
    return campus;
}

describe('Company World D.2', () => {
    it('carga Company World 0.2.0 directamente y limita FOV experimental al desarrollo', () => {
        expect(activeAsset.manifest.assetId).toBe('arxnet.scene.company-world');
        expect(activeAsset.manifest.assetVersion).toBe('0.2.0');
        expect(worldFov('', true)).toBe(20);
        expect(worldFov('?world=campus-pilot&v=0.1.0&fov=15', true)).toBe(15);
        expect(worldFov('?fov=15', false)).toBe(20);
        expect(worldFov('?fov=99', true)).toBe(20);
    });
    it('rechaza metadatos de otra versión y capas pertenecientes a otro departamento', async () => {
        const foreign = {
            ...activeAsset,
            themes: { ...activeAsset.themes, assetVersion: '0.1.0' },
        };
        expect(() => validateThemeManifest(foreign)).toThrow();
        const campus = await load(activeAsset);
        const bundle = campus.bundle;
        campus.bundle = {
            ...bundle,
            manifest: {
                ...bundle.manifest,
                revealLayers: {
                    ...bundle.manifest.revealLayers,
                    procurement: {
                        ...bundle.manifest.revealLayers.procurement,
                        roof: ['warehouse.roof'],
                    },
                },
            },
        };
        expect(() => validateRevealLayers(campus)).toThrow(
            'Foreign reveal node',
        );
        campus.bundle = bundle;
        disposeCampus(campus);
    });
    it('valida identidades, jerarquías y metadata; acepta 21 materiales y nueve anclas', async () => {
        const campus = await load(activeAsset);
        expect(campus.nodes.size).toBe(246);
        expect(() => validateThemeManifest(activeAsset)).not.toThrow();
        expect(() => validateRevealLayers(campus)).not.toThrow();
        for (const ids of Object.values(activeAsset.manifest.zoneAnchors!))
            for (const id of ids) {
                const node = campus.nodes.get(id)!;
                expect(node.userData.arxnet_role).toBe('label');
                expect(
                    annotationPosition(node).toArray().every(Number.isFinite),
                ).toBe(true);
                expect(
                    annotationPosition(node).equals(
                        node.getWorldPosition(new Vector3()),
                    ),
                ).toBe(true);
            }
        disposeCampus(campus);
    });
    it('conserva los 42 encuadres aprobados C.2 en escritorio y móvil, FOV 20 y 15', async () => {
        const campus = await load(activeAsset);
        for (const entry of framing.results) {
            const size = entry.viewport;
            const selected =
                entry.selected === 'overview' ? null : entry.selected;
            const camera = new PerspectiveCamera(
                entry.fov,
                size.width / size.height,
                0.5,
                10000,
            );
            const insets = panelInsets(size, selected !== null, {
                top: 64,
                left: size.width < 760 ? 0 : 70,
                bottom: 90,
                right: 0,
            });
            const pose = cameraPose(
                campus,
                selected,
                camera,
                camera.aspect,
                size,
                insets,
            );
            expect(pose.position.distanceTo(pose.target)).toBeCloseTo(
                entry.distance,
                6,
            );
            camera.position.copy(pose.position);
            camera.lookAt(pose.target);
            camera.updateMatrixWorld(true);
            const projected = pose.points.map((point) =>
                point.clone().project(camera),
            );
            expect(Math.min(...projected.map((point) => point.x))).toBeCloseTo(
                entry.screenBounds.left,
                6,
            );
            expect(Math.max(...projected.map((point) => point.x))).toBeCloseTo(
                entry.screenBounds.right,
                6,
            );
            expect(Math.max(...projected.map((point) => point.y))).toBeCloseTo(
                entry.screenBounds.top,
                6,
            );
            expect(Math.min(...projected.map((point) => point.y))).toBeCloseTo(
                entry.screenBounds.bottom,
                6,
            );
        }
        expect(framing.results).toHaveLength(42);
        disposeCampus(campus);
    });
    it('mantiene selección por proxies aunque exista mobiliario y restaura luminarias con cubiertas', async () => {
        const campus = await load(activeAsset);
        const transforms = [...campus.nodes.values()].map((node) =>
            node.matrixWorld.toArray(),
        );
        for (const department of campus.departments) {
            const center = department.bounds.getCenter(new Vector3());
            const ray = new Raycaster(
                center.clone().add(new Vector3(0, 100, 0)),
                new Vector3(0, -1, 0),
            );
            const hits = ray.intersectObject(campus.scene, true);
            expect(hits.length).toBeGreaterThan(0);
            expect(
                hits.every((hit) => hit.object.userData.arxnet_role === 'hit'),
            ).toBe(true);
        }
        for (const quality of ['high', 'balanced', 'low'] as const) {
            for (const selected of ['shared.procurement', 'shared.warehouse']) {
                applyRevealLayers(campus, selected, true, quality);
                const owner = selected.replace('shared.', '');
                expect(campus.nodes.get(`${owner}.roof-fixtures`)!.parent).toBe(
                    campus.nodes.get(`${owner}.roof`),
                );
                expect(campus.nodes.get(`${owner}.roof`)!.visible).toBe(false);
                expect(campus.nodes.get(`${owner}.interior`)!.visible).toBe(
                    true,
                );
                applyRevealLayers(campus, selected, false, quality);
                expect(campus.nodes.get(`${owner}.roof`)!.visible).toBe(true);
                applyRevealLayers(campus, null, false, quality);
                expect(campus.nodes.get(`${owner}.facade-front`)!.visible).toBe(
                    true,
                );
            }
        }
        campus.scene.updateMatrixWorld(true);
        expect(
            [...campus.nodes.values()].map((node) =>
                node.matrixWorld.toArray(),
            ),
        ).toEqual(transforms);
        disposeCampus(campus);
    });
    it('conserva albedos arquitectónicos y monta cuatro luces reales sin sombras ni recompilación por tema', async () => {
        const campus = await load(activeAsset);
        const rig = new CampusTheme(
            campus,
            new Scene(),
            { toneMappingExposure: 1 },
            'dark',
        );
        expect(rig.materials.size).toBe(21);
        expect(rig.locals).toHaveLength(4);
        const architecture = [...rig.materials]
            .filter(
                ([name]) => !['mat_ad_ground', 'mat_ad_context'].includes(name),
            )
            .flatMap(([, values]) => values);
        const initial = architecture.map((material) => ({
            uuid: material.uuid,
            version: material.version,
            color: material.color.toArray(),
        }));
        rig.locals.forEach((light, i) => {
            const spec = activeAsset.themes.localLights[i];
            expect(light.parent).toBe(campus.nodes.get(spec.parentNodeId));
            expect(light.position.toArray()).toEqual(spec.position);
            expect(light.castShadow).toBe(false);
            expect(light.distance).toBeLessThanOrEqual(10);
        });
        rig.applyTheme('light', false);
        rig.step(0.32);
        rig.locals.forEach((light, i) =>
            expect(light.intensity).toBeCloseTo(
                activeAsset.themes.localLights[i].intensity * 0.35,
            ),
        );
        expect(
            architecture.map((material) => ({
                uuid: material.uuid,
                version: material.version,
                color: material.color.toArray(),
            })),
        ).toEqual(initial);
        rig.applyTheme('dark', true);
        expect(rig.locals[0].intensity).toBe(71.6);
        expect(rig.materials.get('mat_ad_fixture')![0].emissiveIntensity).toBe(
            1.6,
        );
        rig.dispose();
        expect(rig.locals.every((light) => light.parent === null)).toBe(true);
        disposeCampus(campus);
    });
    it('demuestra el problema de niebla móvil y conserva el intervalo sin tocar cámaras ni el perfil', async () => {
        const campus = await load(activeAsset);
        for (const theme of ['dark', 'light'] as const) {
            const base = activeAsset.themes.themes[theme].fog;
            const mobile = { width: 390, height: 844 };
            const camera = new PerspectiveCamera(
                15,
                mobile.width / mobile.height,
                0.5,
                10000,
            );
            const pose = cameraPose(
                campus,
                null,
                camera,
                camera.aspect,
                mobile,
            );
            camera.position.copy(pose.position);
            camera.lookAt(pose.target);
            camera.updateMatrixWorld(true);
            const direction = camera.getWorldDirection(new Vector3());
            const depths = campus.overviewPoints.map((point) =>
                point.clone().sub(camera.position).dot(direction),
            );
            expect(Math.min(...depths)).toBeGreaterThan(base.far);
            const safe = architectureFogRange(
                campus.overviewPoints,
                camera,
                base.near,
                base.far,
            );
            expect(safe.near).toBeGreaterThan(Math.max(...depths));
            expect(safe.far - safe.near).toBeCloseTo(base.far - base.near);
            expect(camera.position.equals(pose.position)).toBe(true);
            const desktop = new PerspectiveCamera(20, 1440 / 900, 0.5, 10000);
            const overview = cameraPose(campus, null, desktop, desktop.aspect, {
                width: 1440,
                height: 900,
            });
            desktop.position.copy(overview.position);
            desktop.lookAt(overview.target);
            desktop.updateMatrixWorld(true);
            expect(
                architectureFogRange(
                    campus.overviewPoints,
                    desktop,
                    base.near,
                    base.far,
                ).offset,
            ).toBe(0);
        }
        disposeCampus(campus);
    });
    it('registra primitivas/triángulos estáticos del mundo activo sin presentarlos como draw calls medidos', async () => {
        const reports: object[] = [];
        for (const bundle of [activeAsset]) {
            const campus = await load(bundle);
            for (const quality of ['high', 'balanced', 'low'] as const)
                for (const [view, selected, open] of [
                    ['overview', null, false],
                    ['procurement-closed', 'shared.procurement', false],
                    ['procurement-open', 'shared.procurement', true],
                    ['warehouse-closed', 'shared.warehouse', false],
                    ['warehouse-open', 'shared.warehouse', true],
                ] as const) {
                    applyRevealLayers(campus, selected, open, quality);
                    let primitives = 0,
                        triangles = 0;
                    campus.scene.traverseVisible((node) => {
                        if (
                            !(node instanceof Mesh) ||
                            node.userData.arxnet_role !== 'visual'
                        )
                            return;
                        primitives++;
                        triangles +=
                            (node.geometry.index?.count ??
                                node.geometry.attributes.position.count) / 3;
                    });
                    reports.push({
                        version: bundle.manifest.assetVersion,
                        quality,
                        view,
                        primitives,
                        triangles,
                    });
                }
            disposeCampus(campus);
        }
        expect(reports).toHaveLength(15);
    });
});
