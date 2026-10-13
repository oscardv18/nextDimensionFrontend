/* Título contextual: vista general o departamento enfocado, con migas y regreso. */
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { demoCompany } from './demo-data';

type Props = {
    selected: string | null;
    onOverview: () => void;
    /** El consumidor ofrece el control según las capas disponibles en el activo. */
    interior?: { hidden: boolean; disabled: boolean; onToggle: () => void };
};

export function ViewHeading({ selected, onOverview, interior }: Props) {
    const { t } = useTranslation();
    if (!selected)
        return (
            <div className="cc-heading" key="overview" data-enter="fade">
                <h1>{t('cc.controlCenter')}</h1>
                <p>
                    {demoCompany.name} · {t('campus.overview')}
                </p>
            </div>
        );
    return (
        // key: la animación de entrada se repite al cambiar de departamento.
        <div className="cc-heading" key={selected} data-enter="fade">
            <nav aria-label={t('cc.breadcrumb')} className="cc-crumbs">
                <button type="button" onClick={onOverview}>
                    {t('cc.controlCenter')}
                </button>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{t(`campus.${selected}`)}</span>
            </nav>
            <h1>{t(`campus.${selected}`)}</h1>
            <div className="cc-heading-actions">
                <button type="button" className="cc-pill" onClick={onOverview}>
                    <ArrowLeft size={15} aria-hidden="true" />
                    {t('cc.backToOverview')}
                </button>
                {interior && (
                    <button
                        type="button"
                        className="cc-pill"
                        aria-pressed={interior.hidden}
                        disabled={interior.disabled}
                        onClick={interior.onToggle}
                    >
                        {interior.hidden ? (
                            <EyeOff size={15} aria-hidden="true" />
                        ) : (
                            <Eye size={15} aria-hidden="true" />
                        )}
                        {t('cc.viewInterior')}
                    </button>
                )}
            </div>
        </div>
    );
}
