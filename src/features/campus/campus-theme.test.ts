/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Mesh, MeshStandardMaterial, Scene, SRGBColorSpace } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { manifest, prepareCampus, resolveCampus, disposeCampus } from './asset';
import {
    CampusTheme,
    themeManifest,
    validateThemeManifest,
} from './campus-theme';
async function load() {
    const file = readFileSync(
        'public/assets/arxnet.scene.company-world/0.2.0/asset.glb',
    );
    const bytes = new ArrayBuffer(file.byteLength);
    new Uint8Array(bytes).set(file);
    const campus = resolveCampus(
        (await new GLTFLoader().parseAsync(bytes, '')).scene,
    );
    prepareCampus(campus);
    return campus;
}
describe('compatibilidad y temas PBR Company World 0.2.0', () => {
    it('conserva sombras cacheadas con dirección constante en ambos temas y permite calidad baja', async () => {
        const campus = await load();
        const { graphicsOptions } = await import('./graphics-quality');
        const rig = new CampusTheme(
            campus,
            new Scene(),
            { toneMappingExposure: 1 },
            'dark',
            graphicsOptions('?quality=low', true),
        );
        expect(rig.key.shadow.mapSize.x).toBe(512);
        rig.key.shadow.needsUpdate = false;
        expect(rig.step(0.5)).toBe(false);
        expect(rig.key.shadow.needsUpdate).toBe(false);
        rig.applyTheme('light', false);
        rig.step(0.16);
        expect(rig.key.shadow.needsUpdate).toBe(false);
        rig.key.shadow.needsUpdate = false;
        rig.step(0.16);
        expect(rig.key.shadow.needsUpdate).toBe(false);
        rig.key.shadow.needsUpdate = false;
        rig.step(10);
        expect(rig.key.shadow.needsUpdate).toBe(false);
        expect(rig.locals).toHaveLength(4);
        expect(rig.locals.every((light) => !light.castShadow)).toBe(true);
        rig.dispose();
        disposeCampus(campus);
    });
    it('valida las 246 identidades y seis interacciones con el perfil externo', () => {
        expect(manifest.nodes).toHaveLength(246);
        expect(manifest.interactions).toHaveLength(6);
        expect(() => validateThemeManifest()).not.toThrow();
        expect(themeManifest.environmentNodeIds).toEqual(
            manifest.environmentNodeIds,
        );
    });
    it('excluye terreno, mobiliario y entorno de los límites navegables', async () => {
        const campus = await load();
        const before = campus.bounds.clone();
        campus.nodes.get('site.context')!.scale.multiplyScalar(10);
        campus.scene.updateMatrixWorld(true);
        expect(resolveCampus(campus.scene).bounds.equals(before)).toBe(true);
        disposeCampus(campus);
    });
    it('cambia uniforms sin crear materiales, luces o modificar programas de material', async () => {
        const campus = await load(),
            scene = new Scene(),
            renderer = { toneMappingExposure: 1 };
        const rig = new CampusTheme(campus, scene, renderer, 'dark');
        const materials = [...rig.materials.values()].flat();
        const invariants = materials.map((m) => ({
            uuid: m.uuid,
            version: m.version,
            map: m.map,
            side: m.side,
            transparent: m.transparent,
        }));
        const count = scene.children.length,
            locals = rig.locals.map((l) => l.uuid);
        for (let i = 0; i < 8; i++) {
            rig.applyTheme('light', true);
            rig.applyTheme('dark', true);
        }
        expect(
            materials.map((m) => ({
                uuid: m.uuid,
                version: m.version,
                map: m.map,
                side: m.side,
                transparent: m.transparent,
            })),
        ).toEqual(invariants);
        expect(scene.children.length).toBe(count);
        expect(rig.locals.map((l) => l.uuid)).toEqual(locals);
        expect(renderer.toneMappingExposure).toBe(1);
        expect(rig.background.getHexString()).toBe(
            themeManifest.themes.dark.background.slice(1),
        );
        expect(rig.locals).toHaveLength(4);
        rig.dispose();
        disposeCampus(campus);
    });
    it('aplica iluminación, niebla y exposición del manifiesto sin duplicar emisión', async () => {
        const campus = await load(),
            scene = new Scene(),
            renderer = { toneMappingExposure: 1 };
        const rig = new CampusTheme(campus, scene, renderer, 'dark');
        for (const name of ['light', 'dark'] as const) {
            rig.applyTheme(name, true);
            const profile = themeManifest.themes[name];
            expect(rig.key.intensity).toBe(profile.lights.key.intensity);
            expect(renderer.toneMappingExposure).toBe(profile.exposure);
            expect(rig.fog.far).toBe(profile.fog.far);
            expect(scene.environmentIntensity).toBe(
                profile.environmentIntensity,
            );
            for (const [id, patch] of Object.entries(profile.materials)) {
                for (const material of rig.materials.get(id)!) {
                    if (patch.opacity !== undefined)
                        expect(material.opacity).toBe(patch.opacity);
                    if (patch.emissiveIntensity !== undefined)
                        expect(material.emissiveIntensity).toBe(
                            patch.emissiveIntensity,
                        );
                }
            }
        }
        rig.dispose();
        disposeCampus(campus);
    });
    it('interrumpe una transición desde sus uniforms actuales y respeta movimiento reducido', async () => {
        const campus = await load(),
            scene = new Scene(),
            renderer = { toneMappingExposure: 1 };
        const rig = new CampusTheme(campus, scene, renderer, 'dark');
        rig.applyTheme('light', false);
        expect(rig.step(0.16)).toBe(true);
        expect(rig.key.intensity).toBeCloseTo(
            (themeManifest.themes.dark.lights.key.intensity +
                themeManifest.themes.light.lights.key.intensity) /
                2,
        );
        const interrupted = rig.key.intensity;
        rig.applyTheme('dark', false);
        rig.step(0);
        expect(rig.key.intensity).toBe(interrupted);
        expect(rig.step(0.32)).toBe(false);
        expect(rig.key.intensity).toBe(
            themeManifest.themes.dark.lights.key.intensity,
        );
        rig.applyTheme('light', true);
        expect(rig.step(0)).toBe(false);
        expect(rig.key.intensity).toBe(
            themeManifest.themes.light.lights.key.intensity,
        );
        rig.dispose();
        expect(scene.children).toHaveLength(0);
        expect(rig.locals.every((l) => l.parent === null)).toBe(true);
        disposeCampus(campus);
    });
    it('conserva PBR sin texturas externas, vidrio de una cara y sombras solo en opacos', async () => {
        const campus = await load();
        let mapped = 0;
        const maps = new Set();
        campus.scene.traverse((node) => {
            if (!(node instanceof Mesh)) return;
            for (const material of Array.isArray(node.material)
                ? node.material
                : [node.material]) {
                expect(material).toBeInstanceOf(MeshStandardMaterial);
                const pbr = material as MeshStandardMaterial;
                if (pbr.map) {
                    mapped++;
                    maps.add(pbr.map);
                    expect(pbr.map.colorSpace).toBe(SRGBColorSpace);
                }
                if (material.transparent) {
                    expect(node.castShadow).toBe(false);
                    expect(material.depthWrite).toBe(false);
                    expect(material.side).toBe(0);
                }
            }
        });
        expect(mapped).toBe(0);
        expect(maps.size).toBe(0);
        expect((campus.nodes.get('site.ground') as Mesh).receiveShadow).toBe(
            true,
        );
        expect((campus.nodes.get('site.ground') as Mesh).castShadow).toBe(
            false,
        );
        disposeCampus(campus);
    });
});
