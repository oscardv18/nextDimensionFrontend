// Mediciones de la cámara real en el canvas; no generan renderizados de React por fotograma.
export function recordCameraDiagnostic(
    canvas: HTMLCanvasElement,
    key: string,
    value: string,
) {
    canvas.dataset[key] = value;
}
