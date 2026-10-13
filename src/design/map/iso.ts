import type { BuildingType } from '@/data/contracts';

/* Portado sin cambios de geometría del prototipo aprobado (UI-Design/prototipo/src/mapa/iso.ts).
   Los arquetipos usan los valores del contrato BuildingType (App\\Core\\OrganizationMap\\Enums).

   Geometría 2.5D: proyección isométrica y edificios vectoriales por arquetipo.
   Mundo: x hacia abajo-derecha, y hacia abajo-izquierda, z hacia arriba (1 unidad = 1 px a escala 1).
   Caras visibles: techo (t), frente izquierdo (plano y = máx; l) y frente derecho (plano x = máx; r). Los colores salen de
   tokens CSS (--muro-*, --techo-*, --ventana…), así el mismo edificio sirve en modo claro y oscuro y con cualquier acento. */
export const COS = Math.cos(Math.PI / 6),
    SEN = 0.5;
export type P2 = [number, number];
export const P = (x: number, y: number, z = 0): P2 => [
    (x - y) * COS,
    (x + y) * SEN - z,
];
const f = (n: number) => Math.round(n * 10) / 10;
export const pts = (a: P2[]) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(' ');
const poli = (cls: string, a: P2[]) =>
    `<polygon class="${cls}" points="${pts(a)}"/>`;

/* Rectángulo redondeado en el plano del suelo (para losas y halos), muestreado en polígono */
export function rectRedondo(
    cx: number,
    cy: number,
    w: number,
    d: number,
    r: number,
    z = 0,
): P2[] {
    const out: P2[] = [],
        esq: [number, number, number][] = [
            [cx + w / 2 - r, cy - d / 2 + r, -90],
            [cx + w / 2 - r, cy + d / 2 - r, 0],
            [cx - w / 2 + r, cy + d / 2 - r, 90],
            [cx - w / 2 + r, cy - d / 2 + r, 180],
        ];
    for (const [x, y, a0] of esq)
        for (let k = 0; k <= 5; k++) {
            const a = ((a0 + k * 18) * Math.PI) / 180;
            out.push(P(x + Math.cos(a) * r, y + Math.sin(a) * r, z));
        }
    return out;
}
/* Caja: x0..x0+w, y0..y0+d, z0..z0+h */
function caja(
    x0: number,
    y0: number,
    z0: number,
    w: number,
    d: number,
    h: number,
    c = '',
) {
    const x1 = x0 + w,
        y1 = y0 + d,
        z1 = z0 + h;
    return (
        poli(`m-l ${c}`, [
            P(x0, y1, z0),
            P(x1, y1, z0),
            P(x1, y1, z1),
            P(x0, y1, z1),
        ]) +
        poli(`m-r ${c}`, [
            P(x1, y0, z0),
            P(x1, y1, z0),
            P(x1, y1, z1),
            P(x1, y0, z1),
        ]) +
        poli(`m-t ${c}`, [
            P(x0, y0, z1),
            P(x1, y0, z1),
            P(x1, y1, z1),
            P(x0, y1, z1),
        ])
    );
}
/* Techo con pretil: borde claro y superficie interior */
function techo(x0: number, y0: number, w: number, d: number, z: number, b = 7) {
    return poli('techo-int', [
        P(x0 + b, y0 + b, z + 0.2),
        P(x0 + w - b, y0 + b, z + 0.2),
        P(x0 + w - b, y0 + d - b, z + 0.2),
        P(x0 + b, y0 + d - b, z + 0.2),
    ]);
}
/* Vanos (ventanas, puertas, paneles) sobre el frente izquierdo (plano y) o derecho (plano x) */
const vanoL = (
    cls: string,
    y: number,
    xa: number,
    xb: number,
    za: number,
    zb: number,
) =>
    poli(cls, [
        P(xa, y + 0.3, za),
        P(xb, y + 0.3, za),
        P(xb, y + 0.3, zb),
        P(xa, y + 0.3, zb),
    ]);
const vanoR = (
    cls: string,
    x: number,
    ya: number,
    yb: number,
    za: number,
    zb: number,
) =>
    poli(cls, [
        P(x + 0.3, ya, za),
        P(x + 0.3, yb, za),
        P(x + 0.3, yb, zb),
        P(x + 0.3, ya, zb),
    ]);
