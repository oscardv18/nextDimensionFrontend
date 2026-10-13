// Verifica la copia local sin depender de Blender, WebGL ni paquetes 3D.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const readJson = (path) =>
    JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const manifest = readJson(
    'src/features/campus/assets/company-world/0.2.0/manifest.json',
);
const build = readJson(
    'src/features/campus/assets/company-world/0.2.0/build.json',
);
const bytes = readFileSync(
    new URL(
        `public/assets/${manifest.assetId}/${manifest.assetVersion}/asset.glb`,
        root,
    ),
);
assert.equal(manifest.assetId, 'arxnet.scene.company-world');
assert.equal(manifest.assetVersion, '0.2.0');
assert.equal(manifest.contractVersion, '1.0.0');
assert.equal(build.assetId, manifest.assetId);
assert.equal(build.assetVersion, manifest.assetVersion);
assert.equal(bytes.length, build.metrics.bytes);
assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    build.metrics.sha256,
);
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(4), 2);
assert.equal(bytes.readUInt32LE(8), bytes.length);
assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
const gltf = JSON.parse(
    bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
);
const nodes = new Map(
    gltf.nodes.map((node, index) => [
        node.extras.arxnet_node_id,
        { ...node, index },
    ]),
);
assert.equal(nodes.size, manifest.nodes.length);
for (const entry of manifest.nodes) {
    const node = nodes.get(entry.id);
    assert.ok(node, entry.id);
    assert.equal(node.name, entry.name);
    assert.equal(node.extras.arxnet_role, entry.role);
    if (entry.parent)
        assert.ok(nodes.get(entry.parent).children.includes(node.index));
    else assert.ok(gltf.scenes[0].nodes.includes(node.index));
    if (['hit', 'visual'].includes(entry.role))
        assert.equal(typeof node.mesh, 'number');
}
assert.equal(nodes.get('root').extras.arxnet_asset_id, manifest.assetId);
assert.equal(
    nodes.get('root').extras.arxnet_contract_version,
    manifest.contractVersion,
);
assert.equal(manifest.interactions.length, 6);
for (const entry of manifest.interactions) {
    for (const [key, role] of [
        ['hitNodeId', 'hit'],
        ['focusNodeId', 'focus'],
        ['labelNodeId', 'label'],
    ]) {
        assert.equal(nodes.get(entry[key]).extras.arxnet_role, role);
    }
    assert.ok(manifest.departmentIds.includes(entry.departmentId));
}
assert.ok(nodes.get('procurement.roof'));
const provenance = readJson('docs/campus/provenance-company-world-d2.json');
for (const entry of provenance.files) {
    const copy = readFileSync(new URL(entry.copy, root));
    assert.equal(copy.length, entry.bytes);
    assert.equal(createHash('sha256').update(copy).digest('hex'), entry.sha256);
}
const themes = readJson(
    'src/features/campus/assets/company-world/0.2.0/themes.json',
);
assert.equal(themes.assetId, manifest.assetId);
assert.equal(themes.assetVersion, manifest.assetVersion);
assert.equal(themes.contractVersion, manifest.contractVersion);
assert.equal(themes.profileVersion, '1.0.0');
assert.deepEqual(themes.environmentNodeIds, manifest.environmentNodeIds);
assert.equal(gltf.materials.length, Object.keys(themes.materials).length);
assert.equal(gltf.images?.length ?? 0, Object.keys(themes.textures).length);
assert.equal((gltf.extensionsUsed ?? []).length, 0);
for (const material of gltf.materials) {
    const spec = themes.materials[material.name];
    assert.ok(spec, material.name);
    assert.ok(
        Math.abs(
            (material.pbrMetallicRoughness.roughnessFactor ?? 1) -
                spec.roughness,
        ) < 1e-6,
    );
    assert.ok(
        Math.abs(
            (material.pbrMetallicRoughness.metallicFactor ?? 1) -
                spec.metalness,
        ) < 1e-6,
    );
    if (material.alphaMode === 'BLEND') {
        assert.equal(material.doubleSided ?? false, false);
        assert.ok(
            Math.abs(
                material.pbrMetallicRoughness.baseColorFactor[3] -
                    (themes.themes.dark.materials[material.name]?.opacity ??
                        spec.opacity),
            ) < 1e-6,
        );
    }
}
for (const image of gltf.images ?? []) {
    assert.equal(image.mimeType, 'image/png');
    assert.equal(typeof image.bufferView, 'number');
    const view = gltf.bufferViews[image.bufferView];
    const binOffset = 20 + bytes.readUInt32LE(12) + 8;
    const png = bytes.subarray(
        binOffset + (view.byteOffset ?? 0),
        binOffset + (view.byteOffset ?? 0) + view.byteLength,
    );
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
}
for (const [name, theme] of Object.entries(themes.themes)) {
    assert.deepEqual(
        Object.keys(theme.materials).sort(),
        Object.keys(themes.themes.dark.materials).sort(),
    );
    for (const [id, patch] of Object.entries(theme.materials)) {
        for (const key of Object.keys(patch))
            assert.ok(
                themes.materials[id].themeKeys.includes(key),
                `${name}:${id}:${key}`,
            );
        assert.deepEqual(
            Object.keys(patch).sort(),
            Object.keys(themes.themes.dark.materials[id]).sort(),
        );
    }
    assert.equal(
        theme.lights.key.castShadow,
        themes.themes.dark.lights.key.castShadow,
    );
    assert.equal(theme.lights.fill.castShadow, false);
}
for (const light of themes.localLights) {
    assert.ok(nodes.has(light.parentNodeId));
    assert.equal(light.castShadow, false);
}
assert.equal(themes.localLights.length, 4);
for (const id of manifest.environmentNodeIds) assert.ok(nodes.has(id));
assert.equal(nodes.size, 246);
assert.equal(gltf.materials.length, 21);
assert.equal(Object.keys(manifest.revealLayers).length, 6);
for (const [owner, layers] of Object.entries(manifest.revealLayers)) {
    assert.ok(nodes.has(owner));
    for (const ids of Object.values(layers))
        for (const id of ids) {
            assert.ok(nodes.has(id), id);
            let parent = manifest.nodes.find((node) => node.id === id)?.parent;
            while (parent && parent !== owner)
                parent = manifest.nodes.find(
                    (node) => node.id === parent,
                )?.parent;
            assert.equal(parent, owner, `${id} must belong to ${owner}`);
        }
}
for (const ids of Object.values(manifest.zoneAnchors))
    for (const id of ids)
        assert.equal(nodes.get(id)?.extras.arxnet_role, 'label');
for (const id of [
    ...manifest.overviewFramingNodeIds,
    ...manifest.defaultHiddenNodeIds,
])
    assert.ok(nodes.has(id));
console.log(
    `Company World ${manifest.assetVersion}: SHA-256, ${nodes.size} nodos, seis departamentos/capas, ${gltf.materials.length} materiales y cuatro luces verificados.`,
);

// Los activos históricos no deben volver a entrar en dist por una copia residual de public.
for (const path of [
    'public/assets/arxnet.scene.campus-pilot',
    'public/assets/arxnet.scene.company-world/0.1.0',
])
    assert.equal(
        existsSync(new URL(path, root)),
        false,
        `Historical asset in production: ${path}`,
    );
