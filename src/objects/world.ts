import { ServiceProvider, GameLoopService, UpdateContext, DrawContext, GameSettings, IDrawable } from "../services";
import { House } from "./house";
import { Flower } from "./flower";
import { Coords, Circle } from "../locators";
import { Girl } from "./girl";
import { Flock } from "./flock";

export class World {

    private static _maxFlowers = 100;

    private _currTick: number = 0;
    private _flowerTick: number = -1;
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

        this._house.update(ticks);
        if (this._house.door === 'closed' && this._flowerTick > 0 && this._currTick - this._flowerTick > 8) {
            this._girl.destroy();
            this._girl = new Girl();
            this._house.openDoor();
        }

        if (this._house.door === 'open') {
            if (this._girl.state === 'home') {
                if (this._hasFlowers()) {
                    // Girl comes out and waits for user clicks
                    this._girl.exitHouse();
                }
                else {
                    this._house.closeDoor();
                }
            }
            else if (this._girl.state === 'waiting') {
                // Girl waits for user clicks to move or go home if no flowers
                if (!this._hasFlowers()) {
                    this._girl.goHome();
                }
            }
            else {
                this._girl.update(ticks);
            }
        }

        // Handle clicks based on girl's current state
        for (const location of context.locations) {
            if (this._girl.state === 'waiting' || this._girl.state === 'home') {
                const flowerAtLocation = this._getFlowerAtLocation(location);
                if (flowerAtLocation) {
                    // User clicked on a flower, target it for attack
                    this._girl.target = flowerAtLocation;
                } else {
                    // User clicked on empty space, move there
                    this._girl.moveTo(location);
                }
            } else if (this._girl.state === 'moving' || this._girl.state === 'moving-to-location' || this._girl.state === 'leaving' || this._girl.state === 'returning') {
                const flowerAtLocation = this._getFlowerAtLocation(location);
                if (flowerAtLocation) {
                    // User clicked on a flower while moving, target it for attack
                    this._girl.target = flowerAtLocation;
                } else {
                    // User clicked on empty space while moving, change destination
                    this._girl.moveTo(location);
                }
            } else if (this._girl.state === 'attacking') {
                // Queue next action when attacking - user can set what to do after attack
                const flowerAtLocation = this._getFlowerAtLocation(location);
                if (flowerAtLocation) {
                    this._girl.queueTarget(flowerAtLocation);
                } else {
                    this._girl.queueMoveTo(location);
                }
            }
            // No flower placement functionality - users can only direct the girl
        }

        // Auto-generate flowers with variable timing
        this._autoFlowerTick += ticks;
        if (this._autoFlowerTick >= this._autoFlowerInterval) {
            this._autoFlowerTick = 0;
            const randomLocation = this._getRandomLocation();
            this.addFlower(randomLocation);
            
            // Set random interval for next flower (5-10 seconds)
            if (this._isFirstFlower) {
                this._isFirstFlower = false;
            }
            const randomSeconds = 5 + Math.random() * 5; // 5-10 seconds
            this._autoFlowerInterval = Math.round(randomSeconds * 8); // Convert to ticks (8 ticks/second)
        }

        this._flowers.forEach(x => x.update(ticks));
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

            // Draw yellow circles showing clickable areas for flowers
            for (const flower of this._flowers) {
                // Center the circle on the visual center of the flower sprite, 8 pixels higher
                const flowerCenter = flower.location.move(8, 21); // 8 pixels higher than sprite center
                const clickCircle = new Circle(flowerCenter.x, flowerCenter.y, 10);
                context.drawBoundingCircle(clickCircle, 'yellow');
            }
        }
    }

    private _getFlower(): Flower {
        return GameSettings.Algorithm === 'closest' ? this._getClosestFlower() : this._getRandomFlower();
    }

    private _getRandomFlower(): Flower {
        
        if (this._flowers.length === 0) {
            return null;
        }

        const flowerIdx = Math.floor(Math.random() * this._flowers.length);
        return this._flowers[flowerIdx];
    }

    private _getClosestFlower(): Flower {
        
        if (this._flowers.length === 0) {
            return null;
        }
        
        const distances = this._flowers.map(x => this._girl.location.distance(x.location));
        const flowerIdx = distances.indexOf(Math.min(...distances));
        return this._flowers[flowerIdx];
    }

    private _hasFlowers(): boolean {
        return this._flowers.length > 0;
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

        if (!this._hasFlowers()) {
            this._flowerTick = -1;
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

            if (this._flowerTick < 0) {
                this._flowerTick = this._currTick;
            }

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

    private _getRandomLocation(): Coords {
        const visibleRect = this.services.ViewportService.getVisibleRect();
        const margin = 50; // Keep flowers away from edges
        
        const x = Math.random() * (visibleRect.width - 2 * margin) + visibleRect.x + margin;
        const y = Math.random() * (visibleRect.height - 2 * margin) + visibleRect.y + margin;
        
        return new Coords(Math.round(x), Math.round(y));
    }

    private _getFlowerAtLocation(location: Coords): Flower | null {
        const clickRadius = 10; // How close the click needs to be to a flower
        for (const flower of this._flowers) {
            // Use the visual center of the flower sprite for distance calculation, 8 pixels higher
            const flowerCenter = flower.location.move(8, 21); // 8 pixels higher than sprite center
            const distance = flowerCenter.distance(location);
            if (distance <= clickRadius) {
                return flower;
            }
        }
        return null;
    }
}
