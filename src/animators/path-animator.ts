import { IAnimator } from "./animator";
import { Coords, Direction } from "../locators";
import { DrawContext } from "../services";

type PathType = 'linear'|'bezier';

export class PathAnimator implements IAnimator<LocationVector> {

    private start: Coords;
    private end: Coords;
    private duration: number;

    private path: IPath;

    private currTime: number;
    private currVector: LocationVector;

    constructor(start: Coords, end: Coords, pace: number, type: PathType = 'linear') {
        this.start = start.move(0,0);
        this.end = end.move(0,0);
        this.duration = Math.ceil(start.distance(end) / pace);

        switch(type) {
            case 'bezier':
                this.path = new BezierPath(start, end);
                break;

            case 'linear':
            default:
                this.path = new LinearPath(start, end);
                break;
        }

        this.reset();
    }

    next(nTicks: number): LocationVector {
        this.currTime += nTicks;
        if (this.currTime > this.duration) {
            this.currTime = this.duration;
        }

        this.currVector = this._getVector();

        return this.currVector;
    }    
    
    value(): LocationVector {
        return this.currVector;
    }
    
    finished(): boolean {
        return this.currTime >= this.duration;
    }
    
    reset(): void {
        this.currTime = 0;
        this.currVector = this._getVector();
    }

    percentCompleted(): number { return this.duration > 0 ? this.currTime / this.duration : 1; }
    destination(): Coords { return this.end.move(0,0); }

    draw(context: DrawContext, xOffset: number, yOffset: number) {
        this.path.draw(context, xOffset, yOffset);
    }

    private _getVector(): LocationVector {
        this.path.calculate(this._ease())
        const position = this.path.position();
        
        return new LocationVector(position, this._direction());
    }


    private _ease(): number {
        if (this.duration === 0) {
            return 1;
        }

        const t = (this.currTime / this.duration) * Math.PI;
        const eased = -Math.cos(t) / 2 + 0.5;
        return eased;
    }

    private _direction(): Direction {

        const tangent = this.path.tangent();

        const deltaX = tangent[1].x - tangent[0].x;
        const deltaY = tangent[1].y - tangent[0].y;

        if (deltaX == 0) {
            return deltaY >= 0 ? 's' : 'n';
        }
        else if (deltaY == 0) {
            return deltaX > 0 ? 'e' : 'w';
        }

        const m = deltaX / deltaY;
        const absM = Math.abs(m);

        if (absM < 0.5) {
            return deltaY < 0 ? 'n' : 's';
        }
        else if (absM <= 1) {
            return <Direction>((deltaY < 0 ? 'n' : 's') + (deltaX > 0 ? 'e' : 'w'));
        }
        else {
            const invM = deltaY / deltaX;

            if (Math.abs(invM) < 0.5) {
                return deltaX > 0 ? 'e' : 'w';
            }
            else {
                return <Direction>((deltaY < 0 ? 'n' : 's') + (deltaX > 0 ? 'e' : 'w'));
            }
        }
    }
}

export class LocationVector {
    public get position(): Coords { return this._position; }
    public get direction(): Direction { return this._direction; }

    constructor(private _position: Coords, private _direction: Direction) {}
}

interface IPath {
    calculate(t: number): void;
    position(): Coords;
    draw(context: DrawContext, xOffset: number, yOffset: number);
    tangent(): Coords[];
}

class BezierPath implements IPath {
    private p0: Coords;
    private p1: Coords;
    private p2: Coords;

    private q0: Coords;
    private q1: Coords;
    private b: Coords;

    constructor(p0: Coords, p2: Coords) {
        this.p0 = p0.move(0,0);
        this.p2 = p2.move(0,0);
        this._setP1();
        this.calculate(0);
    }

