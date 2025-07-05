import { Coords, Rect } from "../locators";
import { ArrayAnimator } from "../animators";
import { ServiceProvider, DrawContext, GameSettings, IDrawable } from "../services";
import { StatsDiv } from "./stats";

const serviceProvider = new ServiceProvider();
export type FlowerState = 'blooming' | 'alive' | 'chasing' | 'dead' | 'gone'

export class Flower implements IDrawable {
    public type: string;
    public location: Coords;
    public state: FlowerState;

    private _bloom: ArrayAnimator<string>;
    private _alive: ArrayAnimator<string>;
    private _dead: string;
    private _hit: string;

    private static _deathDuration = 16;
    private static _hitDuration = 2;
    private static _relativeBoundingRect: Rect = new Rect(3, 24, 10, 10);
    private static _chaseSpeed = 0.5; // pixels per tick
    private static _chaseDelay = 16; // ticks to wait before chasing (2 seconds at 8fps) 

    private _boundingRect: Rect;

    private _timeOfDeath?: number = null;
    private _timeOfHit?: number = null;
    private _currTime: number = 0;
    private _timeBecameAlive: number = 0;
    private _playerLocation: Coords | null = null;

    private _stats: StatsDiv;

    constructor(location: Coords) {
        this.location = new Coords(location.x - 8, location.y - 29);
        this.type = ['daisy', 'rose'][Math.floor(Math.random() * 2)];
        this.state = 'blooming';

        this._bloom = serviceProvider.SpriteService.getAnimator(this.type + '-blooming');
        this._alive = serviceProvider.SpriteService.getAnimator(this.type);
        this._dead = `flower:${this.type}-dead`;
        this._hit = `flower:${this.type}-dead-float`;

        this._boundingRect = new Rect(
            this.location.x + Flower._relativeBoundingRect.x, 
            this.location.y + Flower._relativeBoundingRect.y,
            Flower._relativeBoundingRect.width,
            Flower._relativeBoundingRect.height);

        this._stats = new StatsDiv('Flower');
        this._updateStats();
    }

    update(ticks: number) {
        this._currTime += ticks;

        if (this.state === 'blooming') {
            this._bloom.next(ticks);

            if (this._bloom.finished()) {
                this.state = 'alive';
                this._timeBecameAlive = this._currTime;
            }
        }
        else if (this.state === 'alive') {
            this._alive.next(ticks);
            
            // Transition to chasing after delay
            if (this._currTime - this._timeBecameAlive >= Flower._chaseDelay) {
                this.state = 'chasing';
            }
        }
        else if (this.state === 'chasing' && this._playerLocation) {
            this._alive.next(ticks);
            
            // Calculate direction to player
            const dx = this._playerLocation.x - this.location.x;
            const dy = this._playerLocation.y - this.location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Move toward player if not too close
            if (distance > 5) {
                const moveX = (dx / distance) * Flower._chaseSpeed * ticks;
                const moveY = (dy / distance) * Flower._chaseSpeed * ticks;
                
                this.location = this.location.move(moveX, moveY);
                
                // Update bounding rect
                this._boundingRect = new Rect(
                    this.location.x + Flower._relativeBoundingRect.x, 
                    this.location.y + Flower._relativeBoundingRect.y,
                    Flower._relativeBoundingRect.width,
                    Flower._relativeBoundingRect.height);
            }
        }

        if (this.state === 'dead' && this._currTime - this._timeOfDeath > Flower._deathDuration) {
            this.state = 'gone';
        }

        if (this._timeOfHit != null && this._currTime - this._timeOfHit > Flower._hitDuration) {
            this._timeOfHit = null;
        }

        this._updateStats();
    }

    hit() {
        if (this.state !== 'gone')
            this.state = 'dead';

        this._timeOfHit = this._currTime;
        if (this._timeOfDeath == null) {
            this._timeOfDeath = this._currTime;
        }
    }

    setPlayerLocation(playerLocation: Coords) {
        this._playerLocation = playerLocation;
    }

    get zIndex(): number { return this.boundingBox.y2 - 5; }
    get boundingBox(): Rect { return this._boundingRect}

    draw(context: DrawContext) {
        if (GameSettings.Debug) {
            this._stats.show();
            context.drawBoundingRect(this._boundingRect);
        }
        else {
            this._stats.delete();
        }

        if (this.state === 'blooming') {
            serviceProvider.SpriteService.drawSprite(context, this._bloom.value(), this.location)
        }
        else if (this.state === 'alive' || this.state === 'chasing') {
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

    private _updateStats() {
        this._stats.setPosition(this.location.move(21,0));
        this._stats.setInfo([
            `Location: (${this.location.x}, ${this.location.y})`,
            `Type: ${this.type}`,
            `State: ${this.state}`
        ].join('<br>'))
    }

    destroy() {
        this._stats.delete();
    }
}