
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

    collidesWith(rect: Rect): boolean {
        return (
            this.x2 > rect.x &&
            rect.x2 > this.x &&
            this.y2 > rect.y &&
            rect.y2 > this.y );
    }
}