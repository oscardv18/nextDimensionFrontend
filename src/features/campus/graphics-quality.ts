export const qualityProfiles = {
    high: {
        maxDpr: 1.5,
        shadowSize: 2048,
        softShadows: true,
    },
    balanced: {
        maxDpr: 1.25,
        shadowSize: 1024,
        softShadows: true,
    },
    low: {
        maxDpr: 1,
        shadowSize: 512,
        softShadows: false,
    },
} as const;
export type QualityName = keyof typeof qualityProfiles;

/** Opt-in de diagnóstico, sin heurísticas por dispositivo ni alternancias automáticas. */
export function graphicsOptions(search: string, development: boolean) {
    const params = new URLSearchParams(development ? search : '');
    const requested = params.get('quality');
    const name: QualityName =
        requested === 'balanced' || requested === 'low' ? requested : 'high';
    return {
        name,
        ...qualityProfiles[name],
        shadows: params.get('shadows') !== 'off',
        interiorLights: params.get('interiorLights') !== 'off',
        transparency: params.get('transparency') !== 'off',
        blur: params.get('blur') !== 'off',
    };
}
export type GraphicsOptions = ReturnType<typeof graphicsOptions>;
export const campusGraphics = graphicsOptions(
    typeof location === 'undefined' ? '' : location.search,
    import.meta.env.DEV,
);
