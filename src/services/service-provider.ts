import { SpriteService } from "./sprite-service";
import { GameLoopService } from "./game-loop-service";
import { PathService } from "./path-service";

export class ServiceProvider {
    private static _services = {
        'sprite': new SpriteService(),
        'loop': new GameLoopService(),
        'path': new PathService()
    };

    public get PathService(): PathService { return ServiceProvider._services.path }
    public get SpriteService(): SpriteService { return ServiceProvider._services.sprite }
    public get GameLoopService(): GameLoopService { return ServiceProvider._services.loop }
}