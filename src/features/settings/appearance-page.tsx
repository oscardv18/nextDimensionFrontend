import { PageTitle } from '@/features/shared/page-title';
import { useTranslation } from 'react-i18next';
import {
    AccentPicker,
    ModeSegment,
    useMotionToggles,
} from '@/design/frame/appearance-controls';
import Heading from '@/design/forms/heading';
import { Switch } from '@/design/ui/switch';

/* Apariencia: los mismos controles que el menú de perfil y la configuración del marco (preferencias en este navegador). */
export default function Appearance() {
    const { t } = useTranslation();
    const toggles = useMotionToggles();

    return (
        <>
            <PageTitle title={t('Appearance settings')} />

            <div className="grid max-w-md gap-4">
                <Heading
                    variant="small"
                    title={t('Appearance settings')}
                    description={t(
                        'Update the appearance settings for your account',
                    )}
                />
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
                <p className="nota-p">{t('appearance.storedInBrowser')}</p>
            </div>
        </>
    );
}
