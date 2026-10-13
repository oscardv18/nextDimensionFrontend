/* Mapa de la empresa: escena isométrica 2.5D (SVG) + capa HTML para etiquetas y nodos.
   Portado del prototipo aprobado (UI-Design/prototipo/src/mapa/CompanyMap.tsx). Mismo enfoque de cámara,
   escala mínima legible, pulsos y capas; los datos llegan como props (OrganizationMapData).
   El enfoque mueve una cámara (traslación y escala de la escena vectorial); las etiquetas no se escalan:
   se reposicionan en cada cuadro, así el texto sigue nítido. */
import { ArrowLeft } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DemoBadge,
    DepartmentIcon,
    LINK_CLASS,
    TONE_CLASS,
    hueColor,
} from '@/design/common';
import { setUi, useUi } from '@/design/state/ui-state';
import { useAppearance } from '@/design/appearance/use-appearance';
import type { OrganizationMapData } from '@/data/contracts';
import { DepartmentList } from './department-list';
import { P, contornoLosa, edificio, pts, rectRedondo } from './iso';
import { LinkSheet } from './link-sheet';
import { distribucion, rutas } from './scene';
import type { Ruta } from './scene';
import { SelectionCard } from './selection-card';

type Cam = { s: number; tx: number; ty: number };
const facil = (t: number) => 1 - Math.pow(1 - t, 3);
const ESC_MIN = 0.4;

