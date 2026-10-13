import {
    Color,
    DirectionalLight,
    Fog,
    Group,
    HemisphereLight,
    Mesh,
    MeshStandardMaterial,
    PointLight,
    Vector3,
} from 'three';
import type { Scene, WebGLRenderer } from 'three';
import type { Campus } from './asset';
import { activeAsset } from './asset-bundle';
import type { AssetBundle } from './asset-bundle';
const { themes: profile } = activeAsset;
type ThemeProfile = AssetBundle['themes'];
import { graphicsOptions } from './graphics-quality';
import type { GraphicsOptions } from './graphics-quality';
export type ThemeName = keyof typeof profile.themes;
export { profile as themeManifest };

type Patch = {
    color?: string;
    opacity?: number;
    envMapIntensity?: number;
    emissiveIntensity?: number;
};
type Values = {
    background: Color;
    fogColor: Color;
    fogNear: number;
    fogFar: number;
    exposure: number;
    environment: number;
    sky: Color;
    ground: Color;
    ambient: number;
    keyColor: Color;
    keyIntensity: number;
    keyPosition: Vector3;
    shadowIntensity: number;
    fillColor: Color;
    fillIntensity: number;
    fillPosition: Vector3;
    localScale: number;
    materials: Record<
        string,
        {
            color?: Color;
            opacity?: number;
            envMapIntensity?: number;
            emissiveIntensity?: number;
        }
    >;
};
export function validateThemeManifest(bundle: AssetBundle = activeAsset) {
    const { themes: profile, manifest } = bundle;
    if (
        profile.assetId !== manifest.assetId ||
        profile.assetVersion !== manifest.assetVersion ||
        profile.contractVersion !== manifest.contractVersion ||
        profile.profileVersion !== '1.0.0'
    )
        throw new Error('Theme identity mismatch');
    if (
        JSON.stringify(profile.environmentNodeIds) !==
        JSON.stringify(manifest.environmentNodeIds)
    )
        throw new Error('Theme environment mismatch');
    const catalog = profile.materials as Record<
        string,
        { themeKeys?: string[] }
    >;
    for (const name of ['dark', 'light'] as const) {
        const patches = profile.themes[name].materials as Record<string, Patch>;
        for (const [id, patch] of Object.entries(patches)) {
            if (
                !catalog[id] ||
                Object.keys(patch).some(
                    (key) => !catalog[id].themeKeys?.includes(key),
                )
            )
                throw new Error(`Unsupported theme material: ${id}`);
            if (
                Object.values(patch).some(
                    (value) =>
                        typeof value === 'number' && !Number.isFinite(value),
                )
            )
                throw new Error('Non-finite theme parameter');
        }
    }
    for (const entry of profile.localLights)
        if (!manifest.nodes.some((node) => node.id === entry.parentNodeId))
            throw new Error(`Missing light parent: ${entry.parentNodeId}`);
}
function themeValues(
    name: ThemeName,
    center: Vector3,
    profile: ThemeProfile,
): Values {
    const p = profile.themes[name];
    const materials: Values['materials'] = {};
    for (const [id, patch] of Object.entries(
        p.materials as Record<string, Patch>,
    ))
        materials[id] = {
            ...patch,
            ...(patch.color
                ? { color: new Color(patch.color) }
                : { color: undefined }),
        };
    return {
        background: new Color(p.background),
        fogColor: new Color(p.fog.color),
        fogNear: p.fog.near,
        fogFar: p.fog.far,
        exposure: p.exposure,
        environment: p.environmentIntensity,
        sky: new Color(p.lights.hemisphere.skyColor),
        ground: new Color(p.lights.hemisphere.groundColor),
        ambient: p.lights.hemisphere.intensity,
        keyColor: new Color(p.lights.key.color),
        keyIntensity: p.lights.key.intensity,
        keyPosition: center
            .clone()
            .add(
                new Vector3(...p.lights.key.direction)
                    .normalize()
                    .multiplyScalar(p.lights.key.distance),
            ),
        shadowIntensity: p.lights.key.shadow.intensity,
        fillColor: new Color(p.lights.fill.color),
        fillIntensity: p.lights.fill.intensity,
        fillPosition: center
            .clone()
            .add(
                new Vector3(...p.lights.fill.direction)
                    .normalize()
                    .multiplyScalar(p.lights.key.distance),
            ),
        localScale: p.localLightIntensityScale,
        materials,
    };
}
export class CampusTheme {
    get fogRange() {
        return { near: this.current.fogNear, far: this.current.fogFar };
    }
    readonly rig = new Group();
    readonly hemisphere = new HemisphereLight();
    readonly key = new DirectionalLight();
    readonly fill = new DirectionalLight();
    readonly locals: PointLight[] = [];
    readonly materials = new Map<string, MeshStandardMaterial[]>();
    readonly background = new Color();
    readonly fog = new Fog(0);
    private center: Vector3;
    private current: Values;
    private start: Values;
    private destination: Values;
    private elapsed = 0;
    private active = false;
    private destinationName: ThemeName;
    private scene: Scene;
    private renderer: Pick<WebGLRenderer, 'toneMappingExposure'>;
    private previousBackground: Scene['background'];
    private previousFog: Scene['fog'];
    private previousEnvironmentIntensity: number;
    private quality: GraphicsOptions;
    private profile: ThemeProfile;
    constructor(
        campus: Campus,
        scene: Scene,
        renderer: Pick<WebGLRenderer, 'toneMappingExposure'>,
        initial: ThemeName,
        quality: GraphicsOptions = graphicsOptions('', false),
    ) {
        validateThemeManifest(campus.bundle);
        const profile = campus.bundle.themes;
        this.profile = profile;
        this.quality = quality;
        this.destinationName = initial;
        this.scene = scene;
        this.renderer = renderer;
        this.previousBackground = scene.background;
        this.previousFog = scene.fog;
        this.previousEnvironmentIntensity = scene.environmentIntensity;
        this.center = campus.bounds.getCenter(new Vector3());
        this.current = themeValues(initial, this.center, profile);
        this.start = this.current;
        this.destination = this.current;
        const shadow = profile.themes.dark.lights.key.shadow;
        this.key.castShadow = true;
        this.key.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
        Object.assign(this.key.shadow.camera, {
            left: -shadow.cameraHalfExtent,
            right: shadow.cameraHalfExtent,
            top: shadow.cameraHalfExtent,
            bottom: -shadow.cameraHalfExtent,
            near: shadow.near,
            far: shadow.far,
        });
        this.key.shadow.camera.updateProjectionMatrix();
        this.key.shadow.bias = shadow.bias;
        this.key.shadow.normalBias = shadow.normalBias;
        this.key.target.position.copy(this.center);
        this.fill.target.position.copy(this.center);
        campus.scene.traverse((node) => {
            if (!(node instanceof Mesh) || node.userData.arxnet_role === 'hit')
                return;
            for (const material of Array.isArray(node.material)
                ? node.material
                : [node.material]) {
                if (!(material instanceof MeshStandardMaterial)) continue;
                const entries = this.materials.get(material.name) ?? [];
                if (!entries.includes(material)) entries.push(material);
                this.materials.set(material.name, entries);
            }
        });
        for (const id of Object.keys(profile.materials))
            if (!this.materials.has(id))
                throw new Error(`Missing PBR material: ${id}`);
        this.rig.add(
            this.hemisphere,
            this.key,
            this.fill,
            this.key.target,
            this.fill.target,
        );
        scene.add(this.rig);
        scene.background = this.background;
        scene.fog = this.fog;
        for (const spec of profile.localLights) {
            const light = new PointLight(
                spec.color,
                0,
                spec.distance,
                spec.decay,
            );
            light.name = spec.id;
            light.position.set(...(spec.position as [number, number, number]));
            campus.nodes.get(spec.parentNodeId)!.add(light);
            this.locals.push(light);
        }
        this.write(this.current);
    }
    applyTheme(name: ThemeName, reducedMotion: boolean) {
        if (name === this.destinationName && !this.active) return;
        this.destinationName = name;
        this.start = this.current;
        this.destination = themeValues(name, this.center, this.profile);
        this.elapsed = 0;
        this.active = !reducedMotion;
        if (reducedMotion) {
            this.current = this.destination;
            this.write(this.current);
        }
    }
    /** Devuelve si quedan fotogramas de transición; no modifica estado React. */
    step(delta: number) {
        if (!this.active) return false;
        this.elapsed += Math.max(0, delta) * 1000;
        const t = Math.min(
            1,
            this.elapsed / this.profile.transition.durationMs,
        );
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const mixed = {} as Values;
        for (const key of Object.keys(this.start) as (keyof Values)[]) {
            if (key === 'materials') continue;
            const a = this.start[key],
                b = this.destination[key];
            if (a instanceof Color && b instanceof Color)
                Object.assign(mixed, { [key]: a.clone().lerp(b, ease) });
            else if (a instanceof Vector3 && b instanceof Vector3)
                Object.assign(mixed, { [key]: a.clone().lerp(b, ease) });
            else if (typeof a === 'number' && typeof b === 'number')
                Object.assign(mixed, { [key]: a + (b - a) * ease });
        }
        mixed.materials = {};
        for (const [id, a] of Object.entries(this.start.materials)) {
            const b = this.destination.materials[id];
            const patch: Values['materials'][string] = {};
            if (a.color && b.color)
                patch.color = a.color.clone().lerp(b.color, ease);
            for (const key of [
                'opacity',
                'envMapIntensity',
                'emissiveIntensity',
            ] as const)
                if (a[key] !== undefined && b[key] !== undefined)
                    patch[key] = a[key] + (b[key] - a[key]) * ease;
            mixed.materials[id] = patch;
        }
        this.current = t === 1 ? this.destination : mixed;
        this.write(this.current);
        this.active = t < 1;
        return this.active;
    }
    private write(v: Values) {
        this.background.copy(v.background);
        this.fog.color.copy(v.fogColor);
        this.fog.near = v.fogNear;
        this.fog.far = v.fogFar;
        this.renderer.toneMappingExposure = v.exposure;
        this.scene.environmentIntensity = v.environment;
        this.hemisphere.color.copy(v.sky);
        this.hemisphere.groundColor.copy(v.ground);
        this.hemisphere.intensity = v.ambient;
        this.key.color.copy(v.keyColor);
        this.key.intensity = v.keyIntensity;
        if (!this.key.position.equals(v.keyPosition))
            this.key.shadow.needsUpdate = true;
        this.key.position.copy(v.keyPosition);
        this.key.shadow.intensity = v.shadowIntensity;
        this.fill.color.copy(v.fillColor);
        this.fill.intensity = v.fillIntensity;
        this.fill.position.copy(v.fillPosition);
        this.locals.forEach((light, index) => {
            light.intensity =
                this.profile.localLights[index].intensity *
                v.localScale *
                Number(this.quality.interiorLights);
        });
        for (const [id, patch] of Object.entries(v.materials))
            for (const material of this.materials.get(id) ?? []) {
                if (patch.color) material.color.copy(patch.color);
                for (const key of [
                    'opacity',
                    'envMapIntensity',
                    'emissiveIntensity',
                ] as const)
                    if (patch[key] !== undefined) material[key] = patch[key];
            }
    }
    dispose() {
        this.rig.removeFromParent();
        this.key.shadow.dispose();
        this.locals.forEach((light) => light.removeFromParent());
        if (this.scene.background === this.background)
            this.scene.background = this.previousBackground;
        if (this.scene.fog === this.fog) this.scene.fog = this.previousFog;
        this.scene.environmentIntensity = this.previousEnvironmentIntensity;
    }
}
