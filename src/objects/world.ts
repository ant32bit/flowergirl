import { ServiceProvider, GameLoopService, UpdateContext, DrawContext } from "../services";
import { House } from "./house";
import { Flower } from "./flower";
import { Coords } from "../locators";
import { Girl } from "./girl";

export class World {

    private static _maxFlowers = 20;

    private _currTick: number = 0;
    private _flowerTick: number = -1;
    
    private _house: House = new House();
    private _roomLocation = new Coords(-20, -14)
    private _girl: Girl;
    private _upperFlowers: Flower[] = [];
    private _lowerFlowers: Flower[] = [];

    services: ServiceProvider = new ServiceProvider();

    public attachToGameLoop(gameLoop: GameLoopService) {
        gameLoop.update = this.update.bind(this);
        gameLoop.draw = this.draw.bind(this);
    }
    
    private update(context: UpdateContext) {
        this._removeGoneFlowers();

        const ticks = context.tick - this._currTick;
        this._currTick = context.tick;

        this._house.update(ticks);
        if (this._house.door === 'closed' && this._flowerTick > 0 && this._currTick - this._flowerTick > 8) {
            this._girl = new Girl();
            this._house.openDoor();
        }

        if (this._house.door === 'open') {
            if (this._girl.state === 'home') {
                if (this._hasFlowers()) {
                    this._girl.target = this._getRandomFlower();
                }
                else {
                    this._house.closeDoor();
                }
            }
            else if (this._girl.state === 'waiting') {
                if (this._hasFlowers()) {
                    this._girl.target = this._getRandomFlower();
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
            this.addFlower(location);
        }

        this._upperFlowers.forEach(x => x.update(ticks));
        this._lowerFlowers.forEach(x => x.update(ticks));
    }

    private draw(context: DrawContext) {
        const sprites = this.services.SpriteService;

        context.fill('#bae03c');

        for (const flower of this._upperFlowers) {
            flower.draw(context);
        }

        sprites.drawSprite(context, 'room:00', this._roomLocation);

        if (this._girl) 
            this._girl.draw(context);

        this._house.draw(context, sprites);

        for (const flower of this._lowerFlowers) {
            flower.draw(context);
        }
    }

    private _getRandomFlower(): Flower {
        
        const allFlowers = [...this._upperFlowers, ...this._lowerFlowers];

        if (allFlowers.length === 0) {
            return null;
        }
        else {
            const flowerIdx = Math.floor(Math.random() * allFlowers.length);
            return allFlowers[flowerIdx];
        }
    }

    private _hasFlowers(): boolean {
        return this._upperFlowers.length > 0 || this._lowerFlowers.length > 0;
    }

    private _removeGoneFlowers() {
        this._upperFlowers = this._upperFlowers.filter(x => x.state !== 'gone');
        this._lowerFlowers = this._lowerFlowers.filter(x => x.state !== 'gone');
        if (!this._hasFlowers()) {
            this._flowerTick = -1;
        }
    }

    private addFlower(location: Coords) {
        if (location.within(House.boundingRect)) {
            return;
        }

        const allFlowers = [...this._upperFlowers, ...this._lowerFlowers];

        if (allFlowers.length < World._maxFlowers) {
            if (allFlowers.length == 0) {
                this._flowerTick = this._currTick;
            }

            const flower = new Flower(location);

            for (const otherFlower of allFlowers) {
                if (flower.location.distance(otherFlower.location) < 5) {
                    return;
                }
            }

            if (flower.location.y < 4) {
                this._upperFlowers.push(flower);
                this._upperFlowers = this._upperFlowers.sort(this.sortFlowers);
            }
            else {
                this._lowerFlowers.push(flower);
                this._lowerFlowers = this._lowerFlowers.sort(this.sortFlowers);
            }
        }
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
}
