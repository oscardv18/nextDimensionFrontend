import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Vitest no necesita el compilador de React ni Tailwind: solo el alias y jsdom.
export default defineConfig({
    resolve: {
        alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
