import {
    Component,
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef,
} from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Box, FileText, Truck, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/design/appearance/use-appearance';
import { PageTitle } from '@/features/shared/page-title';
import { activeAsset } from './asset-bundle';
const { manifest, build } = activeAsset;
import { PerformanceTools } from './performance-tools';
import { campusGraphics } from './graphics-quality';
import type { Campus } from './asset';
import type { Annotation } from './campus-scene';
import { CommandBar } from './control-center/command-bar';
import { ContextPanel } from './control-center/context-panel';
import {
    departmentStatus,
    procurement,
    procurementHotspots,
} from './control-center/demo-data';
import type { DepartmentId, ProcurementTab } from './control-center/demo-data';
import { ModeDock } from './control-center/mode-dock';
import { SideRail } from './control-center/side-rail';
import { SpatialHotspot, SpatialLabel } from './control-center/spatial-label';
import { StatusStrip } from './control-center/status-strip';
import { ViewHeading } from './control-center/view-heading';
import './campus.css';
import './control-center/control-center.css';
import { useOverlayInsets } from './use-overlay-insets';
import type { OverlayRefs } from './use-overlay-insets';

const Viewer = lazy(() => import('./campus-viewer'));

const hotspotIcons = { requests: FileText, orders: Box, receptions: Truck };

class ViewerBoundary extends Component<
    { children: ReactNode; fallback: ReactNode; onError: () => void },
    { failed: boolean }
> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch() {
        this.props.onError();
    }
    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

export function supportsWebGL() {
    try {
        const context = document.createElement('canvas').getContext('webgl2');
        if (!context) return false;
        context.getExtension('WEBGL_lose_context')?.loseContext();
        return true;
    } catch {
        return false;
    }
}

/*
 * Centro de control espacial (Fase 3.0). La página conserva el estado de navegación de Fase 2.x
 * (selección, revisión, cubierta, diagnóstico) y compone el Shell flotante sobre el visor 3D.
 * El Shell nunca redimensiona el canvas: entrega sus medidas a la cámara como márgenes.
 */
