import type { Sector } from '@/data/contracts';
import { SECTORS } from './build-map';

const KEY = 'arx-demo-sector';
const DEFAULT: Sector = 'industry';

// Respaldo cuando localStorage no está disponible: el escenario dura hasta recargar.
let memory: Sector | null = null;

/** Escenario activo, recordado en este navegador (hace de sesión en la demostración). */
export function readScenario(): Sector {
    try {
        const value = localStorage.getItem(KEY);

        return SECTORS.find((s) => s === value) ?? memory ?? DEFAULT;
    } catch {
        return memory ?? DEFAULT;
    }
}

export function writeScenario(sector: Sector): void {
    memory = sector;
    try {
        localStorage.setItem(KEY, sector);
    } catch {
        // Ya queda en memoria.
    }
}
