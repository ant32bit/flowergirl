import { Rect, Coords } from "../locators";

export class ViewportService {
    private _canvas: HTMLCanvasElement = null;
    private get currState(): ViewportState { 
        this._getCanvas();
        return new ViewportState(this._canvas); 
    }
    
    public getVisibleRect(): Rect {
        return this.currState.getVisibleRect();
    }

    public translate(clientX: number, clientY: number): Coords {
        return this.currState.translateFromClient(clientX, clientY);
    }

    private _getCanvas() {
        if (this._canvas == null) {
            this._canvas = <HTMLCanvasElement>document.getElementById('viewport');
        }
    }
}

class ViewportState {
    private _ratio: number;
    private _width: number;
    private _height: number;

    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    constructor(canvas: HTMLCanvasElement) {
        this._ratio = window.devicePixelRatio;
        this._width = canvas.clientWidth;
        this._height = canvas.clientHeight;
    }

    public translateFromClient(x: number, y: number): Coords {
        const midX = Math.round(this._width / 2);
        const midY = Math.round(this._height / 2);

        return new Coords((x - midX) / this._ratio, (y - midY) / this._ratio);
    }

    public getVisibleRect(): Rect {
        const width = this._width / this._ratio;
        const height = this._height / this._ratio;
        const x = -Math.round(width / 2);
        const y = -Math.round(height / 2);
        return new Rect(x, y, width, height);
    }
}