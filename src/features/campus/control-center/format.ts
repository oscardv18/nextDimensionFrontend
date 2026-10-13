// Importes de demostración en dólares con separadores del idioma activo (es-MX conserva «1,240» como
// la referencia aprobada). La moneda real llegará con el backend.
export function formatAmount(amount: number, locale: string) {
    const number = new Intl.NumberFormat(
        locale.startsWith('es') ? 'es-MX' : 'en-US',
        { maximumFractionDigits: 0 },
    ).format(amount);
    return `$${number}`;
}
