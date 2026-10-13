import { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useTranslation } from 'react-i18next';
import {
    assetUrl,
    disposeCampus,
    prepareCampus,
    resolveCampus,
    verifyAsset,
} from './asset';
import type { Campus } from './asset';
import type { ReactNode } from 'react';
import type { Insets } from './camera-framing';
import type { ScreenRect } from './use-overlay-insets';
import CampusScene from './campus-scene';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import type { ThemeName } from './campus-theme';
import type { Annotation } from './campus-scene';
import { campusGraphics } from './graphics-quality';
import { PerformanceProbe } from './performance-probe';
import { worldFov } from './asset-bundle';

type Props = {
    theme: ThemeName;
    selected: string | null;
    roofHidden: boolean;
    revision: number;
    reservePanel: boolean;
    insets: Insets;
    regions: ScreenRect[];
    debugOrbit: boolean;
    reducedMotion: boolean;
    onSelect: (id: string) => void;
    onSettled: (id: string | null, revision: number) => void;
    onMoving: (manual?: boolean) => void;
    onReady: (campus: Campus) => void;
    onError: () => void;
    renderLabel?: (departmentId: string) => ReactNode;
    annotations?: Annotation[];
};

export default function CampusViewer({ onReady, onError, ...props }: Props) {
    const { t } = useTranslation();
    const [campus, setCampus] = useState<Campus | null>(null);
    const loadTiming = useRef({ totalMs: 0, fetchMs: 0, parseMs: 0 });
    useEffect(() => {
        const controller = new AbortController();
        let owned: Campus | undefined;
        async function load() {
            const start = performance.now();
            try {
                const response = await fetch(assetUrl, {
                    signal: controller.signal,
                });
                if (!response.ok)
                    throw new Error(`GLB HTTP ${response.status}`);
                const bytes = await response.arrayBuffer();
                const fetched = performance.now();
                await verifyAsset(bytes);
                const parsing = performance.now();
                const gltf = await new GLTFLoader().parseAsync(bytes, '');
                owned = resolveCampus(gltf.scene);
                prepareCampus(owned);
                loadTiming.current = {
                    totalMs: performance.now() - start,
                    fetchMs: fetched - start,
                    parseMs: performance.now() - parsing,
                };
                if (controller.signal.aborted) {
                    disposeCampus(owned);
                    owned = undefined;
                    return;
                }
                setCampus(owned);
                onReady(owned);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Campus load failed', error);
                    onError();
                }
            }
        }
        void load();
        return () => {
            controller.abort();
            if (owned) disposeCampus(owned);
        };
    }, [onReady, onError]);
    if (!campus) return <p role="status">{t('campus.loading')}</p>;
    return (
        <Canvas
            frameloop="demand"
            shadows="soft"
            gl={{
                toneMapping: NeutralToneMapping,
                outputColorSpace: SRGBColorSpace,
            }}
            camera={{
                fov: worldFov(
                    typeof location === 'undefined' ? '' : location.search,
                ),
                near: 0.5,
                far: 10000,
            }}
            dpr={[1, campusGraphics.maxDpr]}
            fallback={<p>{t('campus.fallback')}</p>}
        >
            <CampusScene campus={campus} {...props} onContextLost={onError} />
            {import.meta.env.DEV && (
                <PerformanceProbe campus={campus} loadTimingRef={loadTiming} />
            )}
        </Canvas>
    );
}
