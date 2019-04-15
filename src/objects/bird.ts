import { Coords, Direction, Rect } from "../locators";
import { ServiceProvider, DrawContext, GameSettings, IDrawable } from "../services";
import { PathAnimator, ArrayAnimator } from "../animators";
import { StatsDiv } from "./stats";

export type BirdState = 'flying'|'feeding'|'standing';

const _serviceProvider = new ServiceProvider();

export class Bird implements IDrawable {
    private static _relativeBoundingRect: Rect = new Rect(0, 8, 16, 8);
    
    private _state: BirdState;
    public get state(): BirdState { return this._state; };
    public set target(value: Coords) {
        const currLocation = this._path.value().position;
        const pathDistance = currLocation.distance(value);
        this._path = new PathAnimator(currLocation, value, 10, pathDistance < 50 ? 'linear' : 'bezier');
        
        this._maxElevation = pathDistance > 50 ? 25 : (pathDistance / 2);
        this._state = 'flying';
    }

    private _maxElevation: number;
    private _elevation: number;

    private _path: PathAnimator;
    private _feeding: ArrayAnimator<string>;
    private _flying: {[direction: string]: ArrayAnimator<string>} = (function() {
        const animations = {};

        for (const direction of 's,se,e,ne,n,nw,w,sw'.split(',')) {
            animations[direction] = _serviceProvider.SpriteService.getAnimator('bird-flying-' + direction);
        }

        return animations;
    })();

    private _stats: StatsDiv;
    public get location(): Coords {
        const location = this._path.value().position;
        return new Coords(Math.round(location.x), Math.round(location.y));
    }

    constructor() {        
        this._setRandomStartLocation();
        this.target = new Coords(0,0);
        this.feed(0);

        this._stats = new StatsDiv('Bird');
        this._updateStats();
    }

    feed(pecks: number) {
        const directions = 's,se,e,ne,n,nw,w,sw'.split(',');
        const direction = <Direction>directions[Math.floor(Math.random() * directions.length)];
        
        const stand = 'bird:' + direction;
        const feed = `bird:${direction}-feed`;

        const animation = [stand];
        for (let i = 0; i < pecks; i++) {
            animation.push(stand, feed, feed, stand);
        };

        this._feeding = new ArrayAnimator<string>(animation, false);
        if (this._state === 'standing') {
            this._state = 'feeding';
        }
    }

    update(ticks: number) {

        if (this.state === 'flying' && !this._path.finished()) {
            this._path.next(ticks);

            for(const direction of Object.keys(this._flying)) {
                this._flying[direction].next(ticks);
            }

            this._setElevation(this._path.percentCompleted());
        }

        if (this.state === 'feeding' && !this._feeding.finished()) {
            this._feeding.next(ticks);
        }

        if (this._state === 'flying' && this._path.finished()) {

            for(const direction of Object.keys(this._flying)) {
                this._flying[direction].reset();
            }

            this._state = 'feeding';
        }

        if (this.state === 'feeding' && this._feeding.finished()) {
            this._state = 'standing';
        }

        this._updateStats();
    }

    get zIndex(): number { return this._elevation > 15 ? Infinity : this.boundingBox.y2 - 3; }
    get boundingBox(): Rect {
        const relativeBoundingRect = Bird._relativeBoundingRect;
        const location = this.location;

        return new Rect(
            location.x + relativeBoundingRect.x, 
            location.y + relativeBoundingRect.y, 
            relativeBoundingRect.width,
            relativeBoundingRect.height);
    }

    get finalBoundingBox(): Rect {
        const relativeBoundingRect = Bird._relativeBoundingRect;
        const targetLocation = this._path.destination();

        return new Rect(
            targetLocation.x + relativeBoundingRect.x, 
            targetLocation.y + relativeBoundingRect.y, 
            relativeBoundingRect.width,
            relativeBoundingRect.height);
    }

    draw(context: DrawContext) {
        if (GameSettings.Debug) {
            this._stats.show();
            context.drawBoundingRect(this.boundingBox);
            if (!this._path.finished()) {
                this._path.draw(context, 8, 8);
            }
        }
        else {
            this._stats.delete();
        }

        const location = this.location;

        if (this.state === 'flying') {
            const direction = this._path.value().direction;
            const sprite = this._flying[direction].value();
            _serviceProvider.SpriteService.drawSprite(context, sprite, location.move(0,-this._elevation));
        }
        else {
            _serviceProvider.SpriteService.drawSprite(context, this._feeding.value(), location);
        }
    }

    private _updateStats() {
        const location = this.location;

        const stats = [
            `Location: (${location.x},${location.y})`,
            `Elevation: ${this._elevation}`,
            `State: ${this._state}`
        ];

        this._stats.setPosition(location.move(37,0));
        this._stats.setInfo(stats.join('<br>'));
    }

    private _setElevation(t: number) {
        // y = 4(x - x^2)
        this._elevation = Math.round(this._maxElevation * 4 * (t - Math.pow(t, 2)));
    }

    private _setRandomStartLocation() {
        const bounds = _serviceProvider.ViewportService.getVisibleRect();
        const random = bounds.getRandomLocation();
        
        let location: Coords = null;
        if (Math.abs(random.x) > Math.abs(random.y)) {
            if (random.x < 0) {
                location = new Coords(bounds.x - 16, random.y);
            }
            else {
                location = new Coords(bounds.x2 + 16, random.y);
            }
        }
        else {
            if (random.y < 0) {
                location = new Coords(random.x, bounds.y - 16);
            }
            else {
                location = new Coords(random.x, bounds.y2 + 16);
            }
        }

        this._path = new PathAnimator(location, location, 1);
    }
}