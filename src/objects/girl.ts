import { Coords, Rect, Path } from "../locators";
import { ServiceProvider, DrawContext } from "../services";
import { ArrayAnimator } from "../animators";
import { House } from "./house";
import { Flower } from "./flower";

export type GirlState = 'moving' | 'waiting' | 'attacking' | 'returning';
const __sprites = new ServiceProvider().SpriteService;

export class Girl {
    private _homeLocation: Coords = new Coords(-14, 9);
    
    private _animators: {[direction: string]: ArrayAnimator<string>} = 
        's,se,e,ne,n,nw,w,sw'.split(',')
        .reduce((animators, direction) => {
            animators[direction] = __sprites.getAnimator(`girl-walking-${direction}`);
            return animators;
        }, {});

    private _movement = new ArrayAnimator<number>([3,3,0], true);

    private _obstacles: Rect[] = [ House.boundingRect ];
    private _currTarget: Flower = null;

    private _path: Path = new Path(this._homeLocation, this._homeLocation.move(0, 20), this._obstacles);
    private _state: GirlState = 'moving';
    
    constructor() {
    }

    public get state(): GirlState { return this._state; }
    public get target(): Flower { return this._currTarget; }
    public set target(value: Flower) {
        this._currTarget = value;
        this._path = new Path(this._path.location, value.location, this._obstacles);
        this._state = 'moving';
    }

    getBoundingRect() {
        return new Rect(this._path.location.x, this._path.location.y, 32, 32);
    }

    goHome() {

    }

    update(ticks: number) {
        for (let i = 0; i < ticks; i++) {
            if (this._state === 'moving') {
                Object.keys(this._animators).forEach(x => this._animators[x].next(1));
                this._movement.next(1);
    
                this._path.move(this._movement.value());
            }
        }

        if (this._path.finished) {
            this._state = 'waiting';
        }
    }

    draw(context: DrawContext) {
        if (this._state === 'moving' || this._state === 'returning')
            __sprites.drawSprite(context, this._animators[this._path.direction].value(), this._path.location);
        else if (this._state === 'waiting')
            __sprites.drawSprite(context, `girl:${this._path.direction}`, this._path.location);
    }

    
    
}