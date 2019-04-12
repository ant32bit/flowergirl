import { ServiceProvider, GameLoopService, UpdateContext, DrawContext, GameSettings, IDrawable } from "../services";
import { House } from "./house";
import { Flower } from "./flower";
import { Coords } from "../locators";
import { Girl } from "./girl";
import { WorldStats } from "./stats";
import { Flock } from "./flock";

export class World {

    private static _maxFlowers = 100;

    private _currTick: number = 0;
    private _flowerTick: number = -1;
    
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
            this._girl = new Girl();
            this._house.openDoor();
        }

        if (this._house.door === 'open') {
            if (this._girl.state === 'home') {
                if (this._hasFlowers()) {
                    this._girl.target = this._getFlower();
                }
                else {
                    this._house.closeDoor();
                }
            }
            else if (this._girl.state === 'waiting') {
                if (this._hasFlowers()) {
                    this._girl.target = this._getFlower();
                }
                else {
                    this._girl.goHome();
                }
            }
            else {
                this._girl.update(ticks);
            }
        }

        for (const location of context.locations) {
            if (this.addFlower(location)) {
                if (!this._girl.target) {
                    this._girl.target = this._getFlower();
                }
                else if (this._girl.state !== 'attacking') {
                    if (GameSettings.Algorithm === 'closest')
                        this._girl.target = this._getFlower();
                    else 
                        this._girl.target = this._girl.target;
                }
            }
        }

        this._flowers.forEach(x => x.update(ticks));

        context.stats = this._stats();
    }

    private _stats(): WorldStats {
        const stats = new WorldStats();
        stats.Flowers = this._flowers.length;
        stats.Girl = this._girl ? this._girl.stats() : null;
        stats.House = this._house.stats();
        return stats;
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
        }
    }

    private _drawFlowers(context: DrawContext, fromY?: number, toY?: number) {
        let flowers: Flower[] = null;
        if (fromY == null && toY == null) {
            flowers = this._flowers;
        } else if (fromY == null) {
            flowers = this._flowers.filter(x => x.boundingBox.y2 < toY);
        } else if (toY == null) {
            flowers = this._flowers.filter(x => x.boundingBox.y2 >= fromY);
        } else if (fromY == toY) {
            return;
        } else {
            flowers = this._flowers.filter(x => x.boundingBox.y2 >= fromY && x.boundingBox.y2 < toY);
        }

        flowers.forEach(x => x.draw(context));
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
        this._flowers = this._flowers.filter(x => x.state !== 'gone');
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
}
