/* Composición de la escena: posiciones en la retícula y rutas tipo metro entre departamentos.
   Portado del prototipo aprobado (UI-Design/prototipo/src/mapa/escena.ts) con el mismo algoritmo y constantes.
   Cambio: la distribución, los nombres y los colores llegan en OrganizationMapData en lugar de estar
   fijos por sector en el cliente.

   Las rutas se enrutan por los ejes del mundo (diagonales en pantalla), rodean las losas y doblan con radio
   constante. Si un proceso existe en ambos sentidos, cada sentido tiene su propio carril paralelo. */
import type {
    LinkColor,
    MapLinkData,
    OrganizationMapData,
} from '@/data/contracts';
import { LOSA, P, edificio } from './iso';
import type { Arquetipo, P2 } from './iso';

const A = 330,
    B = 345; /* separación de la retícula: columnas y filas (pasillos con sitio para rutas y etiquetas) */
export interface Dep {
    id: string;
    name: string;
    i: number;
    j: number;
    tipo: Arquetipo;
    x: number;
    y: number;
}
export interface Hito {
    id: string;
    n: string;
    i: number;
    j: number;
    x: number;
    y: number;
}

const mundo = (i: number, j: number, cols: number) => {
    const c = (cols - 1) / 2;
    return { x: (i - c) * A + j * B, y: -(i - c) * A + j * B };
};

export function distribucion(map: OrganizationMapData) {
    return {
        deps: map.departments.map((d) => ({
            id: d.publicId,
            name: d.name,
            i: d.gridColumn,
            j: d.gridRow,
            tipo: d.building,
            ...mundo(d.gridColumn, d.gridRow, map.gridColumns),
        })) as Dep[],
        hitos: map.landmarks.map((h) => ({
            id: h.key,
            n: h.name,
            i: h.gridColumn,
            j: h.gridRow,
            ...mundo(h.gridColumn, h.gridRow, map.gridColumns),
        })) as Hito[],
    };
}

export interface Puente {
    d: string;
}
export interface Ruta {
    k: string;
    v: MapLinkData;
    color: LinkColor;
    d: string;
    largo: number;
    medio: P2;
    puertas: P2[];
    flechas: { p: P2; ang: number }[];
    doble: boolean;
    puentes: Puente[];
}
const CEL = 14,
    MARGEN = LOSA + 22,
    R_CURVA = 30;

/* Enrutado ortogonal en el mundo.
   - Cada departamento reserva su losa con margen y, además, la franja que su volumen y su etiqueta tapan detrás de él
     (en isometría el edificio cubre el suelo situado «arriba» en pantalla).
   - Las rutas salen y llegan solo por los dos frentes visibles de la losa, en puertas marcadas.
   - El coste penaliza giros, celdas usadas y celdas vecinas de otra ruta: las paralelas quedan separadas.
   - Un cruce sin relación se dibuja como puente (la ruta superior interrumpe a la inferior); no se inventan nodos. */
