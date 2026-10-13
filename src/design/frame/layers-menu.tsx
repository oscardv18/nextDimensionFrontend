/* Capas del mapa (C), portado del prototipo. Las preferencias se recuerdan en este navegador. */
import { ChevronDown, Layers as LayersIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LAYERS, setUi, useUi } from '@/design/state/ui-state';
import type { Layers } from '@/design/state/ui-state';
import { Popover, PopoverContent, PopoverTrigger } from '@/design/ui/popover';
import { Switch } from '@/design/ui/switch';

export const LAYER_KEYS: (keyof Layers)[] = [
    'departments',
    'connections',
    'pulses',
    'counters',
    'labels',
    'people',
];

export function LayersMenu({ demo }: { demo: boolean }) {
    const { t } = useTranslation();
    const layers = useUi((s) => s.layers),
        open = useUi((s) => s.layersOpen),
        paused = useUi((s) => s.paused);
    const setLayer = (key: keyof Layers, value: boolean) =>
        setUi((s) => ({
            layers: {
                ...s.layers,
                [key]: value,
                ...(key === 'pulses' && value ? { connections: true } : {}),
            },
        }));
    const active = Object.values(layers).filter(Boolean).length;
    const note = (key: keyof Layers) => {
        if (key === 'pulses' && !demo) {
            return t('layers.pulses.unavailable');
        }
        if (key === 'pulses' && !layers.connections) {
            return t('layers.pulses.requires');
        }
        return t(`layers.${key}.help`);
    };

    return (
        <Popover open={open} onOpenChange={(o) => setUi({ layersOpen: o })}>
            <PopoverTrigger
                className="boton-b"
                aria-label={t('layers.trigger', { count: active })}
            >
                <LayersIcon />
                <span className="lbl">{t('layers.title')}</span>
                <kbd>C</kbd>
                <ChevronDown className="chev" />
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="menu-vidrio w-[340px] p-2"
            >
                <div className="menu-t">
                    {t('layers.heading')} <kbd>C</kbd>
                </div>
                {LAYER_KEYS.map((key) => (
                    <label key={key} className="capa-fila">
                        <span>
                            <b>{t(`layers.${key}.name`)}</b>
                            <small>{note(key)}</small>
                        </span>
                        <Switch
                            checked={
                                layers[key] &&
                                !(
                                    key === 'pulses' &&
                                    (!layers.connections || !demo)
                                )
                            }
                            disabled={key === 'pulses' && !demo}
                            onCheckedChange={(v) => setLayer(key, v)}
                            aria-label={t(`layers.${key}.name`)}
                        />
                    </label>
                ))}
                <label className="capa-fila">
                    <span>
                        <b>{t('motion.pauseAmbient')}</b>
                        <small>{t('motion.pauseAmbientHelp')}</small>
                    </span>
                    <Switch
                        checked={paused}
                        onCheckedChange={(v) => setUi({ paused: v })}
                        aria-label={t('motion.pauseAmbient')}
                    />
                </label>
                <div className="menu-pie">
                    <button
                        className="btn mini"
                        onClick={() => setUi({ layers: { ...DEFAULT_LAYERS } })}
                    >
                        {t('layers.reset')}
                    </button>
                    <span>{t('layers.remembered')}</span>
                </div>
            </PopoverContent>
        </Popover>
    );
}
