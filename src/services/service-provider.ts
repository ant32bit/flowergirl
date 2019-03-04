import { SpriteService } from "./sprite-service";
import { GameLoopService } from "./game-loop-service";

export class ServiceProvider {
    private static _services = {
        'sprite': new SpriteService(),
        'loop': new GameLoopService()
    };

    public get SpriteService(): SpriteService { return ServiceProvider._services.sprite }
    public get GameLoopService(): GameLoopService { return ServiceProvider._services.loop }
}