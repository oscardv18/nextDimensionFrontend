import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { CameraFlight } from './camera-flight';

it('alcanza exactamente el destino en tiempo real a 2–120 FPS', () => {
    for (const fps of [2, 10, 30, 60, 120]) {
        const flight = new CameraFlight(),
            position = new Vector3(),
            target = new Vector3();
        const goal = {
            position: new Vector3(100, 60, -40),
            target: new Vector3(20, 5, 0),
        };
        flight.begin(position, target, goal, 20000);
        let now = 20000,
            done = false;
        while (!done) {
            now += 1000 / fps;
            done = flight.sample(position, target, now);
        }
        expect(now - 20000).toBeLessThanOrEqual(1200 + 1000 / fps + 1e-6);
        expect(position.toArray()).toEqual(goal.position.toArray());
        expect(target.toArray()).toEqual(goal.target.toArray());
    }
});
it('interrumpe desde la posición visible, ignora el reposo previo y finaliza tras un bloqueo', () => {
    const flight = new CameraFlight(),
        position = new Vector3(),
        target = new Vector3();
    const first = {
        position: new Vector3(100, 50, 100),
        target: new Vector3(10, 0, 0),
    };
    flight.begin(position, target, first, 80000);
    flight.sample(position, target, 80600);
    const interrupted = position.clone();
    const last = {
        position: new Vector3(-70, 30, 10),
        target: new Vector3(-20, 0, 0),
    };
    flight.begin(position, target, last, 80600);
    expect(flight.sample(position, target, 80600)).toBe(false);
    expect(position.toArray()).toEqual(interrupted.toArray());
    expect(flight.sample(position, target, 90000)).toBe(true);
    expect(position.toArray()).toEqual(last.position.toArray());
});
it('muestrea la misma trayectoria en instantes comunes con cadencias irregulares', () => {
    const flight = new CameraFlight(),
        position = new Vector3(),
        target = new Vector3();
    const goal = {
        position: new Vector3(10, 20, 30),
        target: new Vector3(5, 4, 3),
    };
    flight.begin(position, target, goal, 0);
    for (const now of [5, 20, 130, 450, 600])
        flight.sample(position, target, now);
    expect(position.toArray()).toEqual([5, 10, 15]);
    expect(target.toArray()).toEqual([2.5, 2, 1.5]);
});
