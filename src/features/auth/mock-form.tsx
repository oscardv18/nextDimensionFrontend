import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

export type FormErrors = Record<string, string | undefined>;

/** Resultado de un envío simulado: errores por campo, o nada si fue bien. */
export type SubmitResult = { errors?: FormErrors } | void;

/**
 * Formulario local que sustituye al envío al servidor: muestra el estado «enviando» un instante,
 * entrega los datos a `onSubmit` y pinta los errores que devuelva. Solo diseño, sin red.
 */
export function MockForm({
    onSubmit,
    resetOnSuccess = [],
    className,
    children,
}: {
    onSubmit: (data: FormData) => SubmitResult | Promise<SubmitResult>;
    resetOnSuccess?: string[];
    className?: string;
    children: (state: { processing: boolean; errors: FormErrors }) => ReactNode;
}) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        setProcessing(true);
        setErrors({});
        await new Promise((resolve) => setTimeout(resolve, 350));
        const result = await onSubmit(new FormData(form));
        setProcessing(false);

        if (result?.errors) {
            setErrors(result.errors);
        } else {
            for (const name of resetOnSuccess) {
                const field = form.elements.namedItem(name);
                if (field instanceof HTMLInputElement) {
                    field.value = '';
                }
            }
        }
    }

    return (
        <form onSubmit={submit} className={className}>
            {children({ processing, errors })}
        </form>
    );
}
