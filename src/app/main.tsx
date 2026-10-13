import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { initializeTheme } from '@/design/appearance/use-appearance';
import { setupI18n } from '@/i18n/setup';
import '@/design/styles/app.css';
import { Providers } from './providers';
import { router } from './router';

// El script de index.html ya dejó el tema y el acento pintados; aquí solo se siguen sus cambios.
initializeTheme();
await setupI18n();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    </StrictMode>,
);
