import { Coords, Rect, Direction } from "../locators";
import { ServiceProvider, DrawContext, GameSettings, IDrawable } from "../services";
import { ArrayAnimator } from "../animators";
import { House } from "./house";
import { Flower } from "./flower";
import { StatsDiv } from "./stats";

export type GirlState = 'idle' | 'moving' | 'attacking' | 'spinning';

const __services = new ServiceProvider();

export class Girl implements IDrawable {

    private static _relativeBoundingRect: Rect = new Rect(8, 27, 16, 6);
    private static _moveSpeed: number = 2; // pixels per tick
    
    private _animators: {[direction: string]: ArrayAnimator<string>} = 
        's,se,e,ne,n,nw,w,sw'.split(',')
        .reduce((animators, direction) => {
            animators[direction] = __services.SpriteService.getAnimator(`girl-walking-${direction}`);
            return animators;
        }, {});

    private _movement = new ArrayAnimator<number>([0,0,1,1,1,1], true);

    private _currTarget: Flower = null;
    private _currAttackPlan: Attack = null;
    private _location: Coords = new Coords(0, 0); // Start at center
    private _direction: Direction = 's';
    private _state: GirlState = 'idle';
    private _spinDuration: number = 30; // ticks to spin when hit
    private _spinStartTime: number = 0;

    private _stats: StatsDiv;
    
    constructor() {
        this._stats = new StatsDiv('Girl');
        this._updateStats();
    }

    public get state(): GirlState { return this._state; }
    public get location(): Coords { return this._location; }
    public get target(): Flower { return this._currTarget; }
    public get direction(): Direction { return this._direction; }

    public moveWithKeys(pressedKeys: string[]) {
        if (this._state === 'attacking' || this._state === 'spinning') return; // Can't move while attacking or spinning

        let dx = 0;
        let dy = 0;

        // WASD movement
        if (pressedKeys.includes('a')) dx -= Girl._moveSpeed; // A = left
        if (pressedKeys.includes('d')) dx += Girl._moveSpeed; // D = right  
        if (pressedKeys.includes('w')) dy -= Girl._moveSpeed; // W = up
        if (pressedKeys.includes('s')) dy += Girl._moveSpeed; // S = down

        // Handle attack
        if (pressedKeys.includes(' ')) {
            this._startAttack();
            return;
        }

        if (dx !== 0 || dy !== 0) {
            this._location = this._location.move(dx, dy);
            this._direction = this._calculateDirection(dx, dy);
            this._state = 'moving';
            
            // Animate movement
            this._movement.next(1);
            Object.keys(this._animators).forEach(x => this._animators[x].next(1));
        } else {
            this._state = 'idle';
        }
    }

    private _startAttack() {
        if (this._state === 'attacking' || this._state === 'spinning') return;
        
        this._state = 'attacking';
        this._currAttackPlan = this._chooseAttackByDirection();
    }

    public getHit() {
        this._state = 'spinning';
        this._spinStartTime = Date.now();
    }

    private _chooseAttackByDirection(): Attack {
        // Girl's hitbox is at (8, 27, 16, 6) relative to location
        // Create 16x16 attack box directly touching girl's hitbox, center-aligned
        
        if (this._direction.includes('w')) {
            // Facing left - SWORD attack to the left
            return this._createDirectionalAttack(-8, 22, -16, 0, 'girl-attacking-3');
        } else if (this._direction.includes('e')) {
            // Facing right - AXE attack to the right  
            return this._createDirectionalAttack(24, 22, 0, 0, 'girl-attacking-1');
        } else if (this._direction === 's' || this._direction.includes('s')) {
            // Facing down - JUMP attack below
            return this._createDirectionalAttack(8, 33, 0, -32, 'girl-attacking-2');
        } else if (this._direction === 'n' || this._direction.includes('n')) {
            // Facing up - FIRE attack above
            return this._createDirectionalAttack(8, 11, -16, 0, 'girl-attacking-4');
        }
        
        // Default to right axe
        return this._createDirectionalAttack(24, 22, 0, 0, 'girl-attacking-1');
    }

    private _createDirectionalAttack(hitboxOffsetX: number, hitboxOffsetY: number, drawOffsetX: number, drawOffsetY: number, animationKey: string): Attack {
        const attack = new Attack(
            hitboxOffsetX, hitboxOffsetY,  // locationOffset - where attack hitbox appears
            drawOffsetX, drawOffsetY,      // drawOffset - where animation draws relative to girl
            new Rect(0, 0, 16, 16),        // attack area size - 16x16 pixels
            animationKey,
            animationKey.replace('attacking', 'attack') + ':hit'
        );
        attack.animator.reset();
        return attack;
    }

