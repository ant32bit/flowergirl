import { Coords, Rect, Circle } from "../locators";
import { GameSettings } from "./game-settings";
import { StatsDiv } from "../objects/stats";
import { ViewportService } from "./viewport-service";

export class GameLoopService {
    private _frameFn: (callback: () => void) => void;
    private _started: boolean = false;
    private _renderts: number = 0;
    private _updateFn: (context: UpdateContext) => void = null;
    private _drawFn: (context: DrawContext) => void = null;
    private _ticker: number = 0;
    private _clicks: Coords[] = [];
    private _statsDiv: StatsDiv;

    constructor(private _viewport: ViewportService) {
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
                let fps = -1;
                let h_interval = 0;
                let intervalFn = () => { 
                    if (GameSettings.FPS !== fps) {
                        if (h_interval) {
                            clearInterval(h_interval);
                        }

                        fps = GameSettings.FPS;
                        h_interval = setInterval(intervalFn, 1000/fps);
                        return;
                    }

                    callback(Date.now()); 
                };

                intervalFn();
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

        // needs to be done here as constructor is called during Service Provider construction
        this._statsDiv = new StatsDiv(null);

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

        const stats = new Stats();
        stats.FrameRate = ts - this._renderts;

        if (this.updateTicker(ts)) {

            const r_updateStart = Date.now();

            if (this._updateFn) {
                const clicks = this._clicks;
                this._clicks = [];
                const updateContext = new UpdateContext(this._ticker, clicks);
                this._updateFn(updateContext);
            }
        
            const canvas = <HTMLCanvasElement>document.getElementById('viewport');
            const drawContext = new DrawContext(canvas);

            const r_drawStart = Date.now();

            if (this._drawFn) {
                this._drawFn(drawContext);
            }

            const r_finished = Date.now();

            stats.UpdateTime = r_drawStart - r_updateStart;
            stats.DrawTime = r_finished - r_drawStart;
            stats.update(this._statsDiv);
            
            if (GameSettings.Debug) {
                this._statsDiv.setPosition(this._viewport.translate(0,0).move(5,5));
                this._statsDiv.show();
            }
            else {
                this._statsDiv.delete();
            }
        }
    }

    private updateTicker(ts: number): boolean {
        const mspf = 1000 / GameSettings.FPS;
        let diff = ts - this._renderts;
        let ticks = 0;

        while (diff >= mspf) {
            diff -= mspf;
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
        const doc = document.documentElement;
        const xOffset = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        const yOffset = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

        this._clicks.push(this._viewport.translate(event.clientX + xOffset, event.clientY + yOffset));
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
    private _ratio: number;

    public get canvas(): CanvasRenderingContext2D { return this._canvas; }

    constructor(canvas: HTMLCanvasElement) {

        this._ratio = window.devicePixelRatio;
        this._width = canvas.clientWidth / this._ratio;
        this._height = canvas.clientHeight / this._ratio;
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

    public drawBoundingRect(rect: Rect, color: string = 'red') {
        const translatedRect = this.translate(new Coords(rect.x, rect.y))
        this.canvas.strokeStyle = color;
        this.canvas.strokeRect(translatedRect.x, translatedRect.y, rect.width, rect.height);
    }

    public drawBoundingCircle(circle: Circle, color: string = 'red') {
        const translatedCircle = this.translate(circle.centre);
        this.canvas.beginPath();
        this.canvas.arc(translatedCircle.x, translatedCircle.y, circle.radius, 0, 2 * Math.PI);
        this.canvas.strokeStyle = color;
        this.canvas.stroke();
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
        return new Coords(Math.round(loc.x + this._midX), Math.round(loc.y + this._midY));
    }

    public draw(drawables: IDrawable[]) {
        const sorted = drawables.sort(this._orderByZ);
        for (const drawable of sorted) {
            drawable.draw(this);
        }
    }

    private _orderByZ(a: IDrawable, b: IDrawable): number {
        if (a.zIndex < b.zIndex) {
            return -1;
        }
        
        if (a.zIndex > b.zIndex) {
            return 1;
        }

        return 0;
    }
}

export interface IDrawable {
    zIndex: number;
    boundingBox: Rect;
    draw(context: DrawContext): void;
}

class Stats {
    FrameRate: number = 0;
    UpdateTime: number = 0;
    DrawTime: number = 0;

    update(div: StatsDiv) {
        div.setPosition(new Coords(0,0));
        div.setInfo(this._toText().join('<br>'));
    }

    private _toText(): string[] {
        const fps = this.FrameRate > 0 ? 1000 / this.FrameRate : 0;
        return [
            `FPS: ${fps}`,
            `Total: ${this.FrameRate}ms`,
            `Update: ${this.UpdateTime}ms`,
            `Draw: ${this.DrawTime}ms`,
            '',
            '<strong>Settings</strong>',
            `FrameRate: ${GameSettings.FPS} FPS`,
            `Search: ${GameSettings.Algorithm}`,
            `Pace: ${GameSettings.Pace} pixels`,
            `Flock Radius: ${GameSettings.FlockRadius} pixels`,
            `Debug Mode: ${GameSettings.Debug ? 'on' : 'off'}`
        ];
    }
}