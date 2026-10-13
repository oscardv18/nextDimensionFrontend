/*
 * URL de la aplicación. Se conservan las del producto original para que el backend futuro encaje sin
 * cambios. Cada ruta es una función para que las que llevan parámetro y las que no se usen igual.
 */
export const routes = {
    home: () => '/',
    map: () => '/mapa',
    campus: () => '/campus-3d',
    department: (publicId: string) => `/departamentos/${publicId}`,
    login: () => '/login',
    register: () => '/register',
    forgotPassword: () => '/forgot-password',
    resetPassword: (token: string) => `/reset-password/${token}`,
    verifyEmail: () => '/email/verify',
    confirmPassword: () => '/user/confirm-password',
    profile: () => '/settings/profile',
    appearance: () => '/settings/appearance',
} as const;

/** Patrones para el enrutador (con parámetros). */
export const patterns = {
    department: '/departamentos/:publicId',
    resetPassword: '/reset-password/:token',
} as const;
