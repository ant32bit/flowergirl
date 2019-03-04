import { Coords } from "../objects/coords";
import { Rect } from "../objects/rect";

export class GameLoopService {
    
    private static _fps = 8;
    private static _mspf = 1000 / GameLoopService._fps
    private _frameFn: (callback: () => void) => void;
    private _started: boolean = false;
    private _renderts: number = 0;
    private _updateFn: (context: UpdateContext) => void = null;
    private _drawFn: (context: DrawContext) => void = null;
    private _ticker: number = 0;
    private _clicks: Coords[] = [];

    constructor() {
        if (window.requestAnimationFrame) {
            this._frameFn = (callback: (ts:number) => void) => {
                const _callback = (hrts: number) => { callback(hrts); requestAnimationFrame(_callback); }
                _callback(0);
            }
        } else if (window.webkitRequestAnimationFrame) {
            this._frameFn = (callback: (ts:number) => void) => {
                const _callback = (hrts: number) => { callback(hrts); webkitRequestAnimationFrame(_callback); }
                _callback(0);
            };
        } else {
            this._frameFn = (callback: (ts:number) => void) => {
                setInterval(() => { callback(Date.now()); }, GameLoopService._mspf);
            }
        }
    }

    public set update(value: (context: UpdateContext) => void) {
        if (value != null) {
            this._updateFn = value;
        }
    }

    public set draw(value: (context: DrawContext) => void) {
        if (value != null) {
            this._drawFn = value;
        }
    }

    public start(): boolean {
        if (!this._started && this._updateFn && this._drawFn) {
            document.getElementById('viewport').addEventListener('click', this.getClick.bind(this))
            this._frameFn(this.run.bind(this));
            this._started = true;
        }

        return this._started;
    }

    private run(ts: number) {

        if (this._renderts === 0) {
            this._renderts = ts;
            return;
        }

        if (this.updateTicker(ts)) {

            if (this._updateFn) {
                const clicks = this._clicks;
                this._clicks = [];
                this._updateFn(new UpdateContext(this._ticker, clicks))
            }
        
            if (this._drawFn) {
                const canvas = <HTMLCanvasElement>document.getElementById('viewport');
                this._drawFn(new DrawContext(canvas));
            }
        }
    }

    private updateTicker(ts: number): boolean {
        let diff = ts - this._renderts;
        let ticks = 0;

        while (diff >= GameLoopService._mspf) {
            diff -= GameLoopService._mspf;
            ticks++;
        }

        if (ticks > 0) {
            this._ticker += ticks;
            this._renderts = ts - diff;
            return true;
        }
        
        return false;
    }

    private getClick(event: MouseEvent) {
        const midX = Math.round(event.srcElement.clientWidth / 2);
        const midY = Math.round(event.srcElement.clientHeight / 2);
        const x = event.clientX;
        const y = event.clientY;

        this._clicks.push(new Coords(x - midX, y - midY));
    }
}

export class UpdateContext {
    public get tick(): number { return this._tick; }
    public get locations(): Coords[] { return this._locations; }

    constructor(private _tick: number, private _locations: Coords[]) { }
}

export class DrawContext {
    private _canvas: CanvasRenderingContext2D;
    private _midX: number;
    private _midY: number;
    private _width: number;
    private _height: number;

    public get canvas(): CanvasRenderingContext2D { return this._canvas; }

    constructor(canvas: HTMLCanvasElement) {

        this._width = canvas.clientWidth;
        this._height = canvas.clientHeight;
        this._midX = Math.round(this._width / 2);
        this._midY = Math.round(this._height / 2);

        canvas.width = this._width;
        canvas.height = this._height;

        this._canvas = canvas.getContext('2d');
    }

    public fill(color: string) {
        this._canvas.rect(0, 0, this._width, this._height);
        this._canvas.fillStyle = color;
        this._canvas.fill();
    }

    public isVisible(rect: Rect) {
        const start = this.translate(new Coords(rect.x, rect.y));
        if (start.x > this._width) return false;
        if (start.y > this._height) return false;
        if (start.x + rect.width < 0) return false;
        if (start.y + rect.height < 0) return false;

        return true;
    }

    public translate(loc: Coords): Coords {
        return new Coords(loc.x + this._midX, loc.y + this._midY);
    }
}

