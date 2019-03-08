import { Coords } from "../locators";
import { ArrayAnimator } from "../animators";
import { ServiceProvider, DrawContext } from "../services";

const serviceProvider = new ServiceProvider();
export type FlowerState = 'blooming' | 'alive' | 'dead' | 'hit'

export class Flower {
    public type: string;
    public location: Coords;
    public state: FlowerState;

    private _bloomAnimator: ArrayAnimator<string>;
    private _bloom: string;
    private _sprite: string;
    private _dead: string;
    private _deadFloat: string;

    constructor(location: Coords) {
        this.location = new Coords(location.x - 8, location.y - 29);
        this.type = ['daisy', 'rose'][Math.floor(Math.random() * 2)];
        this.state = 'blooming';

        this._bloomAnimator = serviceProvider.SpriteService.getAnimator(this.type + '-blooming');
        this._bloom = 'flower:b0';
        this._sprite = `flower:${this.type}`;
        this._dead = `flower:${this.type}-dead`;
        this._deadFloat = `flower:${this.type}-dead-float`;

        console.log(this);
    }

    update(ticks: number) {
        if (this.state === 'blooming') {
            this._bloom = this._bloomAnimator.next(ticks);

            if (this._bloomAnimator.finished()) {
                this.state = 'alive';
            }
        }
    }

    draw(context: DrawContext) {
        if (this.state === 'blooming') {
            serviceProvider.SpriteService.drawSprite(context, this._bloom, this.location)
        }
        else if (this.state === 'alive') {
            serviceProvider.SpriteService.drawSprite(context, this._sprite, this.location);
        }
    }
}