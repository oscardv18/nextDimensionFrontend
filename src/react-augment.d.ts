import 'react';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- la fusión de interfaces exige el mismo parámetro
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}
