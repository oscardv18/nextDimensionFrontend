import { createBrowserRouter, redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import ConfirmPassword from '@/features/auth/confirm-password';
import ForgotPassword from '@/features/auth/forgot-password';
import Login from '@/features/auth/login';
import Register from '@/features/auth/register';
import ResetPassword from '@/features/auth/reset-password';
import VerifyEmail from '@/features/auth/verify-email';
import DepartmentShow from '@/features/departments/department-page';
import MapShow from '@/features/map/map-page';
import AppearanceSettings from '@/features/settings/appearance-page';
import Profile from '@/features/settings/profile-page';
import { dataSource } from './data-source';
import AuthLayout from './layouts/auth-layout';
import FrameLayout from './layouts/frame-layout';
import SettingsLayout from './layouts/settings-layout';
import { bindRouter } from './navigation';
import { NotFound } from './not-found';
import { Root } from './root';
import { patterns, routes } from './routes';
import { loadShell } from './shell-loader';

async function departmentLoader({ params }: LoaderFunctionArgs) {
    const page = await dataSource.getDepartment(params.publicId ?? '');
    if (!page) {
        throw new Response('Not found', { status: 404 });
    }

    return page;
}

/*
 * El marco (FrameLayout) es una única ruta padre: pasar del mapa al departamento o a los ajustes
 * no lo remonta, igual que el layout persistente del producto original.
 */
export const router = createBrowserRouter([
    {
        id: 'root',
        path: '/',
        Component: Root,
        loader: loadShell,
        ErrorBoundary: NotFound,
        children: [
            { index: true, loader: () => redirect(routes.campus()) },
            {
                path: routes.campus(),
                lazy: async () => ({
                    Component: (await import('@/features/campus/campus-page'))
                        .default,
                }),
            },
            {
                Component: FrameLayout,
                children: [
                    {
                        path: routes.map(),
                        Component: MapShow,
                        loader: () => dataSource.getMap(),
                    },
                    {
                        path: patterns.department,
                        Component: DepartmentShow,
                        loader: departmentLoader,
                    },
                    {
                        Component: SettingsLayout,
                        children: [
                            { path: routes.profile(), Component: Profile },
                            {
                                path: routes.appearance(),
                                Component: AppearanceSettings,
                            },
                        ],
                    },
                ],
            },
            {
                Component: AuthLayout,
                children: [
                    {
                        path: routes.login(),
                        Component: Login,
                        handle: Login.layout,
                    },
                    {
                        path: routes.register(),
                        Component: Register,
                        handle: Register.layout,
                    },
                    {
                        path: routes.forgotPassword(),
                        Component: ForgotPassword,
                        handle: ForgotPassword.layout,
                    },
                    {
                        path: patterns.resetPassword,
                        Component: ResetPassword,
                        handle: ResetPassword.layout,
                    },
                    {
                        path: routes.verifyEmail(),
                        Component: VerifyEmail,
                        handle: VerifyEmail.layout,
                    },
                    {
                        path: routes.confirmPassword(),
                        Component: ConfirmPassword,
                        handle: ConfirmPassword.layout,
                    },
                ],
            },
            { path: '*', Component: NotFound },
        ],
    },
]);

bindRouter(router);
