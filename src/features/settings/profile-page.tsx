import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/features/shared/page-title';
import { MockForm } from '@/features/auth/mock-form';
import { useAppShell } from '@/app/app-shell';
import Heading from '@/design/forms/heading';
import InputError from '@/design/forms/input-error';
import { Button } from '@/design/ui/button';
import { Input } from '@/design/ui/input';
import { Label } from '@/design/ui/label';

export default function Profile() {
    const { t } = useTranslation();
    // El envío es simulado: no hay a dónde guardar el cambio hasta que exista el backend.
    const { user } = useAppShell();
    if (!user) {
        return null;
    }

    return (
        <>
            <PageTitle title={t('Profile settings')} />

            <h1 className="sr-only">{t('Profile settings')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('Profile')}
                    description={t('Update your name and email address')}
                />

                <MockForm onSubmit={() => undefined} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('Name')}</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder={t('Full name')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('Email address')}
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={t('Email address')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('Save')}
                                </Button>
                            </div>
                        </>
                    )}
                </MockForm>
            </div>
        </>
    );
}
