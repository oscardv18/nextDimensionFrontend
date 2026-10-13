import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { campusGraphics } from './graphics-quality';

/** Herramientas opt-in; las métricas se leen al pedirlas, sin estado React por fotograma. */
export function PerformanceTools() {
    const { t } = useTranslation();
    const [snapshot, setSnapshot] = useState('');
    return (
        <details>
            <summary>{t('campus.performance')}</summary>
            <form method="get">
                <input
                    type="hidden"
                    name="fov"
                    value={
                        new URLSearchParams(location.search).get('fov') ?? '20'
                    }
                />
                <label>
                    {t('campus.quality')}{' '}
                    <select name="quality" defaultValue={campusGraphics.name}>
                        {(['high', 'balanced', 'low'] as const).map((name) => (
                            <option key={name} value={name}>
                                {t(`campus.quality.${name}`)}
                            </option>
                        ))}
                    </select>
                </label>
                {(
                    [
                        'shadows',
                        'interiorLights',
                        'transparency',
                        'blur',
                    ] as const
                ).map((name) => (
                    <label key={name}>
                        {t(`campus.performance.${name}`)}{' '}
                        <select
                            name={name}
                            defaultValue={campusGraphics[name] ? 'on' : 'off'}
                        >
                            <option value="on">
                                {t('campus.performance.on')}
                            </option>
                            <option value="off">
                                {t('campus.performance.off')}
                            </option>
                        </select>
                    </label>
                ))}
                <button type="submit">{t('campus.performance.apply')}</button>
            </form>
            <button
                type="button"
                onClick={() =>
                    window.dispatchEvent(new Event('campus:benchmark'))
                }
            >
                {t('campus.performance.sample')}
            </button>
            <button
                type="button"
                onClick={() =>
                    setSnapshot(
                        document.querySelector<HTMLCanvasElement>(
                            '.campus-viewport canvas',
                        )?.dataset.performanceProbe ??
                            t('campus.performance.pending'),
                    )
                }
            >
                {t('campus.performance.read')}
            </button>
            <pre
                style={{
                    maxHeight: 260,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                }}
            >
                {snapshot}
            </pre>
        </details>
    );
}
