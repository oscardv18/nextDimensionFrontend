/** Credenciales del usuario de demostración. El envío es simulado: no hay sesión ni servidor. */
export const DEMO_CREDENTIALS = {
    email: 'test@example.com',
    password: 'password',
} as const;

/** Reglas de contraseña que el navegador ofrece al generador de contraseñas. */
export const PASSWORD_RULES = 'minlength: 8;';