export function rutas(map: OrganizationMapData): Ruta[] {
    const { deps, hitos } = distribucion(map);
    if (!deps.length) {
        return [];
    }
    const xs = [...deps, ...hitos].map((o) => o.x),
        ys = [...deps, ...hitos].map((o) => o.y),
        x0 = Math.min(...xs) - 300,
        y0 = Math.min(...ys) - 300;
    const W = Math.ceil((Math.max(...xs) + 300 - x0) / CEL),
        H = Math.ceil((Math.max(...ys) + 300 - y0) / CEL);
    /* Rectángulos en pantalla (escala 1) de la etiqueta; la etiqueta mide en píxeles reales, se estima a la escala dada */
    const zonaEtq = (esc: number) =>
        deps.map((o) => {
            const alto = edificio(o.tipo).alto,
                [ax, ay] = P(o.x + 10, o.y + 10, alto + 14);
            const ancho = (70 + o.name.length * 8.6) / esc,
                altoE = 50 / esc;
            return {
                x0: ax - ancho / 2 - 22 / esc,
                x1: ax + ancho / 2 + 22 / esc,
                y0: ay - altoE - 18 / esc,
                y1: ay + 18 / esc,
                c: 60,
            };
        });
    /* Los contadores se colocan lejos de la etiqueta calculada a la escala mínima del mapa (las etiquetas no se reducen) */
    const etqNodo = zonaEtq(0.4);
    const tapas = deps.flatMap((o) => {
        const alto = edificio(o.tipo).alto,
            [ax, ay] = P(o.x + 10, o.y + 10, alto + 14);
        const ancho = (70 + o.name.length * 8.6) / 0.6,
            altoE = 50 / 0.6;
        return [
            {
                x0: ax - ancho / 2 - 34,
                x1: ax + ancho / 2 + 34,
                y0: ay - altoE - 30,
                y1: ay + 30,
                c: 60,
            },
        ];
    });
    /* Sombra visual exacta del volumen: P(x, y, z) coincide con P(x - z, y - z, 0); el edificio tapa su planta desplazada hacia atrás hasta su altura */
    const altos = deps.map((o) => ({ o, alto: edificio(o.tipo).alto, m: 108 }));
    const oculto = (wx: number, wy: number) =>
        altos.some(({ o, alto, m }) => {
            const u = wx - o.x,
                v = wy - o.y;
            return (
                Math.max(-m - Math.min(u, v), 0) <=
                Math.min(m - Math.max(u, v), alto)
            );
        });
    const bloq = new Uint8Array(W * H),
        uso = new Uint8Array(W * H),
        costo = new Float32Array(W * H);
    for (let gy = 0; gy < H; gy++) {
        for (let gx = 0; gx < W; gx++) {
            const wx = x0 + gx * CEL,
                wy = y0 + gy * CEL,
                i = gy * W + gx;
            if (
                deps.some(
                    (o) =>
                        Math.abs(wx - o.x) <= MARGEN &&
                        Math.abs(wy - o.y) <= MARGEN,
                ) ||
                hitos.some(
                    (o) =>
                        Math.abs(wx - o.x) <= MARGEN - 10 &&
                        Math.abs(wy - o.y) <= MARGEN - 10,
                )
            ) {
                bloq[i] = 1;
                continue;
            }
            /* Lo que tapan en pantalla el volumen y la etiqueta de cada departamento: una ruta allí quedaría oculta o bajo el texto */
            const [px, py] = P(wx, wy, 0);
            for (const z of tapas) {
                if (px > z.x0 && px < z.x1 && py > z.y0 && py < z.y1) {
                    costo[i] += z.c;
                }
            }
            if (oculto(wx, wy)) {
                costo[i] += 45;
            }
        }
    }
    const celda = (x: number, y: number) => [
        Math.round((x - x0) / CEL),
        Math.round((y - y0) / CEL),
    ];
    const libre = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < W && y < H && !bloq[y * W + x];
    const vecinoUsado = (x: number, y: number) => {
        let n = 0;
        for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            const a = x + dx,
                b = y + dy;
            if (a >= 0 && b >= 0 && a < W && b < H && uso[b * W + a]) {
                n++;
            }
        }
        return n;
    };
    function astar(sx: number, sy: number, tx: number, ty: number) {
        const N = W * H,
            g = new Float32Array(N).fill(Infinity),
            de = new Int32Array(N).fill(-1),
            dir = new Int8Array(N).fill(-1),
            cerr = new Uint8Array(N),
            abiertos: [number, number][] = [];
        const si = sy * W + sx,
            ti = ty * W + tx,
            DX = [1, -1, 0, 0],
            DY = [0, 0, 1, -1];
        g[si] = 0;
        abiertos.push([0, si]);
        while (abiertos.length) {
            let m = 0;
            for (let q = 1; q < abiertos.length; q++) {
                if (abiertos[q][0] < abiertos[m][0]) {
                    m = q;
                }
            }
            const [, i] = abiertos.splice(m, 1)[0];
            if (cerr[i]) {
                continue;
            }
            cerr[i] = 1;
            if (i === ti) {
                break;
            }
            const x = i % W,
                y = (i / W) | 0;
            for (let d = 0; d < 4; d++) {
                const nx = x + DX[d],
                    ny = y + DY[d],
                    j = ny * W + nx;
                if (!libre(nx, ny) && j !== ti) {
                    continue;
                }
                const c =
                    g[i] +
                    1 +
                    costo[j] +
                    (dir[i] >= 0 && dir[i] !== d ? 8 : 0) +
                    (uso[j] ? 14 : 0) +
                    vecinoUsado(nx, ny) * 3;
                if (c < g[j]) {
                    g[j] = c;
                    de[j] = i;
                    dir[j] = d;
                    abiertos.push([
                        c + Math.abs(nx - tx) + Math.abs(ny - ty),
                        j,
                    ]);
                }
            }
        }
        if (de[ti] < 0) {
            return null;
        }
        const out: [number, number][] = [];
        for (let i = ti; i >= 0; i = de[i]) {
            out.push([x0 + (i % W) * CEL, y0 + ((i / W) | 0) * CEL]);
            uso[i] = 1;
            if (i === si) {
                break;
            }
        }
        return out.reverse();
    }
    /* Puertas: centro y tercios de los dos frentes visibles (+x y +y); así varias rutas no comparten el mismo punto */
    const puertas = (o: { x: number; y: number }) =>
        [
            [1, 0],
            [0, 1],
        ].flatMap(([dx, dy]) =>
            [0, -0.42, 0.42].map((t) => ({
                borde: [
                    o.x + dx * LOSA + dy * t * LOSA,
                    o.y + dy * LOSA + dx * t * LOSA,
                ] as [number, number],
                fuera: [
                    o.x + dx * (MARGEN + CEL) + dy * t * LOSA,
                    o.y + dy * (MARGEN + CEL) + dx * t * LOSA,
                ] as [number, number],
            })),
        );
    const ocupadas = new Set<string>();
    const mundoRutas: {
        k: string;
        v: MapLinkData;
        w: [number, number][];
        doble: boolean;
    }[] = [];
    map.links.forEach((v) => {
        const A_ = deps.find((d) => d.id === v.from),
            B_ = deps.find((d) => d.id === v.to);
        if (!A_ || !B_) {
            return;
        }
        const ida = mundoRutas.find(
            (r) => r.v.from === v.to && r.v.to === v.from,
        );
        if (ida) {
            ida.doble = true;
            mundoRutas.push({
                k: v.publicId,
                v,
                w: desplazar(ida.w.slice().reverse(), 12),
                doble: true,
            });
            ida.w = desplazar(ida.w, 12);
            return;
        }
        const pares = puertas(A_)
            .flatMap((a) =>
                puertas(B_).map((b) => ({
                    a,
                    b,
                    d:
                        Math.abs(a.fuera[0] - b.fuera[0]) +
                        Math.abs(a.fuera[1] - b.fuera[1]),
                })),
            )
            .filter(
                (p) =>
                    !ocupadas.has(p.a.borde.join()) &&
                    !ocupadas.has(p.b.borde.join()),
            )
            .sort((p, q) => p.d - q.d);
        for (const pr of pares) {
            const [ax, ay] = celda(...pr.a.fuera),
                [bx, by] = celda(...pr.b.fuera);
            if (!libre(ax, ay) || !libre(bx, by)) {
                continue;
            }
            const c = astar(ax, ay, bx, by);
            if (c) {
                ocupadas.add(pr.a.borde.join());
                ocupadas.add(pr.b.borde.join());
                mundoRutas.push({
                    k: v.publicId,
                    v,
                    w: simplificar([pr.a.borde, ...c, pr.b.borde]),
                    doble: false,
                });
                break;
            }
        }
    });
    /* Cruces entre rutas sin relación: la ruta trazada después pasa por encima con un puente */
    const puentes = new Map<string, Puente[]>();
    for (let a = 0; a < mundoRutas.length; a++) {
        for (let b = a + 1; b < mundoRutas.length; b++) {
            const A_ = mundoRutas[a],
                B_ = mundoRutas[b];
            if (A_.v.from === B_.v.to && A_.v.to === B_.v.from) {
                continue;
            }
            for (let i = 0; i < A_.w.length - 1; i++) {
                for (let j = 0; j < B_.w.length - 1; j++) {
                    const x = cruce(A_.w[i], A_.w[i + 1], B_.w[j], B_.w[j + 1]);
                    if (!x) {
                        continue;
                    }
                    const [p, q] = [B_.w[j], B_.w[j + 1]],
                        l = Math.hypot(q[0] - p[0], q[1] - p[1]),
                        ux = (q[0] - p[0]) / l,
                        uy = (q[1] - p[1]) / l;
                    const e1 = P(x[0] - ux * 17, x[1] - uy * 17),
                        e2 = P(x[0] + ux * 17, x[1] + uy * 17);
                    const l2 = puentes.get(B_.k) ?? [];
                    l2.push({
                        d: `M${e1[0].toFixed(1)} ${e1[1].toFixed(1)} L${e2[0].toFixed(1)} ${e2[1].toFixed(1)}`,
                    });
                    puentes.set(B_.k, l2);
                }
            }
        }
    }
    const otrosMedios: [number, number][] = [];
    return mundoRutas.map(({ k, v, w, doble }) => {
        const suave = redondear(w, R_CURVA),
            pant = suave.map(([x, y]) => P(x, y, 0)),
            largo = longitud(suave);
        const en = (t: number) => puntoEn(suave, largo * t);
        const flechas = [0.3, 0.7].map((t) => {
            const a = en(t),
                b = en(t + 0.01),
                pa = P(a[0], a[1]),
                pb = P(b[0], b[1]);
            return {
                p: pa,
                ang: (Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180) / Math.PI,
            };
        });
        /* El contador va en el centro del tramo recto más largo (lejos de curvas, puertas y cruces) */
        let mejor = -Infinity,
            med: [number, number] = en(0.5);
        for (let i = 0; i < w.length - 1; i++) {
            const l = Math.hypot(w[i + 1][0] - w[i][0], w[i + 1][1] - w[i][1]),
                m: [number, number] = [
                    (w[i][0] + w[i + 1][0]) / 2,
                    (w[i][1] + w[i + 1][1]) / 2,
                ],
                [px, py] = P(m[0], m[1]);
            const cerca =
                etqNodo.some(
                    (z) => px > z.x0 && px < z.x1 && py > z.y0 && py < z.y1,
                ) ||
                oculto(m[0], m[1]) ||
                otrosMedios.some(
                    (o) => Math.hypot(o[0] - m[0], o[1] - m[1]) < 70,
                );
            const nota = l - (cerca ? 1000 : 0);
            if (nota > mejor) {
                mejor = nota;
                med = m;
            }
        }
        otrosMedios.push(med);
        return {
            k,
            v,
            doble,
            color: v.color,
            d:
                'M' +
                pant
                    .map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
                    .join(' L'),
            largo,
            medio: P(med[0], med[1]),
            puertas: [
                P(w[0][0], w[0][1], 0),
                P(w[w.length - 1][0], w[w.length - 1][1], 0),
            ],
            flechas,
            puentes: puentes.get(k) ?? [],
        };
    });
}
/* Intersección de dos segmentos ortogonales perpendiculares, lejos de sus extremos */
function cruce(
    a: [number, number],
    b: [number, number],
    c: [number, number],
    d: [number, number],
): [number, number] | null {
    const hA = a[1] === b[1],
        hC = c[1] === d[1];
    if (hA === hC) {
        return null;
    }
    const [h1, h2, v1, v2] = hA ? [a, b, c, d] : [c, d, a, b],
        y = h1[1],
        x = v1[0];
    const dentro = (v: number, p: number, q: number) =>
        v > Math.min(p, q) + 20 && v < Math.max(p, q) - 20;
    return dentro(x, h1[0], h2[0]) && dentro(y, v1[1], v2[1]) ? [x, y] : null;
}
function simplificar(c: [number, number][]) {
    const out = [c[0]];
    for (let i = 1; i < c.length - 1; i++) {
        const a = out[out.length - 1],
            b = c[i],
            n = c[i + 1];
        if (
            (a[0] === b[0] && b[0] === n[0]) ||
            (a[1] === b[1] && b[1] === n[1])
        ) {
            continue;
        }
        out.push(b);
    }
    out.push(c[c.length - 1]);
    return out;
}
function desplazar(w: [number, number][], d: number): [number, number][] {
    const nrm = (a: number[], b: number[]) => [
        -Math.sign(b[1] - a[1]),
        Math.sign(b[0] - a[0]),
    ];
    return w.map((p, i) => {
        const n1 = i > 0 ? nrm(w[i - 1], p) : null,
            n2 = i < w.length - 1 ? nrm(p, w[i + 1]) : null;
        const n = n1 && n2 ? [n1[0] + n2[0], n1[1] + n2[1]] : (n1 ?? n2)!;
        return [p[0] + n[0] * d, p[1] + n[1] * d];
    });
}
function redondear(w: [number, number][], r: number): [number, number][] {
    const out: [number, number][] = [w[0]];
    for (let i = 1; i < w.length - 1; i++) {
        const [px, py] = w[i - 1],
            [x, y] = w[i],
            [nx, ny] = w[i + 1],
            l1 = Math.hypot(x - px, y - py),
            l2 = Math.hypot(nx - x, ny - y),
            rr = Math.min(r, l1 / 2, l2 / 2);
        const a: [number, number] = [
                x - ((x - px) / l1) * rr,
                y - ((y - py) / l1) * rr,
            ],
            b: [number, number] = [
                x + ((nx - x) / l2) * rr,
                y + ((ny - y) / l2) * rr,
            ];
        for (let k = 0; k <= 6; k++) {
            const t = k / 6,
                u = 1 - t;
            out.push([
                u * u * a[0] + 2 * u * t * x + t * t * b[0],
                u * u * a[1] + 2 * u * t * y + t * t * b[1],
            ]);
        }
    }
    out.push(w[w.length - 1]);
    return out;
}
const longitud = (w: [number, number][]) =>
    w
        .slice(1)
        .reduce((s, p, i) => s + Math.hypot(p[0] - w[i][0], p[1] - w[i][1]), 0);
function puntoEn(w: [number, number][], l: number): [number, number] {
    for (let i = 1; i < w.length; i++) {
        const s = Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1]);
        if (l <= s) {
            const t = l / (s || 1);
            return [
                w[i - 1][0] + (w[i][0] - w[i - 1][0]) * t,
                w[i - 1][1] + (w[i][1] - w[i - 1][1]) * t,
            ];
        }
        l -= s;
    }
    return w[w.length - 1];
}
