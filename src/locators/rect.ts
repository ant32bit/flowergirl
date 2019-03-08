
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

    collidesWith(rect: Rect): boolean {
        return (
            this.x + this.width > rect.x &&
            rect.x + rect.width > this.x &&
            this.y + this.height > rect.y &&
            rect.y + rect.height > this.y );
    }
}