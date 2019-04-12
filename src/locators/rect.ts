import { Coords } from "./coords";

export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public get x2(): number { return this.x + this.width; }
    public get y2(): number { return this.y + this.height; }

    move(deltaX: number, deltaY: number): Rect {
        return new Rect(this.x + deltaX, this.y + deltaY, this.width, this.height);
    }

    collidesWith(rect: Rect): boolean {
        return (
            this.x2 > rect.x &&
            rect.x2 > this.x &&
            this.y2 > rect.y &&
            rect.y2 > this.y );
    }

    getRandomLocation(): Coords {
        let x = Math.round(this.x + (Math.random() * this.width));
        if (x < this.x) { x = this.x; }
        if (x > this.x2) { x = this.x2; }

        let y = Math.round(this.y + (Math.random() * this.height));
        if (y < this.y) { y = this.y; }
        if (y > this.y2) { y = this.y2; }
        
        return new Coords(x, y);
    }
}