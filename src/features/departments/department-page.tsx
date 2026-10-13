import { useLoaderData, useNavigate } from 'react-router';
import { PageTitle } from '@/features/shared/page-title';
import { ArrowLeft, Rows3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DemoBadge,
    DepartmentIcon,
    StatusChip,
    TONE_CLASS,
    hueColor,
} from '@/design/common';
import { backToMap } from '@/app/navigation';
import { openOverlay, setUi } from '@/design/state/ui-state';
import { getAppearance } from '@/design/appearance/use-appearance';
import { routes } from '@/app/routes';
import type { DepartmentPageData } from '@/data/contracts';

/* Página inicial de un departamento: contexto, resumen y regreso al mapa. Las funciones de cada
   departamento (riel, tablas, formularios) llegan con su módulo; aquí se anuncia ese estado. */
export default function DepartmentShow() {
    const { t } = useTranslation();
    const page = useLoaderData<DepartmentPageData>();
    const navigate = useNavigate();
    const { department: d, context, zone, siblings } = page;
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        setUi({ selection: d.publicId, link: null });
        ref.current
            ?.querySelector<HTMLElement>('h1')
            ?.focus({ preventScroll: true });
        if (!getAppearance().reducedMotion) {
            ref.current?.animate(
                [
                    { opacity: 0, transform: 'scale(.985) translateY(8px)' },
                    { opacity: 1, transform: 'none' },
                ],
                { duration: 300, easing: 'cubic-bezier(.22,.8,.24,1)' },
            );
        }
    }, [d.publicId]);

    /* Esc vuelve al mapa con este departamento seleccionado y su etiqueta enfocada */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !openOverlay() && !e.defaultPrevented) {
                backToMap(d.publicId);
            }
        };
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, [d.publicId]);

    return (
        <section
            ref={ref}
            className="depto"
            style={{
                ['--c' as string]: hueColor(d.hue),
                gridTemplateRows: 'auto 1fr',
            }}
            aria-label={t('department.label', { name: d.name })}
        >
            <PageTitle title={d.name} />
            <header className="depto-cab">
                <button className="btn" onClick={() => backToMap(d.publicId)}>
                    <ArrowLeft />
                    {t('department.back')} <kbd>Esc</kbd>
                </button>
                <div className="depto-tit">
                    <small>
                        {context.organizationName}
                        {zone && ` · ${zone.name}`}
                    </small>
                    <h1 tabIndex={-1}>
                        <span className="baldosa">
                            <DepartmentIcon icon={d.icon} />
                        </span>
                        {d.name}
                    </h1>
                </div>
                <nav className="hermanos" aria-label={t('department.siblings')}>
                    {siblings.map((s) => (
                        <button
                            key={s.publicId}
                            onClick={() =>
                                void navigate(routes.department(s.publicId))
                            }
                            aria-current={
                                s.publicId === d.publicId ? 'true' : undefined
                            }
                            style={{ ['--c' as string]: hueColor(s.hue) }}
                        >
                            <i />
                            {s.name}
                        </button>
                    ))}
                </nav>
            </header>
            <div className="depto-cuerpo" tabIndex={-1}>
                <dl className="kpis">
                    <div className={`kpi t-${TONE_CLASS[d.pending.worst]}`}>
                        <dt>{t('department.pending')}</dt>
                        <dd className="num">{d.pending.total}</dd>
                        <small>{t(`tone.${d.pending.worst}`)}</small>
                    </div>
                    <div className="kpi">
                        <dt>{t('department.assigned')}</dt>
                        <dd className="num">{d.people.assigned}</dd>
                    </div>
                    <div className="kpi">
                        <dt>{t('department.connected')}</dt>
                        <dd className="num">{d.people.connected}</dd>
                        <small>{t('people.hint')}</small>
                    </div>
                </dl>
                <div className="inicio-rejilla">
                    <div className="col-p">
                        <section className="bloque">
                            <div className="bloque-cab">
                                <h2>{t('department.summary')}</h2>
                                {context.isDemo && <DemoBadge />}
                            </div>
                            <p
                                style={{
                                    margin: '0 0 12px',
                                    color: 'var(--t2)',
                                }}
                            >
                                {d.summary}
                            </p>
                            {d.pending.byTone.length ? (
                                <div
                                    className="pend"
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 6,
                                    }}
                                >
                                    {d.pending.byTone.map((item) => (
                                        <StatusChip
                                            key={item.tone}
                                            tone={item.tone}
                                            text={`${t(`tone.${item.tone}`)} · ${item.count}`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="vacio">
                                    {t('department.nothingPending', {
                                        name: d.name,
                                    })}
                                </div>
                            )}
                        </section>
                        <section className="bloque">
                            <div className="bloque-cab">
                                <h2>
                                    <Rows3 size={18} />
                                    {t('department.functions')}
                                </h2>
                            </div>
                            <div className="vacio">
                                {t('department.functionsSoon', {
                                    name: d.name,
                                })}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </section>
    );
}
