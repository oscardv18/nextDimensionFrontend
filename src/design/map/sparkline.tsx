/* Sparkline del prototipo (src/graficos/Graficos.tsx): línea y área en SVG propio, sin librería de gráficos. */
export function Sparkline({
    values,
    label,
}: {
    values: number[];
    label: string;
}) {
    const W = 104,
        H = 36,
        max = Math.max(1, ...values),
        min = Math.min(...values),
        x = (i: number) => (i * W) / (values.length - 1),
        y = (v: number) =>
            H - 3 - ((v - min) / Math.max(1, max - min)) * (H - 8);
    const line = values
        .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');

    return (
        <svg
            className="spark"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={label}
        >
            <polygon className="spark-a" points={`0,${H} ${line} ${W},${H}`} />
            <polyline className="spark-l" points={line} />
        </svg>
    );
}
