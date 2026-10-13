import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './catalogs/en.json';
import es from './catalogs/es.json';

/*
 * Un único catálogo por idioma. Las claves son planas (sin separadores) y usan la sintaxis de i18next:
 * {{variable}} y plurales con sufijos _one / _other. Las claves heredadas del starter usan su texto en
 * inglés como clave y no se reescriben.
 */
export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

const catalogs: Record<Locale, Record<string, string>> = { es, en };
const KEY = 'locale';

export function storedLocale(): Locale {
    try {
        const value = localStorage.getItem(KEY);

        return LOCALES.find((l) => l === value) ?? 'es';
    } catch {
        return 'es';
    }
}

export async function setupI18n(locale: Locale = storedLocale()) {
    await i18n.use(initReactI18next).init({
        lng: locale,
        resources: {
            es: { translation: catalogs.es },
            en: { translation: catalogs.en },
        },
        keySeparator: false,
        nsSeparator: false,
        interpolation: { escapeValue: false },
        returnNull: false,
    });
    document.documentElement.lang = locale;
}

export async function changeLanguage(locale: Locale): Promise<void> {
    try {
        localStorage.setItem(KEY, locale);
    } catch {
        // Sin almacenamiento: el idioma dura hasta recargar.
    }
    await i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
}

export default i18n;