    public calculate(t: number) {
        const dx_p0p1 = this.p1.x - this.p0.x;
        const dy_p0p1 = this.p1.y - this.p0.y;
        this.q0 = new Coords(this.p0.x + dx_p0p1 * t, this.p0.y + dy_p0p1 * t);

        const dx_p1p2 = this.p2.x - this.p1.x;
        const dy_p1p2 = this.p2.y - this.p1.y;
        this.q1 = new Coords(this.p1.x + dx_p1p2 * t, this.p1.y + dy_p1p2 * t);

        this.b = new Coords(
            this.q0.x + (this.q1.x - this.q0.x) * t,
            this.q0.y + (this.q1.y - this.q0.y) * t);
    }

    public position(): Coords {
        return this.b.move(0,0);
    }

    public draw(context: DrawContext, xOffset: number, yOffset: number) {
        const p0 = context.translate(this.p0.move(xOffset, yOffset));
        const p1 = context.translate(this.p1.move(xOffset, yOffset));
        const p2 = context.translate(this.p2.move(xOffset, yOffset));
        const q0 = context.translate(this.q0.move(xOffset, yOffset));
        const q1 = context.translate(this.q1.move(xOffset, yOffset));

        context.canvas.beginPath();
        context.canvas.moveTo(p0.x, p0.y);
        context.canvas.lineTo(p1.x, p1.y);
        context.canvas.lineTo(p2.x, p2.y);
        context.canvas.strokeStyle = 'blue';
        context.canvas.stroke();

        context.canvas.beginPath();
        context.canvas.moveTo(q0.x, q0.y);
        context.canvas.lineTo(q1.x, q1.y);
        context.canvas.strokeStyle = 'yellow';
        context.canvas.stroke();
    }

    public tangent(): Coords[] {
        return [this.q0.move(0,0), this.q1.move(0,0)];
    }

    private _setP1() {
        const deltaX = this.p2.x - this.p0.x;
        const deltaY = this.p2.y - this.p0.y;

        const scale = Math.random() * 0.5 - 0.25;
        const middness = 0.3 + Math.random() * 0.4;

        const middishPoint = new Coords(
            this.p0.x + deltaX * middness,
            this.p0.y + deltaY * middness);

        this.p1 = middishPoint.move(
            deltaY * scale,
            -deltaX * scale);
    }
}

class LinearPath implements IPath {
    private start: Coords;
    private end: Coords;

    private deltaX: number;
    private deltaY: number;

    private currPos: Coords;

    constructor(start: Coords, end: Coords) {
        this.start = start.move(0,0);
        this.end = end.move(0,0);
        this.deltaX = end.x - start.x;
        this.deltaY = end.y - start.y;
        this.calculate(0); 
    }

    public calculate(t: number) {
        this.currPos = new Coords(
            this.start.x + (this.deltaX * t), 
            this.start.y + (this.deltaY * t)
        );
    }

    public position(): Coords {
        return this.currPos.move(0,0);
    }
    
    public draw(context: DrawContext, xOffset: number, yOffset: number) {
        const start = context.translate(this.start.move(xOffset, yOffset));
        const end = context.translate(this.end.move(xOffset, yOffset));
        context.canvas.beginPath();
        context.canvas.moveTo(start.x, start.y);
        context.canvas.lineTo(end.x, end.y);
        context.canvas.strokeStyle = 'blue';
        context.canvas.stroke();
    }

    public tangent(): Coords[] {
        return [this.start.move(0,0), this.end.move(0,0)];
    }
}

class BezierState {
    p0: Coords;
    p1: Coords;
    p2: Coords;
    q0: Coords;
    q1: Coords;
    b: Coords;

    constructor(p0: Coords, p1: Coords, p2: Coords, t: number) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;

        const dx_p0p1 = p1.x - p0.x;
        const dy_p0p1 = p1.y - p0.y;
        this.q0 = new Coords(p0.x + dx_p0p1 * t, p0.y + dy_p0p1 * t);

        const dx_p1p2 = p2.x - p1.x;
        const dy_p1p2 = p2.y - p1.y;
        this.q1 = new Coords(p1.x + dx_p1p2 * t, p1.y + dy_p1p2 * t);

        this.b = new Coords(
            this.q0.x + (this.q1.x - this.q0.x) * t,
            this.q0.y + (this.q1.y - this.q0.y) * t);
    }
}