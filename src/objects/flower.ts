import { Coords, Rect } from "../locators";
import { ArrayAnimator } from "../animators";
import { ServiceProvider, DrawContext, GameSettings } from "../services";

const serviceProvider = new ServiceProvider();
export type FlowerState = 'blooming' | 'alive' | 'dead' | 'gone'

export class Flower {
    public type: string;
    public location: Coords;
    public state: FlowerState;
    public boundingRect: Rect;

    private _bloom: ArrayAnimator<string>;
    private _alive: ArrayAnimator<string>;
    private _dead: string;
    private _hit: string;

    private static _deathDuration = 16;
    private static _hitDuration = 2;
    private static _boundingRect: Rect = new Rect(3, 24, 10, 10); 

    private _timeOfDeath?: number = null;
    private _timeOfHit?: number = null;
    private _currTime: number = 0;

    constructor(location: Coords) {
        this.location = new Coords(location.x - 8, location.y - 29);
        this.type = ['daisy', 'rose'][Math.floor(Math.random() * 2)];
        this.state = 'blooming';

        this._bloom = serviceProvider.SpriteService.getAnimator(this.type + '-blooming');
        this._alive = serviceProvider.SpriteService.getAnimator(this.type);
        this._dead = `flower:${this.type}-dead`;
        this._hit = `flower:${this.type}-dead-float`;

        this.boundingRect = new Rect(
            this.location.x + Flower._boundingRect.x, 
            this.location.y + Flower._boundingRect.y,
            Flower._boundingRect.width,
            Flower._boundingRect.height);
    }

    update(ticks: number) {
        this._currTime += ticks;

        if (this.state === 'blooming') {
            this._bloom.next(ticks);

            if (this._bloom.finished()) {
                this.state = 'alive';
            }
        }
        else if (this.state === 'alive') {
            this._alive.next(ticks);
        }

        if (this.state === 'dead' && this._currTime - this._timeOfDeath > Flower._deathDuration) {
            this.state = 'gone';
        }

        if (this._timeOfHit != null && this._currTime - this._timeOfHit > Flower._hitDuration) {
            this._timeOfHit = null;
        }
    }

    hit() {
        if (this.state !== 'gone')
            this.state = 'dead';

        this._timeOfHit = this._currTime;
        if (this._timeOfDeath == null) {
            this._timeOfDeath = this._currTime;
        }
    }

    draw(context: DrawContext) {
        if (GameSettings.Debug) {
            context.drawBoundingRect(this.boundingRect);
        }

        if (this.state === 'blooming') {
            serviceProvider.SpriteService.drawSprite(context, this._bloom.value(), this.location)
        }
        else if (this.state === 'alive') {
            serviceProvider.SpriteService.drawSprite(context, this._alive.value(), this.location);
        }
        else if (this.state === 'dead') {
            if (this._timeOfHit != null) {
                serviceProvider.SpriteService.drawSprite(context, this._hit, this.location);
            }
            else {
                serviceProvider.SpriteService.drawSprite(context, this._dead, this.location);
            }
        }
    }
}