function filaL(
    cls: string,
    y: number,
    xa: number,
    xb: number,
    n: number,
    za: number,
    zb: number,
    hueco = 6,
) {
    const w = (xb - xa - hueco * (n - 1)) / n;
    let s = '';
    for (let i = 0; i < n; i++)
        s += vanoL(
            cls,
            y,
            xa + i * (w + hueco),
            xa + i * (w + hueco) + w,
            za,
            zb,
        );
    return s;
}
function filaR(
    cls: string,
    x: number,
    ya: number,
    yb: number,
    n: number,
    za: number,
    zb: number,
    hueco = 6,
) {
    const w = (yb - ya - hueco * (n - 1)) / n;
    let s = '';
    for (let i = 0; i < n; i++)
        s += vanoR(
            cls,
            x,
            ya + i * (w + hueco),
            ya + i * (w + hueco) + w,
            za,
            zb,
        );
    return s;
}
/* Cilindro vertical (chimeneas, silos) */
function cilindro(x: number, y: number, z0: number, r: number, h: number) {
    const [cx, yb] = P(x, y, z0),
        yt = yb - h,
        rx = r * 1.2247,
        ry = r * 0.7071;
    return `<path class="cil" d="M${f(cx - rx)} ${f(yt)} L${f(cx - rx)} ${f(yb)} A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(yb)} L${f(cx + rx)} ${f(yt)} Z"/><ellipse class="cil-t" cx="${f(cx)}" cy="${f(yt)}" rx="${f(rx)}" ry="${f(ry)}"/><ellipse class="cil-b" cx="${f(cx)}" cy="${f(yt)}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.55)}"/>`;
}
const equipo = (x: number, y: number, z: number, w = 20, d = 16, h = 9) =>
    caja(x, y, z, w, d, h, 'equipo');
const claraboya = (x: number, y: number, z: number, w: number, d: number) =>
    caja(x, y, z, w, d, 3, 'claraboya');
function cajas(x: number, y: number, z: number) {
    return (
        caja(x, y, z, 16, 14, 11, 'caja-c') +
        caja(x + 18, y + 2, z, 14, 13, 10, 'caja-c') +
        caja(x + 6, y + 1, z + 11, 14, 12, 9, 'caja-c')
    );
}

export type Arquetipo = BuildingType;
export const LOSA = 128; /* media losa: radio de la base de cada departamento */
const Z = 12; /* altura de la losa */

