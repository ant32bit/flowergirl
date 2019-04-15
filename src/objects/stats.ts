import { Coords, Direction } from "../locators";
import { GirlState, Girl } from "./girl";
import { FlowerState } from "./flower";
import { DrawContext, GameSettings, ServiceProvider } from "../services";

export class StatsDiv {
    private _viewport = new ServiceProvider().ViewportService;
    private _element: HTMLDivElement;
    private _title: string;
    private _content: string;
    private _position: Coords;

    constructor(title: string) { 
        this._title = title ? `<strong>${title}</strong><br>` : '';
        this._content = this._title;
        this._position = new Coords(0,0)
    }
    
    setInfo(html: string) {
        this._content = this._title + html;
    }

    setPosition(p: Coords) {
        this._position = p.move(0,0);
    }

    show() {
        const pos = this._viewport.project(this._position);

        this._ensure();
        this._element.style.left = pos[0] + 'px';
        this._element.style.top = pos[1] + 'px';
        this._element.innerHTML = this._content;
    }
    
    delete() {
        if (this._element) {
            if (this._element.parentNode) {
                this._element.parentNode.removeChild(this._element);
            }

            this._element = null;
        }
    }

    private _ensure() {
        if (!this._element) {
            
            this._element = document.createElement('div');
            this._element.classList.add('debug-info');
            
            const container = document.getElementById('debug-container');
            if (container) {
                this._element = container.appendChild(this._element);
            }
        }
    }
    
}
