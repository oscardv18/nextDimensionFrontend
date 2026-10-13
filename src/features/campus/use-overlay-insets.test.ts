import { describe, expect, it } from 'vitest';
import { measureOverlayInsets } from './use-overlay-insets';
import { panelInsets } from './camera-framing';

const rect = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
});

describe('composición de capas flotantes', () => {
    it('mide las capas del Shell en las coordenadas del visor y conserva su tamaño', () => {
        const viewport = rect(0, 100, 1440, 700);
        const insets = measureOverlayInsets(viewport, [
            { side: 'top', rect: rect(12, 112, 1416, 36) },
            { side: 'left', rect: rect(12, 160, 48, 200) },
            { side: 'bottom', rect: rect(500, 744, 440, 44) },
            { side: 'auto', rect: rect(1040, 160, 388, 560) },
        ]);
        expect(insets).toEqual({ top: 56, left: 68, bottom: 64, right: 408 });
        expect(viewport.height).toBe(700);
    });
    it('el panel en franja inferior (móvil) reserva abajo y las capas ocultas no reservan', () => {
        const viewport = rect(0, 0, 390, 844);
        const insets = measureOverlayInsets(viewport, [
            { side: 'auto', rect: rect(8, 520, 374, 250) },
            { side: 'left', rect: rect(0, 0, 0, 0) },
        ]);
        expect(insets).toEqual({ top: 0, left: 0, right: 0, bottom: 332 });
    });
    it('limita cada reserva para que siempre quede área segura', () => {
        const viewport = rect(0, 0, 640, 320);
        const insets = measureOverlayInsets(viewport, [
            { side: 'bottom', rect: rect(0, 20, 640, 300) },
            { side: 'right', rect: rect(0, 0, 640, 320) },
        ]);
        expect(insets).toEqual({ top: 0, left: 0, bottom: 160, right: 256 });
    });
    it('las regiones informativas no alejan la cámara y el panel horizontal se reserva completo', () => {
        const viewport = rect(0, 0, 640, 360);
        expect(
            measureOverlayInsets(viewport, [
                { side: 'none', rect: rect(10, 70, 400, 60) },
                { side: 'auto', rect: rect(292, 120, 340, 130) },
            ]),
        ).toEqual({ top: 0, bottom: 0, left: 0, right: 356 });
    });
    it('en móvil apila la reserva sobre el diagnóstico sin consumir toda la altura', () => {
        const viewport = { width: 640, height: 320 };
        const base = { top: 56, bottom: 164, left: 0, right: 0 };
        expect(panelInsets(viewport, true, base)).toEqual({
            ...base,
            bottom: 194,
        });
        expect(panelInsets(viewport, false, base)).toEqual(base);
        expect(viewport).toEqual({ width: 640, height: 320 });
    });
});
