import { useEffect } from 'react';
import type { RefObject } from 'react';

const ITEMS = '[role="menu"] [role^="menuitem"]:not(:disabled)';

/*
 * Cierre y teclado de los menús flotantes propios del centro de control. No usamos los de Radix porque se
 * montan en <body>, fuera de .cc-root, y no heredarían los tokens --cc-* (cristal, acento, tono). Escape
 * cierra el menú, devuelve el foco al botón que lo abrió y marca el evento para que no devuelva además la
 * cámara a la vista general (la página ignora los Escape ya consumidos). Como role="menu" promete
 * navegación con flechas, al abrir se enfoca la opción marcada (o la primera) y ↑ ↓ Inicio Fin recorren
 * las opciones, incluidas las «próxima entrega» (aria-disabled sigue siendo enfocable).
 */
export function useDismiss(
    ref: RefObject<HTMLElement | null>,
    open: boolean,
    close: () => void,
) {
    useEffect(() => {
        if (!open) return;
        const items = () =>
            Array.from(ref.current?.querySelectorAll<HTMLElement>(ITEMS) ?? []);
        const initial = items();
        (
            initial.find(
                (item) => item.getAttribute('aria-checked') === 'true',
            ) ?? initial[0]
        )?.focus({ preventScroll: true });
        const pointer = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) close();
        };
        const key = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
                ref.current
                    ?.querySelector<HTMLElement>('[aria-haspopup]')
                    ?.focus();
                return;
            }
            const list = items();
            const index = list.indexOf(document.activeElement as HTMLElement);
            if (index < 0) return;
            const next = {
                ArrowDown: (index + 1) % list.length,
                ArrowUp: (index - 1 + list.length) % list.length,
                Home: 0,
                End: list.length - 1,
            }[event.key];
            if (next === undefined) return;
            event.preventDefault();
            list[next].focus();
        };
        document.addEventListener('pointerdown', pointer);
        document.addEventListener('keydown', key);
        return () => {
            document.removeEventListener('pointerdown', pointer);
            document.removeEventListener('keydown', key);
        };
    }, [ref, open, close]);
}
