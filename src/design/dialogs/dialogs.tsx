/* Diálogos del marco portados del prototipo: atajos (?), configuración y departamentos. */
import { useTranslation } from 'react-i18next';
import {
    DemoBadge,
    DepartmentIcon,
    StatusChip,
    hueColor,
} from '@/design/common';
import {
    AccentPicker,
    ModeSegment,
    useMotionToggles,
} from '@/design/frame/appearance-controls';
import type { DepartmentDirectoryData, MapContextData } from '@/data/contracts';
import { setUi, useUi } from '@/design/state/ui-state';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/design/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/design/ui/sheet';
import { Switch } from '@/design/ui/switch';

const close = (open: boolean) => !open && setUi({ dialog: null });

export function ShortcutsDialog() {
    const { t } = useTranslation();
    const open = useUi((s) => s.dialog === 'shortcuts');
    const groups: [string, [string, string][]][] = [
        [
            t('shortcuts.navigation'),
            [
                ['M', t('shortcuts.map')],
                ['1 – 9', t('shortcuts.selectNth')],
                ['← ↑ → ↓', t('shortcuts.arrows')],
                ['Enter', t('shortcuts.enter')],
                ['Esc', t('shortcuts.escape')],
            ],
        ],
        [
            t('shortcuts.panels'),
            [
                ['C', t('shortcuts.layers')],
                ['P', t('shortcuts.pause')],
                ['?', t('shortcuts.help')],
            ],
        ],
    ];

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="dialogo vidrio sm:max-w-[720px]">
                <DialogTitle>{t('shortcuts.title')}</DialogTitle>
                <DialogDescription>
                    {t('shortcuts.description')}
                </DialogDescription>
                {groups.map(([group, list]) => (
                    <section key={group}>
                        <h3 className="h3">{group}</h3>
                        <dl className="atajos">
                            {list.map(([keys, text]) => (
                                <div key={keys}>
                                    <dt>
                                        {keys
                                            .split(' ')
                                            .map((k, i) =>
                                                k === '–' ? (
                                                    <span key={i}> – </span>
                                                ) : (
                                                    <kbd key={i}>{k}</kbd>
                                                ),
                                            )}
                                    </dt>
                                    <dd>{text}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
                <p className="nota-p">{t('shortcuts.soon')}</p>
            </DialogContent>
        </Dialog>
    );
}

export function SettingsSheet() {
    const { t } = useTranslation();
    const open = useUi((s) => s.dialog === 'settings');
    const toggles = useMotionToggles();

    return (
        <Sheet open={open} onOpenChange={close}>
            <SheetContent
                side="right"
                className="cajon-vidrio w-full sm:max-w-[400px]"
            >
                <div className="det-cuerpo">
                    <SheetTitle className="t-cajon">
                        {t('settings.title')}
                    </SheetTitle>
                    <SheetDescription>
                        {t('settings.description')}
                    </SheetDescription>
                    <h3 className="h3">{t('appearance.mode')}</h3>
                    <ModeSegment size={15} />
                    <h3 className="h3">{t('appearance.accent')}</h3>
                    <AccentPicker className="acentos" />
                    <p className="nota-p">{t('appearance.accentHelp')}</p>
                    <h3 className="h3">{t('settings.motionAndMaterials')}</h3>
                    {toggles.map((toggle) => (
                        <label key={toggle.key} className="capa-fila">
                            <span>
                                <b>{toggle.label}</b>
                                <small>{toggle.help}</small>
                            </span>
                            <Switch
                                checked={toggle.value}
                                onCheckedChange={toggle.set}
                                aria-label={toggle.label}
                            />
                        </label>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}

export function DepartmentsSheet({
    directory,
    context,
    onOpenDepartment,
}: {
    directory: DepartmentDirectoryData | null;
    context: MapContextData | null;
    onOpenDepartment: (publicId: string) => void;
}) {
    const { t } = useTranslation();
    const open = useUi((s) => s.dialog === 'departments');

    return (
        <Sheet open={open && !!directory} onOpenChange={close}>
            <SheetContent
                side="left"
                className="cajon-vidrio w-full sm:max-w-[400px]"
            >
                {directory && (
                    <div className="det-cuerpo">
                        <SheetTitle className="t-cajon">
                            {t('nav.departments')}
                        </SheetTitle>
                        <SheetDescription>
                            {t('departments.byZone', {
                                organization: context?.organizationName ?? '',
                            })}
                            {context?.isDemo && (
                                <>
                                    {' '}
                                    · <DemoBadge />
                                </>
                            )}
                        </SheetDescription>
                        {directory.zones.map((zone) => {
                            const list = directory.departments.filter(
                                (d) => d.zoneKey === zone.key,
                            );
                            if (!list.length) {
                                return null;
                            }
                            return (
                                <section key={zone.key}>
                                    <h3 className="h3">{zone.name}</h3>
                                    {list.map((d) => (
                                        <button
                                            key={d.publicId}
                                            className="fila-lista"
                                            style={{
                                                ['--c' as string]: hueColor(
                                                    d.hue,
                                                ),
                                            }}
                                            onClick={() => {
                                                setUi({ dialog: null });
                                                onOpenDepartment(d.publicId);
                                            }}
                                        >
                                            <DepartmentIcon icon={d.icon} />
                                            <span>
                                                <b>{d.name}</b>
                                                <small>{d.summary}</small>
                                            </span>
                                            <StatusChip
                                                tone={d.worstTone}
                                                text={`${d.pendingTotal}`}
                                            />
                                        </button>
                                    ))}
                                </section>
                            );
                        })}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
