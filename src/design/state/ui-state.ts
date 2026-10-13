import { useSyncExternalStore } from 'react';

/*
 * Estado de interfaz del marco y del mapa (equivale al almacén del prototipo, sin datos de dominio:
 * los datos llegan como props). Persiste entre navegaciones porque el módulo vive
 * mientras dure la aplicación. Capas y pausa se recuerdan en este navegador (localStorage).
 */
export interface Layers {
    departments: boolean;
    connections: boolean;
    pulses: boolean;
    counters: boolean;
    labels: boolean;
    people: boolean;
}
export type Dialog = null | 'shortcuts' | 'settings' | 'departments';

export interface UiState {
    /** public_id del departamento seleccionado en el mapa. */
    selection: string | null;
    /** public_id de la conexión seleccionada. */
    link: string | null;
    layers: Layers;
    layersOpen: boolean;
    paused: boolean;
    dialog: Dialog;
    intro: boolean;
    /** Departamento cuya etiqueta debe recibir el foco cuando el mapa termine de pintarse. */
    pendingFocus: string | null;
}

export const DEFAULT_LAYERS: Layers = {
    departments: true,
    connections: true,
    pulses: true,
    counters: true,
    labels: false,
    people: false,
};

const read = <T>(key: string, fallback: T): T => {
    try {
        const value = localStorage.getItem(`arx-${key}`);

        return value === null ? fallback : (JSON.parse(value) as T);
    } catch {
        return fallback;
    }
};
const save = (key: string, value: unknown) => {
    try {
        localStorage.setItem(`arx-${key}`, JSON.stringify(value));
    } catch {
        // Sin almacenamiento disponible: la preferencia dura solo esta sesión.
    }
};

let state: UiState = {
    selection: null,
    link: null,
    layers: { ...DEFAULT_LAYERS, ...read<Partial<Layers>>('layers', {}) },
    layersOpen: false,
    paused: read('paused', false),
    dialog: null,
    intro: false,
    pendingFocus: null,
};
const listeners = new Set<() => void>();

export const getUi = () => state;

export function setUi(
    patch: Partial<UiState> | ((current: UiState) => Partial<UiState>),
): void {
    const delta = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...delta };

    if ('layers' in delta) {
        save('layers', state.layers);
    }

    if ('paused' in delta) {
        save('paused', state.paused);
    }

    listeners.forEach((listener) => listener());
}

export function useUi<T>(selector: (current: UiState) => T): T {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        () => selector(state),
        () => selector(state),
    );
}

/** Teclas sueltas: solo fuera de campos editables y sin superposiciones abiertas. */
export const isEditable = (element: Element | null) =>
    !!element &&
    ((element as HTMLElement).isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName));

export const openOverlay = () =>
    document.querySelector(
        [
            'dialog-content',
            'sheet-content',
            'dropdown-menu-content',
            'popover-content',
        ]
            .map((slot) => `[data-slot="${slot}"][data-state="open"]`)
            .join(','),
    );

export const focusDepartmentLabel = (publicId: string) =>
    requestAnimationFrame(() =>
        document
            .querySelector<HTMLElement>(`[data-dep="${publicId}"]`)
            ?.focus(),
    );
