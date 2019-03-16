import { Coords, Rect, Path, PathSegment } from "../locators";
import { ServiceProvider, DrawContext, GameSettings } from "../services";
import { ArrayAnimator } from "../animators";
import { House } from "./house";
import { Flower } from "./flower";

export type GirlState = 'home' | 'leaving' | 'moving' | 'attacking' | 'waiting' | 'returning';
const __paths = new ServiceProvider().PathService;
const __sprites = new ServiceProvider().SpriteService;

export class Girl {

    private static _homeLocation: Coords = new Coords(-18, -22);
    private static _justOutsideHomeLocation: Coords = Girl._homeLocation.move(0, 35);
    private static _relativeBoundingRect: Rect = new Rect(8, 27, 16, 6);
    
    private _animators: {[direction: string]: ArrayAnimator<string>} = 
        's,se,e,ne,n,nw,w,sw'.split(',')
        .reduce((animators, direction) => {
            animators[direction] = __sprites.getAnimator(`girl-walking-${direction}`);
            return animators;
        }, {});

    private _movement = new ArrayAnimator<number>([0,0,1,1,1,1], true);

    private _currTarget: Flower = null;
    private _currAttackPlan: Attack = null;

    private _path: Path = new Path(Girl._homeLocation, Girl._homeLocation, [new PathSegment(new Coords(0,1), 0)]);
    private _state: GirlState = 'home';
    
    constructor() {
    }

    public get state(): GirlState { return this._state; }
    public get location(): Coords { return this._path.location; }
    public get target(): Flower { return this._currTarget; }
    public set target(value: Flower) {
        this._currTarget = value;
        this._currAttackPlan = this._chooseAttack();
        if (this._state === 'home') {
            this._setPathToLeaveHome();
        }
        else if (this._state === 'leaving') {
            // do nothing, leaving
        }
        else {
            this._setPathToTarget();
        }
    }

    getBoundingRect() {
        const relativeBoundingRect = this._state == 'attacking' ? this._currAttackPlan.boundingRect : Girl._relativeBoundingRect;

        return new Rect(
            this._path.location.x + relativeBoundingRect.x, 
            this._path.location.y + relativeBoundingRect.y, 
            relativeBoundingRect.width,
            relativeBoundingRect.height);
    }

    goHome() {
        this._setPathToReturnHome();
    }

    update(ticks: number) {
        if (this._currTarget && this._currTarget.state == 'gone') {
            this._currTarget = null;
            this._state = 'waiting';
        }

        for (let i = 0; i < ticks; i++) {
            switch(this._state) {

                case 'moving':
                case 'leaving':
                case 'returning':
                    Object.keys(this._animators).forEach(x => this._animators[x].next(1));
                    this._movement.next(1);
                    this._path.move(this._movement.value() * GameSettings.Pace);
                    break;

                case 'attacking':
                    this._currAttackPlan.animator.next(1);
                    if (this._currAttackPlan.isHitFrame()) {
                        this._currTarget.hit();
                    }
                    break;
                
                case 'waiting':
                case 'home':
                    break;
            }
        }

        if (this._path.finished) {
            switch (this._state) {
                case 'leaving':
                    this._setPathToTarget()
                    break;
                
                case 'moving':
                    this._state = 'attacking';
                    break;

                case 'returning':
                    this._state = 'home';
                    break;
                
                case 'waiting':
                case 'attacking':
                case 'home':
                    //do nothing
                    break;
            }
        }
    }

    draw(context: DrawContext) {
        if (GameSettings.Debug) {
            context.drawBoundingRect(this.getBoundingRect())
            if (!this._path.finished) {
                const xOffset = Girl._relativeBoundingRect.x + (Girl._relativeBoundingRect.width / 2);
                const yOffset = Girl._relativeBoundingRect.y + (Girl._relativeBoundingRect.height / 2);
                this._path.draw(context, xOffset, yOffset);
            }
        }

        switch (this._state) {
            case 'leaving':
            case 'moving':
            case 'returning':
                __sprites.drawSprite(context, this._animators[this._path.direction].value(), this._path.location);
                break;
            
            case 'attacking':
                __sprites.drawSprite(context, this._currAttackPlan.animator.value(), 
                    this._path.location.move(this._currAttackPlan.drawOffsetX, this._currAttackPlan.drawOffsetY));
                break;

            case 'waiting':
            case 'home':
                __sprites.drawSprite(context, `girl:${this._path.direction}`, this._path.location);
                //do nothing
                break;
        }   
    }

    private _setPathToTarget() {
        const attackPosition = this._currTarget.location.move(this._currAttackPlan.locationOffsetX, this._currAttackPlan.locationOffsetY);
        this._path = __paths.calculatePath(this._path.location, attackPosition, Girl._relativeBoundingRect);
        this._state = 'moving';
    }
    
    private _setPathToLeaveHome() {
        if (this._state === 'home') {
            this._path = __paths.calculateDirectPath(Girl._homeLocation, Girl._justOutsideHomeLocation);
            this._state = 'leaving';
        }
    }

    private _setPathToReturnHome() {
        if (this._state !== 'home' && this._state !== 'returning') {
            this._path = __paths.calculatePath(this._path.location, Girl._justOutsideHomeLocation, Girl._relativeBoundingRect)
                .then(__paths.calculateDirectPath(Girl._justOutsideHomeLocation, Girl._homeLocation));
            this._state = 'returning';
        }
    }

    private _chooseAttack(): Attack {
        const unboundedAttacks: Attack[] = [];
        for(const attack of __attacks) {
            const attackLocation = this._currTarget.location.move(attack.locationOffsetX, attack.locationOffsetY);
            const attackBoundingRect = attack.boundingRect.move(attackLocation.x, attackLocation.y);

            if (!attackBoundingRect.collidesWith(House.boundingRect)) {
                unboundedAttacks.push(attack);
            }
        }

        const attacks = unboundedAttacks.length > 0 ? unboundedAttacks : __attacks;
        const chosenAttack = attacks[Math.floor(Math.random() * attacks.length)];
        chosenAttack.animator.reset();
        return chosenAttack;
    }
}

class Attack {
    locationOffsetX: number;
    locationOffsetY: number;
    drawOffsetX: number;
    drawOffsetY: number;
    animator: ArrayAnimator<string>;
    boundingRect: Rect;
    private _hitKey: string;

    constructor(x: number, y: number, dx: number, dy: number, bb: Rect, key: string, hitKey: string) {
        this.locationOffsetX = x;
        this.locationOffsetY = y;
        this.drawOffsetX = dx;
        this.drawOffsetY = dy;
        this.boundingRect = bb;
        this.animator = __sprites.getAnimator(key);
        this._hitKey = hitKey;
    }

    isHitFrame(): boolean {
        return this.animator.value() == this._hitKey;
    }
}

const __attacks: Attack[] = [
    new Attack(-33, -2, 0, 0, new Rect(8, 27, 16, 6), 'girl-attacking-1', 'girl-attack-1:hit'),
    new Attack(-8, -2, 0, -16, new Rect(8, 27, 16, 6), 'girl-attacking-2', 'girl-attack-2:hit'),
    new Attack(10, -2, -14, 0, new Rect(9, 27, 16, 6), 'girl-attacking-3', 'girl-attack-3:hit'),
    new Attack(6, 4, -14, -2, new Rect(10, 26, 16, 6), 'girl-attacking-4', 'girl-attack-4:hit'),
];