/* Volumen de cada arquetipo sobre su losa. Devuelve el SVG y la altura máxima (para anclar la etiqueta) */
function volumen(tipo: Arquetipo): { svg: string; alto: number } {
    let s = '',
        alto = 70;
    switch (tipo) {
        case 'factory': {
            alto = 66;
            s +=
                caja(-100, -68, Z, 190, 140, 66) +
                techo(-100, -68, 190, 140, Z + 66);
            s +=
                cilindro(-46, -56, Z + 66, 8, 38) +
                cilindro(-70, -38, Z + 66, 9, 46);
            for (let i = 0; i < 4; i++)
                s += claraboya(-30 + i * 28, -50, Z + 66, 14, 92);
            s +=
                filaL('ventana acento', 72, -88, 78, 6, Z + 36, Z + 52) +
                filaR('puerta', 90, -50, 58, 3, Z, Z + 34, 12);
            alto = 112;
            break;
        }
        case 'warehouse': {
            alto = 72;
            s +=
                caja(-86, -76, Z, 172, 152, 72) +
                techo(-86, -76, 172, 152, Z + 72);
            s +=
                claraboya(-50, -46, Z + 72, 26, 18) +
                claraboya(-6, -46, Z + 72, 26, 18) +
                claraboya(-50, 4, Z + 72, 26, 18) +
                claraboya(-6, 4, Z + 72, 26, 18);
            s +=
                vanoL('marco acento', 76, -74, -26, Z, Z + 44) +
                vanoL('puerta', 76, -70, -30, Z, Z + 40) +
                vanoL('marco acento', 76, -12, 36, Z, Z + 44) +
                vanoL('puerta', 76, -8, 32, Z, Z + 40);
            s +=
                filaR('ventana', 86, -56, 50, 3, Z + 40, Z + 54) +
                vanoR('marco acento', 86, -10, 30, Z, Z + 34) +
                vanoR('puerta', 86, -7, 27, Z, Z + 31);
            s += cajas(-100, 84, Z) + cajas(-60, 94, Z);
            break;
        }
        case 'office': {
            alto = 98;
            s +=
                caja(-78, -70, Z, 156, 140, 98) +
                techo(-78, -70, 156, 140, Z + 98);
            s +=
                equipo(-40, -40, Z + 98) +
                equipo(10, -30, Z + 98, 24, 18) +
                equipo(-20, 20, Z + 98);
            for (let r = 0; r < 3; r++) {
                s += filaL(
                    'ventana',
                    70,
                    -66,
                    66,
                    5,
                    Z + 18 + r * 26,
                    Z + 36 + r * 26,
                );
                s += filaR(
                    'ventana',
                    78,
                    -58,
                    58,
                    4,
                    Z + 18 + r * 26,
                    Z + 36 + r * 26,
                );
            }
            s += vanoR('cristal', 78, -14, 14, Z, Z + 14);
            break;
        }
        case 'purchasing': {
            alto = 64;
            s +=
                caja(-90, -70, Z, 180, 140, 64) +
                techo(-90, -70, 180, 140, Z + 64);
            s +=
                equipo(-50, -40, Z + 64) +
                equipo(-10, -40, Z + 64) +
                claraboya(30, -30, Z + 64, 30, 40);
            s +=
                vanoL('calido', 70, -90, -18, Z, Z + 64) +
                vanoL('ventana calida', 70, -80, -60, Z + 30, Z + 48) +
                vanoL('ventana calida', 70, -50, -28, Z + 30, Z + 48) +
                vanoL('puerta calida-p', 70, -64, -46, Z, Z + 24);
            s +=
                filaL('ventana', 70, -6, 80, 3, Z + 30, Z + 48) +
                filaR('puerta', 90, -52, 56, 3, Z, Z + 32, 12);
            break;
        }
        case 'headquarters': {
            alto = 108;
            s +=
                caja(-96, -78, Z, 192, 156, 70) +
                techo(-96, -78, 192, 156, Z + 70);
            for (let r = 0; r < 2; r++) {
                s += filaL(
                    'ventana',
                    78,
                    -86,
                    -46,
                    2,
                    Z + 14 + r * 28,
                    Z + 34 + r * 28,
                );
                s += filaL(
                    'ventana',
                    78,
                    46,
                    86,
                    2,
                    Z + 14 + r * 28,
                    Z + 34 + r * 28,
                );
                s += filaR(
                    'ventana',
                    96,
                    -66,
                    66,
                    5,
                    Z + 14 + r * 28,
                    Z + 34 + r * 28,
                );
            }
            s +=
                caja(-40, -40, Z, 80, 124, 108) +
                techo(-40, -40, 80, 124, Z + 108, 6);
            for (let r = 0; r < 4; r++)
                s += filaL(
                    'cristal',
                    84,
                    -34,
                    34,
                    3,
                    Z + 10 + r * 24,
                    Z + 30 + r * 24,
                    4,
                );
            s +=
                filaR('ventana', 40, -30, 74, 4, Z + 54, Z + 70) +
                caja(-30, 84, Z + 30, 60, 10, 4, 'alero') +
                equipo(-14, -20, Z + 108);
            break;
        }
        case 'people': {
            alto = 96;
            s +=
                caja(-96, -56, Z, 104, 126, 58) +
                techo(-96, -56, 104, 126, Z + 58);
            s +=
                filaL('ventana', 70, -86, -2, 4, Z + 24, Z + 42) +
                equipo(-70, -30, Z + 58);
            s +=
                caja(22, -74, Z, 74, 130, 64) +
                techo(22, -74, 74, 130, Z + 64) +
                filaR('ventana', 96, -62, 44, 4, Z + 26, Z + 44) +
                filaL('ventana', 56, 30, 88, 2, Z + 26, Z + 44);
            s +=
                caja(-12, -24, Z, 40, 100, 96, 'acento') +
                techo(-12, -24, 40, 100, Z + 96, 4) +
                filaL('ventana clara', 76, -6, 22, 1, Z + 16, Z + 82);
            break;
        }
        case 'school': {
            alto = 82;
            s +=
                caja(-100, -66, Z, 196, 136, 82) +
                techo(-100, -66, 196, 136, Z + 82);
            s +=
                vanoL('banda', 70, -100, 96, Z + 74, Z + 82) +
                vanoR('banda', 96, -66, 70, Z + 74, Z + 82);
            for (let r = 0; r < 2; r++) {
                s += filaL(
                    'ventana',
                    70,
                    -90,
                    86,
                    7,
                    Z + 14 + r * 30,
                    Z + 34 + r * 30,
                );
                s += filaR(
                    'ventana',
                    96,
                    -56,
                    60,
                    4,
                    Z + 14 + r * 30,
                    Z + 34 + r * 30,
                );
            }
            s +=
                caja(-16, 70, Z, 34, 16, 26, 'alero') +
                vanoL('cristal', 86, -12, 14, Z, Z + 22) +
                equipo(-40, -30, Z + 82) +
                equipo(20, -30, Z + 82);
            break;
        }
        case 'preschool': {
            alto = 50;
            s +=
                caja(-84, -70, Z, 168, 140, 50) +
                techo(-84, -70, 168, 140, Z + 50);
            s +=
                vanoL('banda', 70, -84, 84, Z + 42, Z + 50) +
                vanoR('banda', 84, -70, 70, Z + 42, Z + 50);
            s +=
                filaL('ventana', 70, -72, 72, 5, Z + 16, Z + 32) +
                filaR('ventana', 84, -58, 58, 4, Z + 16, Z + 32) +
                vanoL('cristal', 70, -10, 12, Z, Z + 26) +
                equipo(-20, -20, Z + 50);
            break;
        }
        case 'classrooms': {
            alto = 52;
            for (const [x, h] of [
                [-96, 48],
                [-30, 52],
                [36, 48],
            ] as [number, number][]) {
                s +=
                    caja(x, -64, Z, 60, 128, h) +
                    techo(x, -64, 60, 128, Z + h, 5) +
                    vanoR('puerta', x + 60, -10, 14, Z, Z + 30) +
                    filaL('ventana', 64, x + 8, x + 52, 2, Z + 18, Z + 34);
            }
            s += vanoL('banda', 64, -96, 96, Z + 44, Z + 48);
            break;
        }
        case 'store': {
            alto = 70;
            s +=
                caja(-92, -70, Z, 184, 140, 70) +
                techo(-92, -70, 184, 140, Z + 70) +
                equipo(-30, -30, Z + 70) +
                equipo(20, -30, Z + 70);
            s +=
                vanoL('cristal', 70, -84, 84, Z, Z + 40) +
                vanoL('banda', 70, -92, 92, Z + 44, Z + 54) +
                filaR('ventana', 92, -58, 58, 3, Z + 24, Z + 46);
            break;
        }
        case 'kiosk': {
            alto = 56;
            s +=
                caja(-60, -56, Z, 120, 112, 56) +
                techo(-60, -56, 120, 112, Z + 56) +
                vanoL('cristal', 56, -48, 48, Z + 8, Z + 38) +
                vanoL('banda', 56, -60, 60, Z + 42, Z + 50) +
                vanoR('puerta', 60, -12, 14, Z, Z + 32);
            break;
        }
        case 'kitchen': {
            alto = 60;
            s +=
                caja(-88, -68, Z, 176, 136, 60) +
                techo(-88, -68, 176, 136, Z + 60);
            s +=
                cilindro(10, -36, Z + 60, 8, 22) +
                cilindro(-40, -36, Z + 60, 8, 26) +
                equipo(30, 10, Z + 60, 26, 20, 10);
            s +=
                filaL('ventana calida', 68, -76, 76, 4, Z + 26, Z + 44) +
                filaR('puerta', 88, -40, 40, 2, Z, Z + 32, 14);
            alto = 96;
            break;
        }
        case 'dining': {
            alto = 62;
            s +=
                caja(-94, -72, Z, 188, 144, 62) +
                techo(-94, -72, 188, 144, Z + 62) +
                equipo(-30, -40, Z + 62) +
                equipo(20, -10, Z + 62);
            s +=
                filaL('cristal', 72, -84, 84, 4, Z + 6, Z + 40) +
                vanoL('banda', 72, -94, 94, Z + 46, Z + 56) +
                filaR('ventana calida', 94, -60, 60, 3, Z + 20, Z + 42);
            break;
        }
    }
    return { svg: s, alto };
}
/* Departamento completo: halo, losa con canto, volumen. cx, cy en coordenadas de mundo */
export function edificio(tipo: Arquetipo, mostrarVolumen = true) {
    const halo = rectRedondo(0, 0, LOSA * 2 + 70, LOSA * 2 + 70, 46),
        base = rectRedondo(0, 0, LOSA * 2, LOSA * 2, 26, 0),
        tapa = rectRedondo(0, 0, LOSA * 2, LOSA * 2, 26, Z);
    const sombra = rectRedondo(16, 16, LOSA * 1.5, LOSA * 1.4, 30, Z);
    const v = mostrarVolumen ? volumen(tipo) : { svg: '', alto: 0 };
    return {
        svg: `<polygon class="halo" points="${pts(halo)}"/><polygon class="losa-c" points="${pts(base)}"/><polygon class="losa" points="${pts(tapa)}"/><polygon class="sombra" points="${pts(sombra)}"/><g class="vol">${v.svg}</g>`,
        alto: v.alto + Z,
    };
}
/* Contorno de selección sobre la losa */
export const contornoLosa = () =>
    pts(rectRedondo(0, 0, LOSA * 2 + 14, LOSA * 2 + 14, 32, Z));
