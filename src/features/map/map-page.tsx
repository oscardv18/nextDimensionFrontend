import { useLoaderData } from 'react-router';
import { PageTitle } from '@/features/shared/page-title';
import { openDepartment } from '@/app/navigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CompanyMap } from '@/design/map/company-map';
import {
    focusDepartmentLabel,
    getUi,
    isEditable,
    openOverlay,
    setUi,
} from '@/design/state/ui-state';
import type { OrganizationMapData } from '@/data/contracts';

export default function MapShow() {
    const { t } = useTranslation();
    const map = useLoaderData<OrganizationMapData | null>();

    /* Atajos del mapa: 1–9 seleccionan, Enter abre (en la etiqueta), Esc vuelve a la vista general */
    useEffect(() => {
        if (!map) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (openOverlay() || e.defaultPrevented) {
                    return;
                }
                const { selection, link } = getUi();
                if (selection || link) {
                    setUi({ selection: null, link: null });
                    if (selection) {
                        focusDepartmentLabel(selection);
                    }
                }
                return;
            }
            if (
                e.ctrlKey ||
                e.metaKey ||
                e.altKey ||
                isEditable(document.activeElement) ||
                openOverlay()
            ) {
                return;
            }
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= Math.min(9, map.departments.length)) {
                const id = map.departments[n - 1].publicId;
                setUi({ selection: id, link: null });
                focusDepartmentLabel(id);
            }
        };
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, [map]);

    /* Al volver desde un departamento, su etiqueta recupera el foco en cuanto el mapa está pintado */
    useEffect(() => {
        const { pendingFocus } = getUi();
        if (map && pendingFocus) {
            setUi({ pendingFocus: null });
            focusDepartmentLabel(pendingFocus);
        }
    }, [map]);

    /* Una selección de otra organización (escenario) no aplica a este mapa */
    useEffect(() => {
        const { selection } = getUi();
        if (
            map &&
            selection &&
            !map.departments.some((d) => d.publicId === selection)
        ) {
            setUi({ selection: null, link: null });
        }
    }, [map]);

    return (
        <>
            <PageTitle title={t('map.title')} />
            {map ? (
                <CompanyMap map={map} onOpenDepartment={openDepartment} />
            ) : (
                <div className="vacio grande" role="status">
                    <h1 style={{ margin: '0 0 6px', fontSize: 21 }}>
                        {t('map.emptyTitle')}
                    </h1>
                    <p style={{ margin: 0 }}>{t('map.emptyBody')}</p>
                </div>
            )}
        </>
    );
}
