/* Móvil: acceso equivalente por grupos de departamentos, con miniatura isométrica para conservar el contexto. */
import { useTranslation } from 'react-i18next';
import { DemoBadge, TONE_CLASS, hueColor } from '@/design/common';
import { useUi } from '@/design/state/ui-state';
import type { OrganizationMapData } from '@/data/contracts';
import { edificio } from './iso';

export function DepartmentList({
    map,
    onOpenDepartment,
}: {
    map: OrganizationMapData;
    onOpenDepartment: (publicId: string) => void;
}) {
    const { t } = useTranslation();
    const layers = useUi((s) => s.layers);
    const c = map.context;

    return (
        <div className="lista-dep">
            <div>
                <h1 style={{ margin: 0, fontSize: 21 }}>{t('map.title')}</h1>
                <p
                    style={{
                        margin: '2px 0 0',
                        color: 'var(--t3)',
                        fontSize: 12.5,
                    }}
                >
                    {c.organizationName} · {c.branchName} · {t('map.byGroups')}
                    {c.isDemo && (
                        <>
                            {' '}
                            · <DemoBadge />
                        </>
                    )}
                </p>
            </div>
            {map.zones.map((z) => {
                const deps = map.departments.filter((d) => d.zoneKey === z.key);
                if (!deps.length) {
                    return null;
                }
                return (
                    <section key={z.key} aria-label={z.name}>
                        <h2>{z.name}</h2>
                        {deps.map((d) => (
                            <button
                                key={d.publicId}
                                data-dep={d.publicId}
                                className="fila-dep"
                                style={{ ['--c' as string]: hueColor(d.hue) }}
                                onClick={() => onOpenDepartment(d.publicId)}
                            >
                                <svg
                                    className="mini"
                                    viewBox="-250 -215 500 360"
                                    aria-hidden
                                    dangerouslySetInnerHTML={{
                                        __html: edificio(d.building).svg,
                                    }}
                                />
                                <span>
                                    <b>{d.name}</b>
                                    <small>{d.summary}</small>
                                    {layers.people && (
                                        <small>
                                            {t('people.assigned', {
                                                count: d.people.assigned,
                                            })}{' '}
                                            ·{' '}
                                            {t('people.connected', {
                                                count: d.people.connected,
                                            })}
                                        </small>
                                    )}
                                </span>
                                <span
                                    className={`insignia-n ${TONE_CLASS[d.pending.worst]}`}
                                    aria-label={t('pending.count', {
                                        count: d.pending.total,
                                    })}
                                >
                                    {d.pending.total || '✓'}
                                </span>
                            </button>
                        ))}
                    </section>
                );
            })}
        </div>
    );
}
