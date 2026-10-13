import { useTranslation } from 'react-i18next';
// Components
import { PageTitle } from '@/features/shared/page-title';
import { MockForm } from './mock-form';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/design/forms/input-error';
import TextLink from '@/features/shared/text-link';
import { Button } from '@/design/ui/button';
import { Input } from '@/design/ui/input';
import { Label } from '@/design/ui/label';
import { routes } from '@/app/routes';
import { useState } from 'react';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<string>();

    function submit() {
        setStatus(t('auth.resetLinkSent'));
    }

    return (
        <>
            <PageTitle title={t('Forgot password')} />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <MockForm onSubmit={submit}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('Email address')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder={t('email@example.com')}
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    {t('Email password reset link')}
                                </Button>
                            </div>
                        </>
                    )}
                </MockForm>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>
                    <TextLink href={routes.login()}>{t('log in')}</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
