import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_LAYERS,
    focusDepartmentLabel,
    getUi,
    isEditable,
    openOverlay,
    setUi,
} from './ui-state';

beforeEach(() => {
    localStorage.clear();
    setUi({
        selection: null,
        link: null,
        layers: { ...DEFAULT_LAYERS },
        paused: false,
        dialog: null,
        layersOpen: false,
    });
    localStorage.clear();
});

afterEach(() => {
    document.body.innerHTML = '';
});

describe('ui-state', () => {
    it('aplica parches parciales y también funciones del estado actual', () => {
        setUi({ selection: 'a' });
        setUi((s) => ({ paused: !s.paused }));

        expect(getUi().selection).toBe('a');
        expect(getUi().paused).toBe(true);
    });

    it('recuerda las capas y la pausa en localStorage, y nada más', () => {
        setUi({ layers: { ...DEFAULT_LAYERS, labels: true } });
        setUi({ paused: true });
        setUi({ selection: 'x' });

        expect(JSON.parse(localStorage.getItem('arx-layers')!)).toMatchObject({
            labels: true,
        });
        expect(localStorage.getItem('arx-paused')).toBe('true');
        expect(localStorage.length).toBe(2);
    });

    it('isEditable distingue los campos de texto del resto', () => {
        const input = document.createElement('input');
        const select = document.createElement('select');
        const button = document.createElement('button');

        expect(isEditable(input)).toBe(true);
        expect(isEditable(select)).toBe(true);
        expect(isEditable(button)).toBe(false);
        expect(isEditable(null)).toBe(false);
    });

    it('openOverlay detecta diálogos, cajones, menús y popovers abiertos', () => {
        expect(openOverlay()).toBeNull();

        document.body.innerHTML =
            '<div data-slot="sheet-content" data-state="closed"></div>';
        expect(openOverlay()).toBeNull();

        document.body.innerHTML =
            '<div data-slot="popover-content" data-state="open"></div>';
        expect(openOverlay()).not.toBeNull();
    });

    it('focusDepartmentLabel enfoca la etiqueta por public_id', async () => {
        document.body.innerHTML = '<button data-dep="abc"></button>';
        focusDepartmentLabel('abc');
        await new Promise((resolve) => requestAnimationFrame(resolve));

        expect(document.activeElement).toBe(
            document.querySelector('[data-dep="abc"]'),
        );
    });
});
