import { Coords } from "./coords";
import { Rect } from "./rect";

export class Circle {
    radius: number;
    centre: Coords;

    constructor(cx: number, cy: number, r: number) {
        this.radius = r;
        this.centre = new Coords(cx, cy);
    }

    translatePolar(radians: number, magnitude: number) {
        const xOffset = magnitude * this.radius * Math.cos(radians);
        const yOffset = magnitude * this.radius * -Math.sin(radians);

        return this.centre.move(xOffset, yOffset);
    }

    contains(point: Coords): boolean {
        return this.centre.distance(point) <= this.radius;
    }

    intersectsWith(circle: Circle): boolean {
        return this.centre.distance(circle.centre) <= this.radius + circle.radius;
    }

    collidesWith(rect: Rect, debug: boolean = false): boolean {
        if (this.centre.within(rect)) { 
            return true; 
        }

        const d = 2 * this.radius;
        const circleBoundingRect = new Rect(this.centre.x - this.radius, this.centre.y - this.radius, d, d);
        
        if (!circleBoundingRect.collidesWith(rect)) {
            return false;
        }

        const x1 = rect.x;
        const x2 = rect.x2;
        const y1 = rect.y;
        const y2 = rect.y2;

        const ys = [];
        if (y1 > circleBoundingRect.y) { ys.push(y1); }
        if (y2 < circleBoundingRect.y2) { ys.push(y2); }

        for (const y of ys) {
            const theta = Math.asin((y - this.centre.y) / this.radius);
            const ox = Math.abs(this.radius * Math.cos(theta));
            const px1 = this.centre.x - ox;
            const px2 = this.centre.x + ox;

            if (px1 <= x2 && px2 >= x1) {
                return true;
            }
        }

        const xs = [];
        if (x1 > circleBoundingRect.x) { xs.push(x1); }
        if (x2 < circleBoundingRect.x2) { xs.push(x2); }

        for (const x of xs) {
            const theta = Math.acos((x - this.centre.x) / this.radius);
            const oy = Math.abs(this.radius * Math.sin(theta));
            const py1 = this.centre.y - oy;
            const py2 = this.centre.y + oy;

            if (py1 <= y2 && py2 >= y1) {
                return true;
            }
        }

        return false;
    }

    getRandomLocation(): Coords {
        return this.translatePolar(Math.random() * 2 * Math.PI, Math.random());
    }
}