    getBoundingRect() {
        // Girl's hitbox never changes - always use the static bounding rect
        return new Rect(
            this._location.x + Girl._relativeBoundingRect.x, 
            this._location.y + Girl._relativeBoundingRect.y, 
            Girl._relativeBoundingRect.width,
            Girl._relativeBoundingRect.height);
    }

    private _calculateDirection(dx: number, dy: number): Direction {
        if (dx === 0 && dy === 0) return this._direction; // Keep current direction
        
        // Normalize to get primary direction
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        let direction = '';
        
        if (absDy > absDx) {
            // Primarily vertical movement
            direction = dy < 0 ? 'n' : 's';
        } else if (absDx > absDy) {
            // Primarily horizontal movement  
            direction = dx > 0 ? 'e' : 'w';
        } else {
            // Diagonal movement
            if (dy < 0) direction = 'n';
            else direction = 's';
            
            if (dx > 0) direction += 'e';
            else direction += 'w';
        }
        
        return direction as Direction;
    }

    update(ticks: number) {
        // Handle spinning when hit
        if (this._state === 'spinning') {
            const currentTime = Date.now();
            if (currentTime - this._spinStartTime > this._spinDuration * (1000 / 8)) { // Convert ticks to ms at 8fps
                this._state = 'idle';
            } else {
                // Cycle through directions for spinning effect
                const spinDirections = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
                const spinIndex = Math.floor((currentTime - this._spinStartTime) / 100) % spinDirections.length;
                this._direction = spinDirections[spinIndex] as Direction;
            }
        }

        // Handle attacking animation
        if (this._state === 'attacking' && this._currAttackPlan) {
            for (let i = 0; i < ticks; i++) {
                this._currAttackPlan.animator.next(1);
                if (this._currAttackPlan.isHitFrame()) {
                    // Check for flower collisions during attack
                    this._checkAttackCollisions();
                }
                if (this._currAttackPlan.animator.finished()) {
                    this._state = 'idle';
                    this._currTarget = null;
                    this._currAttackPlan = null;
                }
            }
        }

        // Register collision with obstacles service
        __services.ObstaclesService.register('girl', [this.getBoundingRect()]);

        this._updateStats();
    }

    private _checkAttackCollisions() {
        // This will be handled by the World class which has access to flowers
    }

    public getAttackArea(): Rect | null {
        if (!this._currAttackPlan) return null;
        
        return new Rect(
            this._location.x + this._currAttackPlan.locationOffsetX + this._currAttackPlan.boundingRect.x,
            this._location.y + this._currAttackPlan.locationOffsetY + this._currAttackPlan.boundingRect.y,
            this._currAttackPlan.boundingRect.width,
            this._currAttackPlan.boundingRect.height
        );
    }

    public isAttackHitFrame(): boolean {
        return this._state === 'attacking' && this._currAttackPlan && this._currAttackPlan.isHitFrame();
    }

    get zIndex(): number { return this.boundingBox.y2 - 3; }
    get boundingBox(): Rect { return this.getBoundingRect(); }

    draw(context: DrawContext) {
        if (GameSettings.Debug) {
            this._stats.show();
            context.drawBoundingRect(this.getBoundingRect());
        }
        else {
            this._stats.delete();
        }

        switch (this._state) {
            case 'moving':
                const movingSprite = this._animators[this._direction]?.value();
                if (movingSprite && this._location) {
                    __services.SpriteService.drawSprite(context, movingSprite, this._location);
                }
                break;
            
            case 'attacking':
                if (this._currAttackPlan && this._location) {
                    const attackSprite = this._currAttackPlan.animator.value();
                    if (attackSprite) {
                        __services.SpriteService.drawSprite(context, attackSprite, 
                            this._location.move(this._currAttackPlan.drawOffsetX, this._currAttackPlan.drawOffsetY));
                    }
                }
                break;

            case 'spinning':
            case 'idle':
                if (this._location) {
                    __services.SpriteService.drawSprite(context, `girl:${this._direction}`, this._location);
                }
                break;
        }   
    }

    public destroy() {
        this._stats.delete();
    }

    private _updateStats() {
        const stats = [
            `Location: (${this._location.x},${this._location.y})`,
            `Direction: ${this._direction}`,
            `State: ${this._state}`
        ]

        this._stats.setPosition(this._location.move(37,0));
        this._stats.setInfo(stats.join('<br>'));
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
        this.animator = __services.SpriteService.getAnimator(key);
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