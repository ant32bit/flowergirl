import { ServiceProvider, GameLoopService, UpdateContext, DrawContext, GameSettings, IDrawable } from "../services";
import { House } from "./house";
import { Flower } from "./flower";
import { Coords, Circle, Rect } from "../locators";
import { Girl } from "./girl";
import { Flock } from "./flock";

export class World {

    private static _maxFlowers = 100;

    private _currTick: number = 0;
    private _autoFlowerTick: number = 0;
    private _autoFlowerInterval: number = 8; // First flower after 1 second (8 ticks/second * 1)
    private _isFirstFlower: boolean = true;
    
    private _house: House = new House();
    private _girl: Girl = new Girl();
    private _roomLocation = new Coords(-20, -14);
    private _flowers: Flower[] = [];
    private _prevFlowerCount: number = 0;
    private _flock: Flock = new Flock();

    services: ServiceProvider = new ServiceProvider();

    constructor() { 
    }

    public attachToGameLoop(gameLoop: GameLoopService) {
        gameLoop.update = this.update.bind(this);
        gameLoop.draw = this.draw.bind(this);
    }
    
    private update(context: UpdateContext) {
        this._removeGoneFlowers();

        const ticks = context.tick - this._currTick;
        this._currTick = context.tick;


        this._flock.update(ticks);

        // Update girl with keyboard input
        this._girl.moveWithKeys(context.pressedKeys);
        this._girl.update(ticks);

        // Update flowers with player location for chasing
        this._flowers.forEach(flower => {
            flower.setPlayerLocation(this._girl.location);
            flower.update(ticks);
        });

        // Check for collisions between girl and flowers
        this._checkGirlFlowerCollisions();
        
        // Check for attack collisions
        this._checkAttackCollisions();

        // Auto-generate flowers with variable timing
        this._autoFlowerTick += ticks;
        if (this._autoFlowerTick >= this._autoFlowerInterval) {
            this._autoFlowerTick = 0;
            const randomLocation = this._getRandomLocation();
            this.addFlower(randomLocation);
            
            // Set random interval for next flower (1-5 seconds)
            if (this._isFirstFlower) {
                this._isFirstFlower = false;
            }
            const randomTicks = 8 + Math.random() * 32; // 8-40 ticks (1-5 seconds at 8fps)
            this._autoFlowerInterval = Math.round(randomTicks);
        }
    }

    private draw(context: DrawContext) {
        const sprites = this.services.SpriteService;

        context.fill('#bae03c');
        sprites.drawSprite(context, 'room:00', this._roomLocation);

        this._flock.draw(context);

        const drawables: IDrawable[] = [];
        drawables.push(this._house);

        if (this._girl) {
            drawables.push(this._girl);
        }

        if (this._flowers.length > 0) {
            drawables.push(...this._flowers);
        }

        if (this._flock && this._flock.birds.length > 0) {
            drawables.push(...this._flock.birds);
        }

        context.draw(drawables);

        if (GameSettings.Debug) {
            for (const drawable of drawables) {
                const bb = drawable.boundingBox;
                const x = bb.x + bb.width / 2 - 5;
                const y = drawable.zIndex;
                const start = context.translate(new Coords(x, y));
                const end = context.translate(new Coords(x + 10, y));

                context.canvas.beginPath();
                context.canvas.moveTo(start.x, start.y);
                context.canvas.lineTo(end.x, end.y);
                context.canvas.strokeStyle = 'magenta';
                context.canvas.stroke();
            }

            // Draw yellow hit boxes for flowers
            for (const flower of this._flowers) {
                if (flower.state === 'alive' || flower.state === 'chasing') {
                    const expandedHitBox = new Rect(
                        flower.boundingBox.x - 5,
                        flower.boundingBox.y - 5,
                        flower.boundingBox.width + 10,
                        flower.boundingBox.height + 10
                    );
                    context.drawBoundingRect(expandedHitBox, 'yellow');
                }
            }

            // Draw blue attack area for girl
            if (this._girl.state === 'attacking') {
                const attackArea = this._girl.getAttackArea();
                if (attackArea) {
                    context.drawBoundingRect(attackArea, 'blue');
                }
            }
        }
    }



    private _removeGoneFlowers() {
        const flowers = [];
        for(const flower of this._flowers) {
            if (flower.state === 'gone') {
                flower.destroy();
            }
            else {
                flowers.push(flower);
            }
        }

        this._flowers = flowers;
        if (this._prevFlowerCount !== this._flowers.length) {
            this._prevFlowerCount = this._flowers.length;

            this._registerObstacles();
        }

    }

    private addFlower(location: Coords): boolean {
        if (this._flowers.length < World._maxFlowers) {

            const flower = new Flower(location);
            if (flower.boundingBox.collidesWith(House.boundingRect)) {
                return false;
            }

            for (const otherFlower of this._flowers) {
                if (flower.boundingBox.collidesWith(otherFlower.boundingBox)) {
                    return false;
                }
            }
            
            this._flowers.push(flower);
            this._flowers = this._flowers.sort(this.sortFlowers);


            return true;
        }

        return false;
    }

    private sortFlowers(a: Flower, b: Flower) {
        if (a.location.y < b.location.y) {
            return -1;
        }
        
        if (a.location.y > b.location.y) {
            return 1;
        }

        if (a.location.x < b.location.x) {
            return -1;
        }
        
        if (a.location.x > b.location.x) {
            return 1;
        }

        return 0;
    }

    private _registerObstacles() {
        this.services.ObstaclesService.register('flowers', this._flowers.map(x => x.boundingBox));
    }

    private _checkGirlFlowerCollisions() {
        if (this._girl.state === 'spinning') return; // Already hit, don't check again
        
        const girlBounds = this._girl.getBoundingRect();
        
        for (const flower of this._flowers) {
            if (flower.state === 'chasing' || flower.state === 'alive') {
                if (girlBounds.collidesWith(flower.boundingBox)) {
                    this._girl.getHit();
                    break; // Only hit once per frame
                }
            }
        }
    }

    private _checkAttackCollisions() {
        // Only check during attack hit frames
        if (!this._girl.isAttackHitFrame()) return;
        
        const attackArea = this._girl.getAttackArea();
        if (!attackArea) return;
        
        // Check collision with flowers (with expanded hit radius)
        for (const flower of this._flowers) {
            if (flower.state === 'alive' || flower.state === 'chasing') {
                // Expand flower hitbox by 5 pixels in all directions
                const expandedFlowerBox = new Rect(
                    flower.boundingBox.x - 5,
                    flower.boundingBox.y - 5,
                    flower.boundingBox.width + 10,
                    flower.boundingBox.height + 10
                );
                
                if (attackArea.collidesWith(expandedFlowerBox)) {
                    flower.hit(); // This will set flower to dead state and start death animation
                    break; // Only hit one flower per attack
                }
            }
        }
    }

    private _getRandomLocation(): Coords {
        const visibleRect = this.services.ViewportService.getVisibleRect();
        const margin = 50; // Keep flowers away from edges
        
        const x = Math.random() * (visibleRect.width - 2 * margin) + visibleRect.x + margin;
        const y = Math.random() * (visibleRect.height - 2 * margin) + visibleRect.y + margin;
        
        return new Coords(Math.round(x), Math.round(y));
    }

}
