/* Pie flotante: frescura de los datos (izquierda) e indicadores rápidos (derecha). */
import type { ReactNode } from 'react';
import { Banknote, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { totals } from './demo-data';
import { formatAmount } from './format';

export function StatusStrip({ children }: { children?: ReactNode }) {
    const { t, i18n } = useTranslation();
    return (
        <>
            <div className="cc-status" data-enter="bottom">
                <p className="cc-updated">
                    <Clock size={15} strokeWidth={1.6} aria-hidden="true" />
                    {t('cc.lastUpdate')}
                    <span aria-hidden="true">·</span>
                    {t('cc.secondsAgo', { count: totals.updatedSecondsAgo })}
                    <span className="cc-demo-tag">{t('cc.demoData')}</span>
                </p>
                {children}
            </div>
            <ul
                className="cc-chips"
                aria-label={t('cc.indicators')}
                data-enter="bottom"
            >
                <li className="cc-chip cc-island">
                    <Banknote size={16} strokeWidth={1.6} aria-hidden="true" />
                    {t('cc.cash', {
                        amount: formatAmount(totals.cash, i18n.language),
                    })}
                </li>
                <li className="cc-chip cc-island">
                    <FileText size={16} strokeWidth={1.6} aria-hidden="true" />
                    {t('cc.requests', { count: totals.requests })}
                </li>
            </ul>
        </>
    );
}
