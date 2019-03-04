import { UpdateContext, GameLoopService, DrawContext } from "../services/game-loop-service";
import { ServiceProvider } from "../services/service-provider";
import { Coords } from "./coords";
import { ArrayAnimator } from "../animators";

export class World {

    private _currTick: number = 0;
    private poopLocation = new Coords(-44, -44);
    private doorLocation = new Coords(-14, 9);
    private glimmerMLocation: Coords = null;
    private glimmerSLocation: Coords = null;

    private glimmerMLocationAnimator = new ArrayAnimator<Coords>(
        [-25, -24, -22, -21, -20, -20, -21, -22, -24, -25].map(y => new Coords(-24, y)), true);
    
    private glimmerSLocationAnimator = new ArrayAnimator<Coords>(
        [-4, -4, -5, -5, -6, -6, -5, -5, -4, -4].map(y => new Coords(25, y)), true);

    private flowers: Flower[] = [];

    services: ServiceProvider = new ServiceProvider();

    public attachToGameLoop(gameLoop: GameLoopService) {
        gameLoop.update = this.update.bind(this);
        gameLoop.draw = this.draw.bind(this);
    }
    
    private update(context: UpdateContext) {
        const ticks = context.tick - this._currTick;
        this._currTick = context.tick;

        this.glimmerMLocation = this.glimmerMLocationAnimator.next(ticks);
        this.glimmerSLocation = this.glimmerSLocationAnimator.next(ticks);
    }

    private draw(context: DrawContext) {
        const sprites = this.services.SpriteService;

        context.fill('#caeade');
        sprites.drawSprite(context, 'poop:00', this.poopLocation);
        sprites.drawSprite(context, 'door:closed', this.doorLocation);
        sprites.drawSprite(context, 'glimmer-m:00', this.glimmerMLocation);
        sprites.drawSprite(context, 'glimmer-s:00', this.glimmerSLocation);
    }
}

export class Flower {
    public type: 'daisy'|'rose';
    public location: Coords;
}