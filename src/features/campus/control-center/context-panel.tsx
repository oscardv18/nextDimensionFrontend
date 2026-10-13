/*
 * Panel contextual derecho. Tres estados: «Atención ahora» en la vista general, el panel operativo de
 * Compras y un resumen para el resto de departamentos (su panel completo es próxima entrega).
 * El contenido sale y entra coordinado con el cambio de cámara (useSwap); en móvil se pliega.
 */
import { useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import {
    Activity,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    attention,
    departmentStatus,
    procurement,
    procurementStages,
} from './demo-data';
import type {
    DepartmentId,
    ProcurementRecord,
    ProcurementTab,
} from './demo-data';
import { formatAmount } from './format';
import { DepartmentIcon } from './icons';
import { PrototypeControl } from './prototype-control';
import { useSwap } from './use-swap';

type Props = {
    selected: string | null;
    reducedMotion: boolean;
    tab: ProcurementTab;
    onTab: (tab: ProcurementTab) => void;
    onSelect: (id: DepartmentId) => void;
};

export function ContextPanel({
    selected,
    reducedMotion,
    tab,
    onTab,
    onSelect,
}: Props) {
    const { shown, leaving } = useSwap(selected, reducedMotion ? 0 : 180);
    // En móvil la vista general arranca plegada para dejar ver el campus; un departamento se abre.
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const key = shown ?? 'overview';
    const open = expanded[key] ?? shown !== null;
    const toggle = () => setExpanded((value) => ({ ...value, [key]: !open }));
    return (
        <aside
            className="cc-panel"
            key={key}
            data-variant={
                shown === null
                    ? 'overview'
                    : shown === 'shared.procurement'
                      ? 'procurement'
                      : 'department'
            }
            data-leaving={leaving}
            data-collapsed={!open}
            aria-labelledby={`cc-panel-title-${key}`}
        >
            {shown === null ? (
                <AttentionPanel
                    titleId={`cc-panel-title-${key}`}
                    open={open}
                    onToggle={toggle}
                    onSelect={onSelect}
                />
            ) : shown === 'shared.procurement' ? (
                <ProcurementPanel
                    titleId={`cc-panel-title-${key}`}
                    open={open}
                    onToggle={toggle}
                    tab={tab}
                    onTab={onTab}
                />
            ) : (
                <DepartmentPanel
                    titleId={`cc-panel-title-${key}`}
                    id={shown as DepartmentId}
                    open={open}
                    onToggle={toggle}
                />
            )}
        </aside>
    );
}

/* Cabecera común; en móvil funciona como asa para plegar el panel. */
function PanelHeader({
    titleId,
    open,
    onToggle,
    icon,
    title,
    subtitle,
    large = false,
}: {
    titleId: string;
    open: boolean;
    onToggle: () => void;
    icon: ReactNode;
    title: string;
    subtitle?: ReactNode;
    large?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="cc-panel-header" data-large={large}>
            <span className="cc-panel-icon">{icon}</span>
            <div className="cc-panel-titles">
                <h2 id={titleId}>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <button
                type="button"
                className="cc-panel-toggle"
                aria-expanded={open}
                aria-label={t(open ? 'cc.collapsePanel' : 'cc.expandPanel')}
                onClick={onToggle}
            >
                <ChevronDown size={18} aria-hidden="true" />
            </button>
        </div>
    );
}

function AttentionPanel({
    titleId,
    open,
    onToggle,
    onSelect,
}: {
    titleId: string;
    open: boolean;
    onToggle: () => void;
    onSelect: (id: DepartmentId) => void;
}) {
    const { t } = useTranslation();
    return (
        <>
            <PanelHeader
                titleId={titleId}
                open={open}
                onToggle={onToggle}
                icon={
                    <Activity size={17} strokeWidth={1.7} aria-hidden="true" />
                }
                title={t('cc.attentionNow')}
            />
            <div className="cc-panel-body">
                <ul className="cc-attention" data-stagger="true">
                    {attention.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className="cc-attention-item"
                                onClick={() => onSelect(item.departmentId)}
                            >
                                <span
                                    className="cc-dot"
                                    data-tone="attention"
                                />
                                <DepartmentIcon
                                    id={item.departmentId}
                                    size={17}
                                />
                                <span>
                                    {t(item.labelKey, { count: item.count })}
                                </span>
                                <ChevronRight
                                    size={15}
                                    aria-hidden="true"
                                    className="cc-end"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="cc-panel-footer">
                    <span className="cc-demo-tag">{t('cc.demoData')}</span>
                    <PrototypeControl
                        label={t('cc.openPending')}
                        className="cc-link"
                        hint="bottom"
                    >
                        {t('cc.openPending')}
                        <ArrowRight size={14} aria-hidden="true" />
                    </PrototypeControl>
                </div>
            </div>
        </>
    );
}

const tabs: ProcurementTab[] = ['requests', 'orders', 'receptions'];

function ProcurementPanel({
    titleId,
    open,
    onToggle,
    tab,
    onTab,
}: {
    titleId: string;
    open: boolean;
    onToggle: () => void;
    tab: ProcurementTab;
    onTab: (tab: ProcurementTab) => void;
}) {
    const { t } = useTranslation();
    const records = procurement.records[tab];
    const [chosen, setChosen] = useState<Record<string, string>>({});
    const current =
        records.find((record) => record.id === chosen[tab]) ?? records[0];
    const moveTab = (event: KeyboardEvent, index: number) => {
        const delta =
            event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = tabs[(index + delta + tabs.length) % tabs.length];
        onTab(next);
        document.getElementById(`cc-tab-${next}`)?.focus();
    };
    return (
        <>
            <PanelHeader
                titleId={titleId}
                open={open}
                onToggle={onToggle}
                large
                icon={<DepartmentIcon id="shared.procurement" size={30} />}
                title={t('campus.shared.procurement')}
                subtitle={
                    <>
                        <strong>{procurement.pendingApproval}</strong>{' '}
                        {t('cc.pendingRequests', {
                            count: procurement.pendingApproval,
                        })}
                    </>
                }
            />
            <div className="cc-panel-body">
                <div
                    className="cc-tabs"
                    role="tablist"
                    aria-label={t('cc.procurementViews')}
                >
                    {tabs.map((entry, index) => (
                        <button
                            key={entry}
                            id={`cc-tab-${entry}`}
                            type="button"
                            role="tab"
                            aria-selected={tab === entry}
                            aria-controls="cc-tabpanel"
                            tabIndex={tab === entry ? 0 : -1}
                            onClick={() => onTab(entry)}
                            onKeyDown={(event) => moveTab(event, index)}
                        >
                            {t(`cc.tab.${entry}`)}
                            <span className="cc-tab-count">
                                {procurement.counts[entry]}
                            </span>
                        </button>
                    ))}
                </div>
                <div
                    id="cc-tabpanel"
                    role="tabpanel"
                    aria-labelledby={`cc-tab-${tab}`}
                    key={tab}
                    className="cc-tabpanel"
                >
                    <ul className="cc-records" data-stagger="true">
                        {records.map((record) => (
                            <li key={record.id}>
                                <button
                                    type="button"
                                    className="cc-record"
                                    aria-current={record.id === current.id}
                                    onClick={() =>
                                        setChosen((value) => ({
                                            ...value,
                                            [tab]: record.id,
                                        }))
                                    }
                                >
                                    <span
                                        className="cc-dot"
                                        data-tone="attention"
                                    />
                                    <span className="cc-record-title">
                                        {t(record.titleKey)}
                                    </span>
                                    <span className="cc-record-status">
                                        <span
                                            className="cc-dot"
                                            data-tone={record.tone}
                                        />
                                        {t(record.statusKey)}
                                    </span>
                                    <ChevronRight
                                        size={15}
                                        aria-hidden="true"
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <RecordDetail record={current} key={current.id} />
                    <ProcessTrack record={current} />
                </div>
                <span className="cc-demo-tag">{t('cc.demoData')}</span>
            </div>
        </>
    );
}

function RecordDetail({ record }: { record: ProcurementRecord }) {
    const { t, i18n } = useTranslation();
    const [notice, setNotice] = useState(false);
    return (
        <section className="cc-detail" aria-labelledby="cc-detail-title">
            <h3 id="cc-detail-title">{t(record.titleKey)}</h3>
            <p className="cc-detail-meta">
                <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />
                <span>
                    {t(`campus.${record.areaId}`)} · {record.requester}
                </span>
            </p>
            <p className="cc-detail-meta">
                <CircleDollarSign
                    size={18}
                    strokeWidth={1.6}
                    aria-hidden="true"
                />
                <span>
                    <strong>
                        {formatAmount(record.amount, i18n.language)}
                    </strong>{' '}
                    {t('cc.estimated')}
                </span>
            </p>
            <div className="cc-detail-actions">
                <button
                    type="button"
                    className="cc-primary"
                    onClick={() => setNotice(true)}
                >
                    {t('cc.reviewRequest')}
                </button>
                <PrototypeControl
                    label={t('cc.viewQuotes')}
                    className="cc-link"
                    hint="top"
                >
                    {t('cc.viewQuotes')}
                    <ArrowRight size={14} aria-hidden="true" />
                </PrototypeControl>
            </div>
            {/* La revisión no existe todavía: lo decimos en lugar de simular que se completó. */}
            <p role="status" className="cc-notice">
                {notice ? t('cc.reviewPrototype') : ''}
            </p>
        </section>
    );
}

function ProcessTrack({ record }: { record: ProcurementRecord }) {
    const { t } = useTranslation();
    const current = procurementStages.indexOf(record.stage);
    return (
        <section className="cc-process" aria-labelledby="cc-process-title">
            <h3 id="cc-process-title">{t('cc.process')}</h3>
            <ol style={{ '--cc-progress': current / 3 } as CSSProperties}>
                {procurementStages.map((stage, index) => (
                    <li
                        key={stage}
                        data-state={
                            index < current
                                ? 'done'
                                : index === current
                                  ? 'current'
                                  : 'next'
                        }
                        aria-current={index === current ? 'step' : undefined}
                    >
                        <span className="cc-step" aria-hidden="true">
                            {index < current && (
                                <Check size={12} strokeWidth={3} />
                            )}
                        </span>
                        {t(`cc.stage.${stage}`)}
                    </li>
                ))}
            </ol>
        </section>
    );
}

function DepartmentPanel({
    titleId,
    id,
    open,
    onToggle,
}: {
    titleId: string;
    id: DepartmentId;
    open: boolean;
    onToggle: () => void;
}) {
    const { t } = useTranslation();
    const status = departmentStatus[id];
    const name = t(`campus.${id}`);
    return (
        <>
            <PanelHeader
                titleId={titleId}
                open={open}
                onToggle={onToggle}
                large
                icon={<DepartmentIcon id={id} size={30} />}
                title={name}
                subtitle={
                    <>
                        <span className="cc-dot" data-tone={status.tone} />{' '}
                        {t(status.statusKey, { count: status.count })}
                    </>
                }
            />
            <div className="cc-panel-body">
                <p className="cc-placeholder">
                    {t('cc.departmentSoon', { name })}
                </p>
                <span className="cc-demo-tag">{t('cc.demoData')}</span>
            </div>
        </>
    );
}
