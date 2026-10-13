import type { Campus } from './asset';
import type { QualityName } from './graphics-quality';
import type { Object3D } from 'three';

/** Aplica las capas contractuales de Company World sin mover geometría ni modificar sus cajas de enfoque. */
export function applyRevealLayers(
    campus: Campus,
    selected: string | null,
    interiorOpen: boolean,
    quality: QualityName,
) {
    const { revealLayers, visibilityStates } = campus.bundle.manifest;
    if (!revealLayers || !visibilityStates)
        throw new Error('Missing reveal layers or visibility states');
    let changed = false;
    for (const [owner, layers] of Object.entries(revealLayers)) {
        const department = campus.departments.find(
            (entry) => entry.hit.parent === campus.nodes.get(owner),
        );
        const own = department?.departmentId === selected;
        const state = selected
            ? own
                ? visibilityStates.focused.selected
                : visibilityStates.focused.others
            : visibilityStates.overview;
        for (const [layer, ids] of Object.entries(layers)) {
            let visible = state[layer as keyof typeof state];
            if (own && (layer === 'roof' || layer === 'facadeFront'))
                visible = !interiorOpen;
            // Baja conserva interior del seleccionado; los vecinos cerrados no necesitan mostrar mobiliario.
            if (quality === 'low' && !own && layer === 'interior')
                visible = visibilityStates.lowQuality.interior;
            for (const id of ids) {
                const node = campus.nodes.get(id);
                if (!node) throw new Error(`Missing reveal node: ${id}`);
                if (node.visible !== visible) {
                    node.visible = visible;
                    changed = true;
                }
            }
        }
    }
    return changed;
}

export function validateRevealLayers(campus: Campus) {
    const { revealLayers, visibilityStates } = campus.bundle.manifest;
    if (!revealLayers) throw new Error('Missing reveal layers');
    if (!visibilityStates) throw new Error('Missing visibility states');
    for (const [owner, layers] of Object.entries(revealLayers)) {
        const root = campus.nodes.get(owner);
        if (
            !root ||
            !campus.departments.some((entry) => entry.hit.parent === root)
        )
            throw new Error(`Invalid reveal owner: ${owner}`);
        for (const [layer, ids] of Object.entries(layers)) {
            if (
                typeof visibilityStates.overview[
                    layer as keyof typeof visibilityStates.overview
                ] !== 'boolean'
            )
                throw new Error(`Invalid reveal layer: ${layer}`);
            for (const id of ids) {
                const node = campus.nodes.get(id);
                if (!node || node === root)
                    throw new Error(`Invalid reveal node: ${id}`);
                let parent: Object3D | null = node.parent;
                while (parent && parent !== root) parent = parent.parent;
                if (!parent) throw new Error(`Foreign reveal node: ${id}`);
            }
        }
    }
}
