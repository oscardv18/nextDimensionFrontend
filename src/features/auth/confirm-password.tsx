import { PageTitle } from '@/features/shared/page-title';
import { MockForm } from './mock-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/design/forms/input-error';
import PasswordInput from '@/design/forms/password-input';
import { Button } from '@/design/ui/button';
import { Label } from '@/design/ui/label';
import { Spinner } from '@/design/ui/spinner';
import { routes } from '@/app/routes';
import { useNavigate } from 'react-router';

export default function ConfirmPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    function submit() {
        void navigate(routes.map());
    }

    return (
        <>
            <PageTitle title={t('Confirm password')} />

            <MockForm onSubmit={submit} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('Password')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder={t('Password')}
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                {t('Confirm password')}
                            </Button>
                        </div>
                    </div>
                )}
            </MockForm>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm password',
    description:
        'This is a secure area of the application. Please confirm your password before continuing.',
};