export function CompanyMap({
    map,
    onOpenDepartment: openDepartment,
}: {
    map: OrganizationMapData;
    onOpenDepartment: (publicId: string) => void;
}) {
    const { t } = useTranslation();
    const layers = useUi((s) => s.layers),
        sel = useUi((s) => s.selection),
        linkId = useUi((s) => s.link),
        paused = useUi((s) => s.paused);
    const { reducedMotion } = useAppearance();
    const cont = useRef<HTMLDivElement>(null),
        gRef = useRef<SVGGElement>(null),
        capaRef = useRef<HTMLDivElement>(null),
        pulsosRef = useRef<SVGGElement>(null);
    const [tam, setTam] = useState({ w: 0, h: 0 });
    const dist = useMemo(() => distribucion(map), [map]);
    const rts = useMemo(() => rutas(map), [map]);
    const byId = useMemo(
        () => new Map(map.departments.map((d) => [d.publicId, d])),
        [map],
    );
    const deps = useMemo(
        () =>
            dist.deps
                .map((d) => ({
                    ...d,
                    ...edificio(d.tipo, layers.departments),
                    s: P(d.x, d.y),
                }))
                .sort((a, b) => a.x + a.y - (b.x + b.y)),
        [dist, layers.departments],
    );
    /* Extensión real de la escena: losas (±222 en x, +150 abajo), altura de cada edificio con su etiqueta y trazado de rutas */
    const caja = useMemo(() => {
        const xs = deps.flatMap((d) => [d.s[0] - 228, d.s[0] + 228]),
            ys = deps.flatMap((d) => [
                d.s[1] - d.alto - 14 - 46 / 0.45,
                d.s[1] + 152,
            ]); /* la etiqueta (≈46 px reales) se estima a escala ~0,45 */
        for (const r of rts) {
            for (const m of r.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
                xs.push(+m[1]);
                ys.push(+m[2] + 18);
            }
        }
        return {
            x0: Math.min(...xs),
            x1: Math.max(...xs),
            y0: Math.min(...ys),
            y1: Math.max(...ys),
        };
    }, [deps, rts]);
    const lista = tam.w > 0 && tam.w < 640;
    const cam = useRef<Cam>({ s: 1, tx: 0, ty: 0 }),
        animId = useRef(0);

    useLayoutEffect(() => {
        /* Se mide el área de trabajo (no el propio mapa, que puede crecer): así la composición sigue el espacio disponible */
        const el = cont.current?.parentElement;
        if (!el) {
            return;
        }
        const ro = new ResizeObserver(() =>
            setTam({ w: el.clientWidth, h: el.clientHeight }),
        );
        ro.observe(el);
        return () => ro.disconnect();
    }, [lista]);
    /* Composición según el espacio real. La escala tiene un mínimo legible: si la altura no alcanza, el mapa crece
       y se desplaza dentro del área de trabajo (nunca se reduce indefinidamente ni se escala toda la interfaz) */
    const ajuste = useMemo(() => {
        const pad = {
                t: 96,
                r: 20,
                b: 18,
                l: 20,
            } /* t: franja propia del título y el contexto */,
            bw = caja.x1 - caja.x0,
            bh = caja.y1 - caja.y0;
        const sw = (tam.w - pad.l - pad.r) / bw,
            sh = (tam.h - pad.t - pad.b) / bh;
        const s = Math.min(sw, Math.max(sh, Math.min(ESC_MIN, sw)), 1.05),
            alto = Math.max(tam.h, bh * s + pad.t + pad.b);
        return {
            s,
            alto,
            tx: pad.l + (tam.w - pad.l - pad.r - bw * s) / 2 - caja.x0 * s,
            ty: pad.t + (alto - pad.t - pad.b - bh * s) / 2 - caja.y0 * s,
        };
    }, [tam.w, tam.h, caja]);
    const objetivo = (): Cam => {
        const b = { s: ajuste.s, tx: ajuste.tx, ty: ajuste.ty };
        const d = sel ? deps.find((x) => x.id === sel) : undefined;
        if (!d) {
            return b;
        }
        const s = Math.min(b.s * 1.28, b.s + 0.28, 1.12),
            cx = d.s[0],
            cy = d.s[1] - 50,
            ancho = tam.w > 900 ? tam.w - 360 : tam.w;
        return {
            s,
            tx: ancho * 0.5 - cx * s,
            ty: Math.min(ajuste.alto, tam.h) * 0.52 - cy * s,
        };
    };
    const aplicar = (c: Cam) => {
        gRef.current?.setAttribute(
            'transform',
            `translate(${c.tx.toFixed(2)} ${c.ty.toFixed(2)}) scale(${c.s.toFixed(4)})`,
        );
        for (const el of Array.from(
            capaRef.current?.children ?? [],
        ) as HTMLElement[]) {
            el.style.transform = `translate(${(c.s * +el.dataset.x! + c.tx).toFixed(1)}px, ${(c.s * +el.dataset.y! + c.ty).toFixed(1)}px)`;
        }
    };
    /* Enfoque suave y controlado (sin arrastre ni zoom libre); instantáneo con movimiento reducido */
    useLayoutEffect(() => {
        if (!tam.w || lista) {
            return;
        }
        const a = { ...cam.current },
            b = objetivo();
        cancelAnimationFrame(animId.current);
        if (reducedMotion || (a.s === 1 && a.tx === 0)) {
            cam.current = b;
            aplicar(b);
            return;
        }
        const t0 = performance.now(),
            dur = 560;
        const paso = (now: number) => {
            const k = facil(Math.min(1, (now - t0) / dur));
            cam.current = {
                s: a.s + (b.s - a.s) * k,
                tx: a.tx + (b.tx - a.tx) * k,
                ty: a.ty + (b.ty - a.ty) * k,
            };
            aplicar(cam.current);
            if (k < 1) {
                animId.current = requestAnimationFrame(paso);
            }
        };
        animId.current = requestAnimationFrame(paso);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sel, ajuste, lista, reducedMotion]);
    useLayoutEffect(() => {
        if (!lista) {
            aplicar(cam.current);
        }
    });

    /* Pulsos: movimiento ilustrativo de la demostración (no son eventos reales). Ritmo moderado, máximo 5 a la vez.
       Sin datos de demostración no hay pulsos: llegarán cuando exista un canal de eventos real. */
    const demo = map.context.isDemo;
    useEffect(() => {
        if (
            !demo ||
            !layers.pulses ||
            !layers.connections ||
            paused ||
            reducedMotion ||
            lista
        ) {
            return;
        }
        const id = window.setInterval(() => {
            const g = pulsosRef.current;
            if (
                !g ||
                document.hidden ||
                g.childElementCount >= 10 ||
                !rts.length
            ) {
                return;
            }
            const peso = rts.map((r) => Math.max(1, r.v.openOperations)),
                tot = peso.reduce((s, x) => s + x, 0);
            let q = Math.random() * tot,
                r = rts[0];
            for (let i = 0; i < rts.length; i++) {
                q -= peso[i];
                if (q <= 0) {
                    r = rts[i];
                    break;
                }
            }
            lanzar(g, r);
        }, 1500);
        const g = pulsosRef.current;
        return () => {
            clearInterval(id);
            g?.replaceChildren();
        };
    }, [
        demo,
        layers.pulses,
        layers.connections,
        paused,
        reducedMotion,
        lista,
        rts,
    ]);

    const v = linkId !== null ? rts.find((r) => r.k === linkId) : undefined;
    const apagadoDep = (id: string) =>
        (sel && sel !== id) || (v && v.v.from !== id && v.v.to !== id);
    const apagadoRuta = (r: Ruta) =>
        (v && v.k !== r.k) || (sel && r.v.from !== sel && r.v.to !== sel);
    const seleccionar = (id: string) => setUi({ selection: id, link: null });
    const mover = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
        if (!e.key.startsWith('Arrow')) {
            return;
        }
        const o = deps.find((d) => d.id === id)!,
            dir = (
                {
                    ArrowRight: [1, 0],
                    ArrowLeft: [-1, 0],
                    ArrowDown: [0, 1],
                    ArrowUp: [0, -1],
                } as Record<string, number[]>
            )[e.key];
        if (!dir) {
            return;
        }
        let m: string | null = null,
            md = Infinity;
        for (const d of deps) {
            if (d.id === id) {
                continue;
            }
            const dx = d.s[0] - o.s[0],
                dy = d.s[1] - o.s[1];
            if (dx * dir[0] + dy * dir[1] <= 20) {
                continue;
            }
            const dd =
                Math.abs(dx * dir[1]) +
                Math.abs(dy * dir[0]) +
                Math.hypot(dx, dy) * 0.5;
            if (dd < md) {
                md = dd;
                m = d.id;
            }
        }
        if (m) {
            e.preventDefault();
            capaRef.current
                ?.querySelector<HTMLElement>(`[data-dep="${m}"]`)
                ?.focus();
        }
    };

    if (lista) {
        return (
            <div
                ref={cont}
                className="mapa"
                style={{ position: 'relative', inset: 'auto' }}
            >
                <DepartmentList map={map} onOpenDepartment={openDepartment} />
            </div>
        );
    }
    const c = map.context;
    return (
        <div
            ref={cont}
            className="mapa"
            aria-label={t('map.title')}
            style={
                ajuste.alto > tam.h + 1 && !sel
                    ? { bottom: 'auto', height: ajuste.alto }
                    : undefined
            }
        >
            <div className="mapa-cab">
                <div>
                    <h1>{t('map.title')}</h1>
                    <p>
                        {t('map.subtitle', {
                            organization: c.organizationName,
                            branch: c.branchName,
                            count: map.departments.length,
                        })}
                        {demo && (
                            <>
                                {' '}
                                · <DemoBadge />
                            </>
                        )}
                    </p>
                </div>
                {(sel || v) && (
                    <button
                        className="btn volver-general"
                        onClick={() => setUi({ selection: null, link: null })}
                    >
                        <ArrowLeft />
                        {t('map.overview')} <kbd>Esc</kbd>
                    </button>
                )}
            </div>
            <svg className="escena" aria-hidden>
                <g ref={gRef}>
                    {dist.hitos.map((h) => {
                        const p = P(h.x, h.y);
                        return (
                            <polygon
                                key={h.id}
                                className="plaza"
                                transform={`translate(${p[0]} ${p[1]})`}
                                points={pts(rectRedondo(0, 0, 230, 230, 30))}
                            />
                        );
                    })}
                    {layers.connections &&
                        rts.map((r) => (
                            <g
                                key={r.k}
                                className={`ruta-g ${LINK_CLASS[r.color]} ${apagadoRuta(r) ? 'apagado-ruta' : ''} ${v?.k === r.k ? 'sel' : ''}`}
                            >
                                <path
                                    className="ruta-borde"
                                    d={r.d}
                                    pathLength={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path
                                    className={`ruta ${r.doble ? 'doble' : ''}`}
                                    d={r.d}
                                    pathLength={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                                {r.flechas.map((f, i) => (
                                    <path
                                        key={i}
                                        className="flecha-r"
                                        d="M-4 -4 L1 0 L-4 4"
                                        transform={`translate(${f.p[0].toFixed(1)} ${f.p[1].toFixed(1)}) rotate(${f.ang.toFixed(1)})`}
                                    />
                                ))}
                                <path
                                    className="ruta-toque"
                                    d={r.d}
                                    onClick={() =>
                                        setUi({ link: r.k, selection: null })
                                    }
                                />
                            </g>
                        ))}
                    <g ref={pulsosRef} />
                    {/* Puentes: la ruta superior se dibuja sobre la inferior en un cruce sin relación (no es un nodo) */}
                    {layers.connections &&
                        rts.flatMap((r) =>
                            r.puentes.map((b, i) => (
                                <g
                                    key={`p${r.k}-${i}`}
                                    className={`puente ${LINK_CLASS[r.color]} ${apagadoRuta(r) ? 'apagado-ruta' : ''}`}
                                >
                                    <path
                                        className="puente-hueco"
                                        d={b.d}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <path
                                        className="ruta"
                                        d={b.d}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </g>
                            )),
                        )}
                    {deps.map((d, i) => (
                        <g
                            key={d.id}
                            className={`dep ${sel === d.id ? 'sel' : ''} ${apagadoDep(d.id) ? 'apagado' : ''}`}
                            style={{
                                ['--c' as string]: hueColor(
                                    byId.get(d.id)!.hue,
                                ),
                                ['--i' as string]: i,
                            }}
                            transform={`translate(${d.s[0].toFixed(1)} ${d.s[1].toFixed(1)})`}
                            onClick={() => seleccionar(d.id)}
                            onDoubleClick={() => openDepartment(d.id)}
                        >
                            <g dangerouslySetInnerHTML={{ __html: d.svg }} />
                            <polygon
                                className="contorno"
                                points={contornoLosa()}
                            />
                        </g>
                    ))}
                    {/* Puertas de entrada y salida en el borde visible de cada losa */}
                    {layers.connections &&
                        rts.flatMap((r) =>
                            r.puertas.map((q, i) => (
                                <circle
                                    key={`q${r.k}-${i}`}
                                    className={`puerta-r ${LINK_CLASS[r.color]} ${apagadoRuta(r) ? 'apagado-ruta' : ''}`}
                                    cx={q[0].toFixed(1)}
                                    cy={q[1].toFixed(1)}
                                    r={5}
                                />
                            )),
                        )}
                </g>
            </svg>
            <div
                ref={capaRef}
                className={`capa-html ${ajuste.s < 0.38 ? 'compacta' : ''}`}
            >
                {dist.hitos.map((h) => {
                    const p = P(h.x, h.y);
                    return (
                        <span
                            key={h.id}
                            className="hito-etq"
                            data-x={p[0]}
                            data-y={p[1]}
                        >
                            {h.n}
                        </span>
                    );
                })}
                {layers.connections &&
                    rts.map((r) => {
                        const n = r.v.openOperations;
                        const lbl = t('map.linkLabel', {
                            name: r.v.name,
                            from: byId.get(r.v.from)!.name,
                            to: byId.get(r.v.to)!.name,
                            count: n,
                        });
                        return (
                            <button
                                key={`m${r.k}`}
                                className={`nodo ${LINK_CLASS[r.color]} ${layers.counters ? 'num' : ''} ${v?.k === r.k ? 'sel' : ''} ${apagadoRuta(r) ? 'apagado' : ''}`}
                                data-x={r.medio[0]}
                                data-y={r.medio[1]}
                                aria-label={lbl}
                                title={lbl}
                                onClick={() =>
                                    setUi({ link: r.k, selection: null })
                                }
                            >
                                <span className="anillo">
                                    {layers.counters ? n : ''}
                                </span>
                            </button>
                        );
                    })}
                {deps.map((d) => {
                    const a = byId.get(d.id)!,
                        p = a.pending,
                        an = P(d.x + 10, d.y + 10, d.alto + 14);
                    return (
                        <button
                            key={d.id}
                            data-dep={d.id}
                            data-x={an[0]}
                            data-y={an[1]}
                            className={`etq ${sel === d.id ? 'sel' : ''} ${apagadoDep(d.id) ? 'apagado' : ''}`}
                            style={{ ['--c' as string]: hueColor(a.hue) }}
                            onClick={() =>
                                sel === d.id
                                    ? openDepartment(d.id)
                                    : seleccionar(d.id)
                            }
                            onDoubleClick={() => openDepartment(d.id)}
                            onKeyDown={(e) => mover(e, d.id)}
                            aria-label={`${a.name}. ${t('pending.count', { count: p.total })}.${sel === d.id ? ` ${t('map.pressAgainToOpen')}` : ''}`}
                        >
                            <span className="ico-d">
                                <DepartmentIcon icon={a.icon} />
                            </span>
                            <span>
                                <b>{a.name}</b>
                                {layers.labels && <small>{a.summary}</small>}
                                {layers.people && (
                                    <span
                                        className="personas"
                                        title={t('people.hint')}
                                    >
                                        <span>
                                            {t('people.assigned', {
                                                count: a.people.assigned,
                                            })}
                                        </span>
                                        <span>
                                            <i />
                                            {t('people.connected', {
                                                count: a.people.connected,
                                            })}
                                        </span>
                                    </span>
                                )}
                            </span>
                            {layers.counters ? (
                                <span
                                    className={`insignia-n ${TONE_CLASS[p.worst]}`}
                                >
                                    {p.total || '✓'}
                                </span>
                            ) : (
                                <span
                                    className={`insignia-n punto ${TONE_CLASS[p.worst]}`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            {sel && byId.has(sel) && (
                <SelectionCard
                    department={byId.get(sel)!}
                    onOpenDepartment={openDepartment}
                />
            )}
            <LinkSheet
                route={v}
                departments={byId}
                demo={demo}
                onOpenDepartment={openDepartment}
            />
        </div>
    );
}

/* Pulso: una cabeza breve y una estela discreta que siguen exactamente el trazado de la conexión */
function lanzar(g: SVGGElement, r: Ruta) {
    const ns = 'http://www.w3.org/2000/svg',
        grupo = document.createElementNS(ns, 'g');
    grupo.setAttribute('class', LINK_CLASS[r.color]);
    const cola = document.createElementNS(ns, 'path'),
        cab = document.createElementNS(ns, 'path');
    for (const [p, c] of [
        [cola, 'pulso-cola'],
        [cab, 'pulso-cabeza'],
    ] as const) {
        p.setAttribute('d', r.d);
        p.setAttribute('class', c);
        grupo.appendChild(p);
    }
    g.appendChild(grupo);
    const L = cab.getTotalLength(),
        dur = Math.max(2200, L * 6.5);
    cab.setAttribute('stroke-dasharray', `2 ${L + 40}`);
    cola.setAttribute('stroke-dasharray', `34 ${L + 80}`);
    const opc = { duration: dur, easing: 'cubic-bezier(.45,0,.35,1)' };
    cab.animate(
        [
            { strokeDashoffset: 2, opacity: 0 },
            { opacity: 1, offset: 0.06 },
            { opacity: 1, offset: 0.9 },
            { strokeDashoffset: -L, opacity: 0 },
        ],
        opc,
    );
    cola.animate(
        [{ strokeDashoffset: 36 }, { strokeDashoffset: -L + 32 }],
        opc,
    );
    setTimeout(() => grupo.remove(), dur + 50);
}
