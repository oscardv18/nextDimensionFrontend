import { PageTitle } from '@/features/shared/page-title';
import { MockForm } from './mock-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/design/forms/input-error';
import PasswordInput from '@/design/forms/password-input';
import TextLink from '@/features/shared/text-link';
import { Button } from '@/design/ui/button';
import { Checkbox } from '@/design/ui/checkbox';
import { Input } from '@/design/ui/input';
import { Label } from '@/design/ui/label';
import { Spinner } from '@/design/ui/spinner';
import { routes } from '@/app/routes';
import { useNavigate, useLocation } from 'react-router';
import { DEMO_CREDENTIALS } from './mock-credentials';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // El aviso llega del restablecimiento de contraseña, que vuelve aquí con el estado de navegación.
    const status = (useLocation().state as { status?: string } | null)?.status;
    const canResetPassword = true;

    function submit(data: FormData) {
        if (
            data.get('email') === DEMO_CREDENTIALS.email &&
            data.get('password') === DEMO_CREDENTIALS.password
        ) {
            void navigate(routes.map());

            return;
        }

        return { errors: { email: t('auth.failed') } };
    }

    return (
        <>
            <PageTitle title={t('Log in')} />

            <MockForm
                onSubmit={submit}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('Email address')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={t('email@example.com')}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">
                                        {t('Password')}
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={routes.forgotPassword()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            {t('Forgot your password?')}
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('Password')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">
                                    {t('Remember me')}
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {t('Log in')}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t("Don't have an account?")}{' '}
                            <TextLink href={routes.register()} tabIndex={5}>
                                {t('Sign up')}
                            </TextLink>
                        </div>
                    </>
                )}
            </MockForm>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