export default function CampusPage() {
    const { t } = useTranslation();
    const { reducedMotion, resolvedAppearance } = useAppearance();
    const [webgl] = useState(supportsWebGL);
    const [failed, setFailed] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [roofHidden, setRoofHidden] = useState(false);
    const [revision, setRevision] = useState(0);
    const [settled, setSettled] = useState<{
        id: string;
        revision: number;
    } | null>(null);
    const [reservePanel, setReservePanel] = useState(false);
    const [debugOrbit, setDebugOrbit] = useState(false);
    const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
    const [procurementTab, setProcurementTab] =
        useState<ProcurementTab>('requests');
    const viewportRef = useRef<HTMLElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const railRef = useRef<HTMLDivElement>(null);
    const dockRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const diagnosticsRef = useRef<HTMLElement>(null);
    const reserveRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const overlays = useMemo<OverlayRefs>(
        () => [
            { side: 'top', ref: topRef },
            { side: 'left', ref: railRef },
            { side: 'bottom', ref: dockRef },
            { side: 'bottom', ref: statusRef },
            { side: 'bottom', ref: diagnosticsRef },
            { side: 'auto', ref: panelRef },
            { side: 'none', ref: headingRef },
            { side: 'none', ref: reserveRef },
        ],
        [],
    );
    const insets = useOverlayInsets(
        viewportRef,
        overlays,
        `${selected}:${reservePanel}`,
    );
    const [campus, setCampus] = useState<Campus | null>(null);
    const select = useCallback((id: string | null) => {
        setSelected(id);
        setRoofHidden(id !== null);
        setSettled(null);
        setRevision((value) => value + 1);
    }, []);
    const overview = useCallback(() => select(null), [select]);
    const moving = useCallback(
        (manual = false) =>
            setSettled(manual ? { id: 'manual', revision } : null),
        [revision],
    );
    const settle = useCallback(
        (id: string | null, revision: number) =>
            setSettled({ id: id ?? 'overview', revision }),
        [],
    );
    const fail = useCallback(() => setFailed(true), []);
    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            // Un menú o el buscador que consumen Escape no devuelven además la cámara.
            if (event.key === 'Escape' && !event.defaultPrevented) select(null);
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [select]);
    const renderLabel = useCallback(
        (id: string) => {
            const status = departmentStatus[id as DepartmentId];
            return (
                <SpatialLabel
                    id={id}
                    name={t(`campus.${id}`)}
                    status={
                        status
                            ? t(status.statusKey, { count: status.count })
                            : ''
                    }
                    tone={status?.tone ?? 'neutral'}
                />
            );
        },
        [t],
    );
    // Los puntos del interior solo tienen sentido con la cubierta retirada.
    const annotations = useMemo<Annotation[]>(
        () =>
            procurementHotspots.every(({ nodeId }) =>
                activeAsset.manifest.zoneAnchors?.procurement?.includes(nodeId),
            ) &&
            selected === 'shared.procurement' &&
            roofHidden
                ? procurementHotspots.map(({ tab, nodeId }) => ({
                      id: tab,
                      active: procurementTab === tab,
                      nodeId,
                      label: `${t(`cc.tab.${tab}`)}: ${procurement.counts[tab]}`,
                      onSelect: () => setProcurementTab(tab),
                      content: (
                          <SpatialHotspot
                              label={t(`cc.tab.${tab}`)}
                              count={procurement.counts[tab]}
                              icon={hotspotIcons[tab]}
                              active={procurementTab === tab}
                          />
                      ),
                  }))
                : [],
        [selected, roofHidden, procurementTab, t],
    );
    const fallback = (
        <p role="status" className="campus-fallback">
            {t('campus.fallback')}
        </p>
    );
    const available = webgl && !failed;
    const view =
        selected === null
            ? 'overview'
            : selected === 'shared.procurement'
              ? 'procurement'
              : 'department';
    return (
        <main
            className="campus-page cc-root"
            data-tone={resolvedAppearance}
            data-performance-blur={
                import.meta.env.DEV && !campusGraphics.blur ? 'off' : undefined
            }
            data-view={view}
            data-ready={!available || campus !== null}
        >
            <PageTitle title={t('cc.controlCenter')} />
            <section
                ref={viewportRef}
                className="campus-viewport"
                aria-label={t('campus.viewport')}
                data-testid="campus-viewport"
                data-mode={available ? '3d' : 'fallback'}
                data-camera={
                    settled?.revision === revision ? settled.id : 'moving'
                }
                data-navigation={
                    !available
                        ? selected
                            ? 'focused'
                            : 'overview'
                        : settled?.revision !== revision
                          ? 'transition'
                          : settled.id === 'manual'
                            ? 'manual'
                            : settled.id === 'overview'
                              ? 'overview'
                              : 'focused'
                }
                data-reserve={reservePanel}
                data-orbit={debugOrbit}
                data-roof={roofHidden ? 'hidden' : 'visible'}
                style={
                    {
                        '--campus-ui-top': `${insets.top}px`,
                        '--campus-ui-bottom': `${insets.bottom}px`,
                    } as CSSProperties
                }
            >
                {available ? (
                    <ViewerBoundary fallback={fallback} onError={fail}>
                        <Suspense
                            fallback={
                                <p role="status">{t('campus.loading')}</p>
                            }
                        >
                            <Viewer
                                theme={resolvedAppearance}
                                selected={selected}
                                roofHidden={roofHidden}
                                revision={revision}
                                reservePanel={reservePanel}
                                insets={insets}
                                regions={insets.regions}
                                debugOrbit={debugOrbit}
                                reducedMotion={reducedMotion}
                                onSelect={select}
                                onSettled={settle}
                                onMoving={moving}
                                onReady={setCampus}
                                onError={fail}
                                renderLabel={renderLabel}
                                annotations={annotations}
                            />
                        </Suspense>
                    </ViewerBoundary>
                ) : (
                    fallback
                )}
                {available && reservePanel && (
                    <div
                        className="campus-panel-reserve"
                        ref={reserveRef}
                        aria-hidden="true"
                    >
                        {t('campus.panelSpace')}
                    </div>
                )}
            </section>
            {/* Viñeta: integra las capas con la escena sin tapar la interacción. */}
            <div className="cc-vignette" aria-hidden="true" />

            <div className="cc-slot-top" ref={topRef}>
                <CommandBar
                    departments={manifest.departmentIds}
                    onSelect={select}
                    onOpenDiagnostics={() => setDiagnosticsOpen(true)}
                />
            </div>
            <div className="cc-slot-rail" ref={railRef}>
                <SideRail onOverview={overview} />
            </div>
            <div className="cc-slot-heading" ref={headingRef}>
                <ViewHeading
                    selected={selected}
                    onOverview={overview}
                    interior={
                        selected
                            ? {
                                  hidden: roofHidden,
                                  disabled: !available || !campus,
                                  onToggle: () =>
                                      setRoofHidden((value) => !value),
                              }
                            : undefined
                    }
                />
            </div>
            <div className="cc-slot-panel" ref={panelRef} data-view={view}>
                <ContextPanel
                    selected={selected}
                    reducedMotion={reducedMotion}
                    tab={procurementTab}
                    onTab={setProcurementTab}
                    onSelect={select}
                />
            </div>
            <div className="cc-slot-dock" ref={dockRef}>
                <ModeDock overview={selected === null} onOverview={overview} />
            </div>
            <div className="cc-slot-status" ref={statusRef}>
                <StatusStrip>
                    <aside
                        className="campus-diagnostics"
                        ref={diagnosticsRef}
                        aria-label={t('campus.diagnostics')}
                        data-open={diagnosticsOpen}
                    >
                        <div className="campus-diagnostics-bar">
                            <button
                                className="cc-ghost"
                                aria-expanded={diagnosticsOpen}
                                aria-controls="campus-diagnostics-body"
                                onClick={() =>
                                    setDiagnosticsOpen((value) => !value)
                                }
                            >
                                <Wrench size={14} aria-hidden="true" />
                                {t(
                                    diagnosticsOpen
                                        ? 'campus.hideDiagnostics'
                                        : 'campus.showDiagnostics',
                                )}
                            </button>
                            <p role="status" data-testid="campus-selection">
                                {selected
                                    ? t(`campus.${selected}`)
                                    : t('campus.overview')}
                            </p>
                        </div>
                        <div
                            id="campus-diagnostics-body"
                            className="campus-diagnostics-body"
                            hidden={!diagnosticsOpen}
                        >
                            <p>{t('campus.intro')}</p>
                            {import.meta.env.DEV && <PerformanceTools />}
                            <Link to="/mapa">{t('campus.oldMap')}</Link>
                            <nav
                                aria-label={t('campus.departments')}
                                className="campus-controls"
                            >
                                <button
                                    onClick={overview}
                                    aria-pressed={selected === null}
                                >
                                    {t('campus.overview')}
                                </button>
                                {manifest.interactions.map((entry) => (
                                    <button
                                        key={entry.id}
                                        onClick={() =>
                                            select(entry.departmentId)
                                        }
                                        aria-pressed={
                                            selected === entry.departmentId
                                        }
                                    >
                                        {t(`campus.${entry.departmentId}`)}
                                    </button>
                                ))}
                                <button
                                    disabled={
                                        !available || !campus || !selected
                                    }
                                    onClick={() =>
                                        setRoofHidden((value) => !value)
                                    }
                                    aria-pressed={roofHidden}
                                >
                                    {t(
                                        roofHidden
                                            ? 'campus.restoreRoof'
                                            : 'campus.hideRoof',
                                    )}
                                </button>
                            </nav>
                            <div className="campus-options">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={reservePanel}
                                        disabled={!available}
                                        onChange={(event) =>
                                            setReservePanel(
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    {t('campus.reservePanel')}
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={debugOrbit}
                                        disabled={!available}
                                        onChange={(event) =>
                                            setDebugOrbit(event.target.checked)
                                        }
                                    />
                                    {t('campus.debugOrbit')}
                                </label>
                            </div>
                            <p>
                                {t(
                                    available
                                        ? debugOrbit
                                            ? 'campus.debugHelp'
                                            : 'campus.help'
                                        : 'campus.fallbackHelp',
                                )}
                            </p>
                            {available && campus && (
                                <details>
                                    <summary>{t('campus.inspection')}</summary>
                                    <p>
                                        {manifest.assetId} ·{' '}
                                        {manifest.assetVersion} ·{' '}
                                        {campus.nodes.size} {t('campus.nodes')}
                                    </p>
                                    <code>SHA-256: {build.metrics.sha256}</code>
                                </details>
                            )}
                        </div>
                    </aside>
                </StatusStrip>
            </div>
        </main>
    );
}
