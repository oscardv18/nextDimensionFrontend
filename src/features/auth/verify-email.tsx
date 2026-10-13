import { useTranslation } from 'react-i18next';
// Components
import { PageTitle } from '@/features/shared/page-title';
import { MockForm } from './mock-form';
import TextLink from '@/features/shared/text-link';
import { Button } from '@/design/ui/button';
import { Spinner } from '@/design/ui/spinner';
import { routes } from '@/app/routes';
import { useState } from 'react';

export default function VerifyEmail() {
    const { t } = useTranslation();
    const [sent, setSent] = useState(false);

    function submit() {
        setSent(true);
    }

    return (
        <>
            <PageTitle title={t('Email verification')} />

            {sent && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {t(
                        'A new verification link has been sent to the email address you provided during registration.',
                    )}
                </div>
            )}

            <MockForm onSubmit={submit} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            {t('Resend verification email')}
                        </Button>

                        <TextLink
                            href={routes.login()}
                            className="mx-auto block text-sm"
                        >
                            {t('Log out')}
                        </TextLink>
                    </>
                )}
            </MockForm>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
