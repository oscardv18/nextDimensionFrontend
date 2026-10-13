/// <reference types="node" />
// Pruebas de consumo del GLB real: no se sustituyen los nodos por fixtures inventadas.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
    Box3,
    FrontSide,
    Mesh,
    PerspectiveCamera,
    Raycaster,
    Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    cameraPose,
    manifest,
    prepareCampus,
    resolveCampus,
    verifyAsset,
} from './asset';

beforeAll(() => {
    vi.stubGlobal('crypto', webcrypto);
});

async function load() {
    const file = readFileSync(
        'public/assets/arxnet.scene.company-world/0.2.0/asset.glb',
    );
    const bytes = new ArrayBuffer(file.byteLength);
    new Uint8Array(bytes).set(file);
    const gltf = await new GLTFLoader().parseAsync(bytes, '');
    return { bytes, campus: resolveCampus(gltf.scene) };
}

describe('Company World GLB v0.2.0', () => {
    it('verifica el hash del binario y rechaza una copia alterada', async () => {
        const { bytes } = await load();
        await expect(verifyAsset(bytes)).resolves.toBeUndefined();
        new Uint8Array(bytes)[bytes.byteLength - 1] ^= 1;
        await expect(verifyAsset(bytes)).rejects.toThrow('SHA-256');
    });
    it('resuelve todos los IDs, focos mundiales y proxies seleccionables', async () => {
        const { campus } = await load();
        prepareCampus(campus);
        expect(campus.nodes.size).toBe(manifest.nodes.length);
        const camera = new PerspectiveCamera(20, 16 / 9, 0.5, 10000);
        for (const department of campus.departments) {
            const pose = cameraPose(campus, department.departmentId, camera);
            expect(pose.target.toArray()).toEqual(
                department.focus.getWorldPosition(new Vector3()).toArray(),
            );
            const center = new Box3()
                .setFromObject(department.hit)
                .getCenter(new Vector3());
            const ray = new Raycaster(
                pose.position,
                center.sub(pose.position).normalize(),
            );
            const hits = ray.intersectObject(campus.scene, true);
            expect(hits[0]?.object.userData.arxnet_node_id).toBe(
                department.hitNodeId,
            );
            expect(pose.position.distanceTo(pose.target)).toBeGreaterThan(10);
        }
    });
    it('mantiene cristal BLEND de una cara y proxies sin color ni profundidad', async () => {
        const { campus } = await load();
        prepareCampus(campus);
        let glassCount = 0;
        campus.scene.traverse((node) => {
            if (!(node instanceof Mesh)) return;
            for (const material of Array.isArray(node.material)
                ? node.material
                : [node.material]) {
                if (material.transparent) {
                    glassCount++;
                    expect(material.depthWrite).toBe(false);
                    expect(material.side).toBe(FrontSide);
                    expect(material.opacity).toBeGreaterThan(0);
                    expect(material.opacity).toBeLessThan(1);
                }
                if (node.userData.arxnet_role === 'hit') {
                    expect(material.visible).toBe(false);
                    expect(material.colorWrite).toBe(false);
                    expect(material.depthWrite).toBe(false);
                }
            }
        });
        expect(glassCount).toBeGreaterThan(6);
        campus.nodes.get('procurement.roof')!.visible = false;
        expect(campus.nodes.get('procurement.roof')?.visible).toBe(false);
        campus.nodes.get('procurement.roof')!.visible = true;
        expect(campus.nodes.get('procurement.roof')!.visible).toBe(true);
    });
    it('rechaza una identidad contractual alterada', async () => {
        const { campus } = await load();
        campus.nodes.get('procurement.focus')!.userData.arxnet_node_id =
            'unknown';
        expect(() => resolveCampus(campus.scene)).toThrow(
            'Invalid contract node',
        );
    });
});
