import { DrawContext } from "../services";
import { Coords } from "./coords";

export type Direction = 's'|'se'|'e'|'ne'|'n'|'nw'|'w'|'sw';
export class Path {
    private _currLocation: Coords;
    private _destination: Coords;
    private _direction: Direction;
    private _segments: PathSegment[];

    constructor(a: Coords, b: Coords, segments: PathSegment[]) {
        this._currLocation = a;
        this._destination = b;
        this._segments = segments;
        this._direction = this.finished ? 's' : this._segments[0].direction;
    }

    public get direction(): Direction { return this._direction; }
    public get location(): Coords { return this._currLocation.move(0,0) }
    public get finished(): boolean { return this._segments.length === 0; }

    public move(distance: number) {
        while (distance > 0) {
            distance = this._getNewLocation(distance);
        }
    }

    public then(path: Path): Path {
        if (path._currLocation.equals(this._destination)) {
            this._segments.push(...path._segments);
        }

        return this;
    }

    public draw(context: DrawContext, xOffset: number = 0, yOffset: number = 0) {
        let a = context.translate(this._currLocation.move(xOffset, yOffset));
        
        context.canvas.beginPath();
        context.canvas.moveTo(a.x, a.y);

        for(const segment of this._segments) {
            a = a.move(segment.distance * segment.vector.x, segment.distance * segment.vector.y);
            context.canvas.lineTo(a.x, a.y);
        }

        context.canvas.strokeStyle = 'blue';
        context.canvas.stroke();
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

export class PathSegment {
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