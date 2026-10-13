import worldManifest from './assets/company-world/0.2.0/manifest.json';
import worldBuild from './assets/company-world/0.2.0/build.json';
import worldThemes from './assets/company-world/0.2.0/themes.json';
import worldCameras from './assets/company-world/0.2.0/camera-candidates.json';

export type ThemePatch = {
    color?: string;
    opacity?: number;
    envMapIntensity?: number;
    emissiveIntensity?: number;
};
export type ThemeProfile = Omit<
    typeof worldThemes,
    'materials' | 'textures' | 'themes' | 'conventions'
> & {
    conventions: Record<string, string>;
    textures: Record<string, unknown>;
    materials: Record<
        string,
        {
            class: string;
            color?: string;
            emissive?: string;
            envMapIntensity?: number;
            themeKeys?: string[];
        }
    >;
    themes: Record<
        'dark' | 'light',
        Omit<typeof worldThemes.themes.dark, 'materials' | 'effects'> & {
            materials: Record<string, ThemePatch>;
            effects: Record<string, unknown>;
        }
    >;
};
export type CampusManifest = {
    assetId: string;
    assetVersion: string;
    contractVersion: string;
    nodes: { id: string; name: string; role: string; parent: string | null }[];
    departmentIds: string[];
    interactions: typeof worldManifest.interactions;
    environmentNodeIds: string[];
    detailNodeIds?: string[];
    revealLayers: typeof worldManifest.revealLayers;
    visibilityStates: typeof worldManifest.visibilityStates;
    defaultHiddenNodeIds?: string[];
    overviewFramingNodeIds: string[];
    accentMaterials?: string[];
    zoneAnchors?: Record<string, string[]>;
};
export type AssetBundle = {
    manifest: CampusManifest;
    build: {
        assetId: string;
        assetVersion: string;
        metrics: { bytes: number; sha256: string };
    };
    themes: ThemeProfile;
    cameraCandidates: typeof worldCameras;
};
export const activeAsset: AssetBundle = {
    manifest: worldManifest,
    build: worldBuild,
    themes: worldThemes,
    cameraCandidates: worldCameras,
};

/** Los activos se actualizan como bundles versionados; no hay selector histórico en ejecución. */
export function worldFov(search: string, development = import.meta.env.DEV) {
    return development && new URLSearchParams(search).get('fov') === '15'
        ? 15
        : 20;
}
