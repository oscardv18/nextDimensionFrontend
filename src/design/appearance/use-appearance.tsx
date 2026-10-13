import { useSyncExternalStore } from 'react';

/*
 * Apariencia unificada de Arxnet: modo (claro, oscuro, sistema), acento, cristal, movimiento reducido y
 * carril ampliado. La fuente de verdad es localStorage; el script en línea de index.html lo lee antes del
 * primer pintado y deja <html> con los atributos correctos (sin destello). Aquí solo se actualizan y se reflejan.
 */
export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';
export type Accent = 'purple' | 'red' | 'blue';

export type AppearanceState = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly accent: Accent;
    readonly glass: boolean;
    /** Preferencia propia; el efectivo también respeta prefers-reduced-motion del sistema. */
    readonly reducedMotionPreference: boolean;
    readonly reducedMotion: boolean;
    readonly railWide: boolean;
};

export type UseAppearanceReturn = AppearanceState & {
    readonly updateAppearance: (mode: Appearance) => void;
    readonly updateAccent: (accent: Accent) => void;
    readonly updateGlass: (enabled: boolean) => void;
    readonly updateReducedMotion: (reduced: boolean) => void;
    readonly updateRailWide: (wide: boolean) => void;
};

export const ACCENTS: Accent[] = ['purple', 'red', 'blue'];

const listeners = new Set<() => void>();
const media = (query: string) =>
    typeof window === 'undefined' ? null : window.matchMedia(query);
const prefersDark = () =>
    media('(prefers-color-scheme: dark)')?.matches ?? false;
const prefersReducedMotion = () =>
    media('(prefers-reduced-motion: reduce)')?.matches ?? false;

/** Mismos nombres y valores que lee el script de index.html. */
const setPreference = (name: string, value: string): void => {
    try {
        localStorage.setItem(name, value);
    } catch {
        // Sin almacenamiento disponible: la preferencia dura solo esta sesión.
    }
};
const getPreference = (name: string): string | null => {
    try {
        return localStorage.getItem(name);
    } catch {
        return null;
    }
};

function readFromDocument(): AppearanceState {
    if (typeof document === 'undefined') {
        return {
            appearance: 'system',
            resolvedAppearance: 'light',
            accent: 'purple',
            glass: true,
            reducedMotionPreference: false,
            reducedMotion: false,
            railWide: false,
        };
    }

    const root = document.documentElement;
    const appearance = (
        ['light', 'dark', 'system'].includes(root.dataset.appearance ?? '')
            ? root.dataset.appearance
            : 'system'
    ) as Appearance;
    const accent = (
        ACCENTS.includes(root.dataset.accent as Accent)
            ? root.dataset.accent
            : 'purple'
    ) as Accent;
    const reducedMotionPreference = getPreference('motion') === 'reduced';

    return {
        appearance,
        resolvedAppearance:
            appearance === 'system'
                ? prefersDark()
                    ? 'dark'
                    : 'light'
                : appearance,
        accent,
        glass: !root.classList.contains('sin-vidrio'),
        reducedMotionPreference,
        reducedMotion: reducedMotionPreference || prefersReducedMotion(),
        railWide: root.classList.contains('carril-amplio'),
    };
}

let state = readFromDocument();

function apply(next: AppearanceState): void {
    const root = document.documentElement;
    const themeChanges = root.dataset.theme !== next.resolvedAppearance;

    // Transición breve de color al cambiar de tema (sin animar el desenfoque), como en el prototipo.
    if (themeChanges && !next.reducedMotion) {
        root.classList.add('transicion-tema');
        window.setTimeout(() => root.classList.remove('transicion-tema'), 320);
    }

    root.dataset.appearance = next.appearance;
    root.dataset.theme = next.resolvedAppearance;
    root.dataset.accent = next.accent;
    root.style.colorScheme = next.resolvedAppearance;
    root.classList.toggle('sin-vidrio', !next.glass);
    root.classList.toggle('reducido', next.reducedMotion);
    root.classList.toggle('carril-amplio', next.railWide);
}

function update(patch: Partial<AppearanceState>): void {
    const merged = { ...state, ...patch };
    state = {
        ...merged,
        resolvedAppearance:
            merged.appearance === 'system'
                ? prefersDark()
                    ? 'dark'
                    : 'light'
                : merged.appearance,
        reducedMotion: merged.reducedMotionPreference || prefersReducedMotion(),
    };
    apply(state);
    listeners.forEach((listener) => listener());
}

/** Lee el estado que dejó el script de index.html y sigue los cambios del sistema (modo y movimiento). */
export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    state = readFromDocument();
    media('(prefers-color-scheme: dark)')?.addEventListener('change', () =>
        update({}),
    );
    media('(prefers-reduced-motion: reduce)')?.addEventListener('change', () =>
        update({}),
    );
}

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

export function getAppearance(): AppearanceState {
    return state;
}

export function useAppearance(): UseAppearanceReturn {
    const current = useSyncExternalStore(
        subscribe,
        () => state,
        () => state,
    );

    return {
        ...current,
        updateAppearance: (mode) => {
            setPreference('appearance', mode);
            update({ appearance: mode });
        },
        updateAccent: (accent) => {
            setPreference('accent', accent);
            update({ accent });
        },
        updateGlass: (enabled) => {
            setPreference('glass', enabled ? 'on' : 'off');
            update({ glass: enabled });
        },
        updateReducedMotion: (reduced) => {
            setPreference('motion', reduced ? 'reduced' : 'full');
            update({ reducedMotionPreference: reduced });
        },
        updateRailWide: (wide) => {
            setPreference('rail', wide ? 'wide' : 'narrow');
            update({ railWide: wide });
        },
    };
}
