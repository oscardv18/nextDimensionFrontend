import { PageTitle } from '@/features/shared/page-title';
import { MockForm } from './mock-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/design/forms/input-error';
import PasswordInput from '@/design/forms/password-input';
import { Button } from '@/design/ui/button';
import { Input } from '@/design/ui/input';
import { Label } from '@/design/ui/label';
import { Spinner } from '@/design/ui/spinner';
import { routes } from '@/app/routes';
import { useNavigate, useSearchParams } from 'react-router';
import { PASSWORD_RULES } from './mock-credentials';

export default function ResetPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Como en el enlace del correo, el correo viaja en la consulta (el token va en la ruta).
    const email = useSearchParams()[0].get('email') ?? '';
    const passwordRules = PASSWORD_RULES;

    function submit() {
        void navigate(routes.login(), {
            state: { status: t('auth.passwordReset') },
        });
    }

    return (
        <>
            <PageTitle title={t('Reset password')} />

            <MockForm
                onSubmit={submit}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('Email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('Password')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder={t('Password')}
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t('Confirm password')}
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder={t('Confirm password')}
                                passwordrules={passwordRules}
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            {t('Reset password')}
                        </Button>
                    </div>
                )}
            </MockForm>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
