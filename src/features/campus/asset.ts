import { Box3, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three';
import type { Material, Object3D } from 'three';
import { activeAsset } from './asset-bundle';
import type { AssetBundle } from './asset-bundle';

const { manifest, build } = activeAsset;

export { manifest, build };
export const assetUrl = `${import.meta.env.BASE_URL}assets/${manifest.assetId}/${manifest.assetVersion}/asset.glb`;

// El contrato identifica por extras; los nombres y padres sirven como comprobación secundaria.
export function resolveCampus(
    scene: Object3D,
    bundle: AssetBundle = activeAsset,
) {
    const { manifest } = bundle;
    const detailIds: string[] = manifest.detailNodeIds ?? [];
    const nodes = new Map<string, Object3D>();
    scene.traverse((node) => {
        const id = node.userData.arxnet_node_id;
        if (typeof id === 'string') {
            if (nodes.has(id)) throw new Error(`Duplicate node: ${id}`);
            nodes.set(id, node);
        }
    });
    if (nodes.size !== manifest.nodes.length)
        throw new Error('Node inventory mismatch');
    for (const entry of manifest.nodes) {
        const node = nodes.get(entry.id);
        if (
            !node ||
            node.name !== entry.name ||
            node.userData.arxnet_role !== entry.role ||
            (entry.parent !== null &&
                node.parent !== nodes.get(entry.parent)) ||
            (['visual', 'hit'].includes(entry.role) && !(node instanceof Mesh))
        ) {
            throw new Error(`Invalid contract node: ${entry.id}`);
        }
    }
    const root = nodes.get('root')!;
    for (const id of detailIds)
        if (nodes.get(id)?.userData.arxnet_role !== 'group')
            throw new Error(`Invalid detail group: ${id}`);
    if (
        root.userData.arxnet_asset_id !== manifest.assetId ||
        root.userData.arxnet_contract_version !== manifest.contractVersion
    ) {
        throw new Error('Asset identity mismatch');
    }
    scene.updateMatrixWorld(true);
    const bounds = new Box3();
    const overviewPoints: Vector3[] = [];
    for (const id of manifest.overviewFramingNodeIds) {
        const node = nodes.get(id);
        if (!node) throw new Error(`Missing framing node: ${id}`);
        const box = new Box3().setFromObject(node);
        bounds.union(box);
        for (const x of [box.min.x, box.max.x])
            for (const y of [box.min.y, box.max.y])
                for (const z of [box.min.z, box.max.z])
                    overviewPoints.push(new Vector3(x, y, z));
    }
    return {
        scene,
        bundle,
        nodes,
        bounds,
        overviewPoints,
        departments: manifest.interactions.map((entry) => ({
            ...entry,
            hit: nodes.get(entry.hitNodeId)! as Mesh,
            focus: nodes.get(entry.focusNodeId)!,
            label: nodes.get(entry.labelNodeId)!,
            bounds: new Box3().setFromObject(nodes.get(entry.hitNodeId)!),
        })),
    };
}
export type Campus = ReturnType<typeof resolveCampus>;

/** Las zonas nuevas son anclas vacías: su posición procede del nodo, no de una caja sin geometría. */
export function annotationPosition(node: Object3D) {
    if (node.userData.arxnet_role === 'label')
        return node.getWorldPosition(new Vector3());
    const box = new Box3().setFromObject(node);
    if (box.isEmpty()) return node.getWorldPosition(new Vector3());
    const position = box.getCenter(new Vector3());
    position.y = box.max.y;
    return position;
}

export { cameraPose } from './camera-framing';

export function prepareCampus(campus: Campus) {
    const themes = campus.bundle.themes;
    const originals = new Set<Material>();
    const shared = new Map<Material, Material>();
    campus.scene.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        const hit = node.userData.arxnet_role === 'hit';
        const adapt = (original: Material) => {
            originals.add(original);
            // Un clon por material compartido; proxies separados para no ocultar el material visual.
            let material = hit ? undefined : shared.get(original);
            if (!material) {
                material = original.clone();
                if (!hit) shared.set(original, material);
                if (material instanceof MeshStandardMaterial) {
                    const spec =
                        themes.materials[
                            material.name as keyof typeof themes.materials
                        ];
                    if (spec?.emissive !== undefined)
                        material.emissive.set(spec.emissive);
                    if (spec?.envMapIntensity !== undefined)
                        material.envMapIntensity = spec.envMapIntensity;
                }
            }
            if (hit) {
                material.visible = false;
                material.colorWrite = false;
                material.depthWrite = false;
            } else if (material.transparent) {
                material.depthWrite = false;
                node.renderOrder = 1;
            }
            return material;
        };
        node.material = Array.isArray(node.material)
            ? node.material.map(adapt)
            : adapt(node.material);
        const transparent = (
            Array.isArray(node.material) ? node.material : [node.material]
        ).some((m) => m.transparent);
        node.castShadow =
            !hit &&
            !transparent &&
            !campus.bundle.manifest.environmentNodeIds.includes(
                node.userData.arxnet_node_id,
            );
        node.receiveShadow = !hit && !transparent;
        if (!hit) node.raycast = () => {};
    });
    originals.forEach((material) => material.dispose());
    for (const id of campus.bundle.manifest.defaultHiddenNodeIds ?? []) {
        const node = campus.nodes.get(id);
        if (!node) throw new Error(`Missing hidden node: ${id}`);
        node.visible = false;
    }
}

export function disposeCampus(campus: Campus) {
    const materials = new Set<Material>();
    const textures = new Set<Texture>();
    const geometries = new Set<Mesh['geometry']>();
    campus.scene.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        geometries.add(node.geometry);
        for (const material of Array.isArray(node.material)
            ? node.material
            : [node.material]) {
            materials.add(material);
            for (const value of Object.values(material))
                if (value instanceof Texture) textures.add(value);
        }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => {
        texture.dispose();
        if (
            typeof ImageBitmap !== 'undefined' &&
            texture.image instanceof ImageBitmap
        )
            texture.image.close();
    });
}

export async function verifyAsset(
    bytes: ArrayBuffer,
    bundle: AssetBundle = activeAsset,
) {
    const { build } = bundle;
    if (bytes.byteLength !== build.metrics.bytes)
        throw new Error('Asset size mismatch');
    if (!globalThis.crypto?.subtle)
        throw new Error('SHA-256 requires a secure context');
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, '0'),
    ).join('');
    if (hash !== build.metrics.sha256)
        throw new Error('Asset SHA-256 mismatch');
}
