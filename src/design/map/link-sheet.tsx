/* Conexión de proceso (cajón lateral sin velo), portada del panel del prototipo. Muestra origen, destino y
   operaciones abiertas; las acciones sobre operaciones llegan con los módulos. */
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    DemoBadge,
    DepartmentIcon,
    LINK_CLASS,
    StatusChip,
    hueColor,
} from '@/design/common';
import { setUi, useUi } from '@/design/state/ui-state';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/design/ui/sheet';
import type { MapDepartmentData } from '@/data/contracts';
import type { Ruta } from './scene';

export function LinkSheet({
    route: r,
    departments,
    demo,
    onOpenDepartment,
}: {
    route: Ruta | undefined;
    departments: Map<string, MapDepartmentData>;
    demo: boolean;
    onOpenDepartment: (publicId: string) => void;
}) {
    const { t } = useTranslation();
    const paused = useUi((s) => s.paused);
    const from = r ? departments.get(r.v.from) : undefined,
        to = r ? departments.get(r.v.to) : undefined;

    return (
        <Sheet
            open={!!r}
            onOpenChange={(open) => !open && setUi({ link: null })}
        >
            <SheetContent
                side="right"
                className="cajon-vidrio sin-velo w-full gap-0 p-0 sm:max-w-[420px]"
            >
                {r && from && to && (
                    <div className="det">
                        <div className="det-cab">
                            <span className="ref">{t('link.kicker')}</span>
                            {demo && <DemoBadge />}
                        </div>
                        <div className="det-cuerpo">
                            <SheetTitle
                                className={`vin-t ${LINK_CLASS[r.color]}`}
                            >
                                <span className="linea-m" />
                                {r.v.name}
                            </SheetTitle>
                            <SheetDescription className="det-sub">
                                {from.name} → {to.name}
                            </SheetDescription>
                            <div className="vin-od">
                                {(
                                    [
                                        [t('link.origin'), from],
                                        [t('link.destination'), to],
                                    ] as const
                                ).map(([label, d]) => (
                                    <button
                                        key={label}
                                        className="vin-dep"
                                        style={{
                                            ['--c' as string]: hueColor(d.hue),
                                        }}
                                        onClick={() =>
                                            onOpenDepartment(d.publicId)
                                        }
                                    >
                                        <small>{label}</small>
                                        <span>
                                            <DepartmentIcon icon={d.icon} />
                                            <b>{d.name}</b>
                                        </span>
                                        <StatusChip
                                            tone={d.pending.worst}
                                            text={t('pending.count', {
                                                count: d.pending.total,
                                            })}
                                        />
                                        <ArrowRight className="f" />
                                    </button>
                                ))}
                            </div>
                            <section>
                                <h3>{t('link.counterTitle')}</h3>
                                <p className="nota-p">
                                    {t('link.counterHelp', {
                                        from: from.name,
                                        to: to.name,
                                    })}
                                </p>
                            </section>
                            <section>
                                <h3>
                                    {t('link.operations', {
                                        count: r.v.openOperations,
                                    })}
                                </h3>
                                {r.v.operationRefs.length ? (
                                    <div className="lista-ops">
                                        {r.v.operationRefs.map((ref) => (
                                            <div key={ref} className="op-f">
                                                <span className="ref">
                                                    {ref}
                                                </span>
                                                <b>{to.name}</b>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="nota-p">
                                        {t('link.noRefs', {
                                            count: r.v.openOperations,
                                        })}
                                    </p>
                                )}
                                <p className="nota-p">
                                    {t('link.detailLater')}
                                </p>
                            </section>
                            {demo && (
                                <div className="acciones">
                                    <button
                                        className="btn"
                                        onClick={() =>
                                            setUi((s) => ({
                                                paused: !s.paused,
                                            }))
                                        }
                                    >
                                        {paused
                                            ? t('motion.resume')
                                            : t('motion.pause')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
