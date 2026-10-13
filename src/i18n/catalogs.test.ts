import { describe, expect, it } from 'vitest';
import en from './catalogs/en.json';
import es from './catalogs/es.json';

describe('catálogos de idioma', () => {
    it('es y en tienen exactamente las mismas claves', () => {
        const enKeys = Object.keys(en).sort();
        const esKeys = Object.keys(es).sort();

        expect(esKeys.filter((k) => !(k in en))).toEqual([]);
        expect(enKeys.filter((k) => !(k in es))).toEqual([]);
        expect(esKeys).toEqual(enKeys);
    });

    it('ninguna traducción está vacía y las variables coinciden', () => {
        const variables = (text: string) =>
            [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

        for (const [key, value] of Object.entries(es)) {
            const other = (en as Record<string, string>)[key];
            expect(value.trim(), `es: ${key}`).not.toBe('');
            expect(other.trim(), `en: ${key}`).not.toBe('');
            expect(variables(value), `variables de ${key}`).toEqual(
                variables(other),
            );
        }
    });
});
