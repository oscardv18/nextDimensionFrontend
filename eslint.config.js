// Control de calidad del frontend. Además de las reglas de código, hace cumplir las capas:
// design no conoce el enrutador, los datos, las funciones ni la aplicación.
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const restricted = (group, message) => ({ group, message });

export default defineConfig([
    globalIgnores([
        'dist',
        'node_modules',
        'test-results',
        'playwright-report',
        'src/design/ui/**', // generados por la CLI de shadcn
        'src/data/contracts/**', // copia del contrato generado desde los DTO PHP
    ]),
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: { react, 'react-hooks': reactHooks },
        languageOptions: { globals: { ...globals.browser } },
        settings: { react: { version: 'detect' } },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.flat.recommended.rules,
            'react/prop-types': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
            ],
        },
    },
    {
        files: ['e2e/**/*.ts', 'scripts/**/*.mjs', '*.config.{js,ts}'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ['src/features/campus/campus-scene.tsx'],
        // R3F define elementos propios de Three.js, ajenos a los atributos DOM.
        rules: { 'react/no-unknown-property': 'off' },
    },
    // Capa design: recibe datos y callbacks por props. Solo puede importar tipos del contrato.
    {
        files: ['src/design/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        restricted(
                            ['react-router', 'react-router-dom'],
                            'design no conoce el enrutador: recibe callbacks y enlaces por props.',
                        ),
                        restricted(
                            ['@/app', '@/app/*', '**/app/*'],
                            'design no importa la aplicación.',
                        ),
                        restricted(
                            ['@/features', '@/features/*', '**/features/*'],
                            'design no importa funciones.',
                        ),
                        restricted(
                            [
                                '@/data/sources',
                                '@/data/sources/*',
                                '**/data/sources/*',
                            ],
                            'design recibe los datos por props; solo puede importar tipos de @/data/contracts.',
                        ),
                        restricted(
                            ['@/i18n/*', '**/i18n/*'],
                            'design usa react-i18next; la configuración de idioma es de la aplicación.',
                        ),
                    ],
                },
            ],
            // Del contrato solo se permiten tipos.
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/data/contracts', '@/data/contracts/*'],
                            allowTypeImports: true,
                            message:
                                'design solo puede importar tipos de @/data/contracts.',
                        },
                    ],
                },
            ],
        },
    },
    // Capa data: no conoce la interfaz.
    {
        files: ['src/data/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        restricted(
                            ['@/design', '@/design/*', '**/design/*'],
                            'data no importa la interfaz.',
                        ),
                        restricted(
                            ['@/features', '@/features/*', '**/features/*'],
                            'data no importa funciones.',
                        ),
                        restricted(
                            ['@/app', '@/app/*', '**/app/*'],
                            'data no importa la aplicación.',
                        ),
                        restricted(
                            ['react', 'react-router', 'react-dom'],
                            'data no depende de React.',
                        ),
                    ],
                },
            ],
        },
    },
]);
