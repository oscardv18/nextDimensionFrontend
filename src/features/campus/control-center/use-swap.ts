import { useEffect, useState } from 'react';

/*
 * Transición de salida antes de cambiar de contenido: conserva el valor mostrado durante `duration` ms
 * con fase «leaving» y después muestra el nuevo con fase «entering». Así el panel sale y entra
 * coordinado con el vuelo de la cámara, sin una biblioteca de animación. Con duración 0 cambia al instante.
 */
export function useSwap<T>(value: T, duration: number) {
    const [state, setState] = useState({ shown: value, leaving: false });
    if (state.shown !== value && !state.leaving && duration === 0)
        setState({ shown: value, leaving: false });
    else if (state.shown !== value && !state.leaving)
        setState({ shown: state.shown, leaving: true });
    useEffect(() => {
        if (!state.leaving) return;
        const timer = window.setTimeout(
            () => setState({ shown: value, leaving: false }),
            duration,
        );
        return () => window.clearTimeout(timer);
    }, [state.leaving, value, duration]);
    return { shown: state.shown, leaving: state.leaving };
}
