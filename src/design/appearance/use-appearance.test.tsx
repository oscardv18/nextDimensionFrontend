import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTheme, useAppearance } from './use-appearance';

function mockMedia(dark: boolean, reduced = false) {
    vi.stubGlobal(
        'matchMedia',
        (query: string) =>
            ({
                matches: query.includes('prefers-color-scheme')
                    ? dark
                    : reduced,
                addEventListener: () => undefined,
                removeEventListener: () => undefined,
            }) as unknown as MediaQueryList,
    );
}

beforeEach(() => {
    localStorage.clear();
    const root = document.documentElement;
    root.removeAttribute('class');
    root.removeAttribute('style');
    root.dataset.appearance = 'system';
    root.dataset.theme = 'light';
    root.dataset.accent = 'purple';
    mockMedia(false);
    initializeTheme();
});

describe('useAppearance', () => {
    it('lee el estado que dejó el script de index.html', () => {
        const root = document.documentElement;
        root.dataset.appearance = 'dark';
        root.dataset.accent = 'blue';
        root.classList.add('sin-vidrio', 'carril-amplio');
        initializeTheme();
        const { result } = renderHook(() => useAppearance());

        expect(result.current).toMatchObject({
            appearance: 'dark',
            resolvedAppearance: 'dark',
            accent: 'blue',
            glass: false,
            railWide: true,
        });
    });

    it('cambia el tema y lo guarda con los mismos nombres que lee el script', () => {
        const { result } = renderHook(() => useAppearance());
        act(() => result.current.updateAppearance('dark'));

        const root = document.documentElement;
        expect(root.dataset.theme).toBe('dark');
        expect(root.dataset.appearance).toBe('dark');
        expect(root.style.colorScheme).toBe('dark');
        expect(localStorage.getItem('appearance')).toBe('dark');
    });

    it('«sistema» sigue la preferencia del sistema operativo', () => {
        mockMedia(true);
        const { result } = renderHook(() => useAppearance());
        act(() => result.current.updateAppearance('system'));

        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(result.current.appearance).toBe('system');
    });

    it('guarda y aplica acento, cristal, movimiento y carril', () => {
        const { result } = renderHook(() => useAppearance());
        act(() => {
            result.current.updateAccent('red');
            result.current.updateGlass(false);
            result.current.updateReducedMotion(true);
            result.current.updateRailWide(true);
        });

        const root = document.documentElement;
        expect(root.dataset.accent).toBe('red');
        expect(root.classList.contains('sin-vidrio')).toBe(true);
        expect(root.classList.contains('reducido')).toBe(true);
        expect(root.classList.contains('carril-amplio')).toBe(true);
        expect(localStorage.getItem('accent')).toBe('red');
        expect(localStorage.getItem('glass')).toBe('off');
        expect(localStorage.getItem('motion')).toBe('reduced');
        expect(localStorage.getItem('rail')).toBe('wide');

        act(() => {
            result.current.updateGlass(true);
            result.current.updateReducedMotion(false);
            result.current.updateRailWide(false);
        });
        expect(localStorage.getItem('glass')).toBe('on');
        expect(localStorage.getItem('motion')).toBe('full');
        expect(localStorage.getItem('rail')).toBe('narrow');
        expect(root.classList.contains('reducido')).toBe(false);
    });

    it('el movimiento reducido del sistema se respeta aunque la preferencia propia sea completa', () => {
        mockMedia(false, true);
        const { result } = renderHook(() => useAppearance());
        act(() => result.current.updateReducedMotion(false));

        expect(result.current.reducedMotionPreference).toBe(false);
        expect(result.current.reducedMotion).toBe(true);
        expect(document.documentElement.classList.contains('reducido')).toBe(
            true,
        );
    });
});
