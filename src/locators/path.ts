import { Coords } from "./coords";
import { Rect } from "./rect";

export type Direction = 's'|'se'|'e'|'ne'|'n'|'nw'|'w'|'sw';

export class Path {
    private _currLocation: Coords;
    private _destination: Coords;
    private _direction: Direction;
    private _obstacles: Rect[];
    private _segments: PathSegment[];

    constructor(a: Coords, b: Coords, obstacles: Rect[] = []) {
        this._currLocation = a;
        this._destination = b;
        this._obstacles = obstacles;

        this._calculatePath();
        this._direction = this.finished ? 's' : this._segments[0].direction;
    }

    public get direction(): Direction { return this._direction; }
    public get location(): Coords { return this._currLocation.move(0,0) }
    public get finished(): boolean { return this._segments.length === 0; }

    private _calculatePath() {
        let deltaX = this._destination.x - this._currLocation.x;
        let deltaY = this._destination.y - this._currLocation.y;

        const segments: PathSegment[] = []
        while (deltaX != 0 || deltaY != 0) {
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            const vectorX = deltaX / (absDeltaX > 0 ? absDeltaX : 1);
            const vectorY = deltaY / (absDeltaY > 0 ? absDeltaY : 1);

            if (absDeltaY >= absDeltaX) {
                const distance = absDeltaX > 0 ? absDeltaX : absDeltaY;
                segments.push(new PathSegment(new Coords(vectorX, vectorY), distance));
                deltaY -= distance * vectorY;
                deltaX = 0;
            }
            else {
                const distance = absDeltaY > 0 ? absDeltaY : absDeltaX;
                segments.push(new PathSegment(new Coords(vectorX, vectorY), distance));
                deltaX -= distance * vectorX;
                deltaY = 0;
            }
        }

        console.log(segments);
        this._segments = segments;
    }

    public move(distance: number) {
        while (distance > 0) {
            distance = this._getNewLocation(distance);
        }
    }

    private _getNewLocation(distance: number): number {
        if (this._segments.length === 0) {
            return 0;
        }

        const segment = this._segments[0];
        const ratio = Math.sqrt(segment.direction.length);

        this._direction = segment.direction;
        
        let step = Math.round(distance / ratio);
        if (step === 0) { step = 1; }

        let leftover = 0

        if (step > segment.distance) {
            step = segment.distance;
            leftover = Math.round((step - segment.distance) * ratio)
        }

        this._currLocation =  this._currLocation.move(
            step * segment.vector.x,
            step * segment.vector.y
        );

        segment.distance -= step;
        if (segment.distance === 0) {
            this._segments.shift();
        }

        return leftover;
    }
}

class PathSegment {
    direction: Direction;
    distance: number;
    vector: Coords;

    constructor (vector: Coords, distance: number) {
        this.vector = vector.move(0,0);
        this.distance = distance;

        let direction = '';
        if (vector.y > 0) {
            direction = 's';
        } else if (vector.y < 0) {
            direction = 'n';
        }

        if (vector.x > 0) {
            direction += 'e';
        } else if (vector.x < 0) {
            direction += 'w'
        }

        if (direction === '') {
            direction = 's';
        }

        this.direction = <Direction>direction;
    }
}