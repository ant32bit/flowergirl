import { SpriteService } from "./sprite-service";
import { GameLoopService } from "./game-loop-service";
import { PathFindingService } from "./path-finding-service";
import { ViewportService } from "./viewport-service";
import { ObstaclesService } from "./obstacles-service";

class ServiceRegistry {
    public sprite: SpriteService;
    public loop: GameLoopService;
    public path: PathFindingService;
    public viewport: ViewportService;
    public obstacles: ObstaclesService;
    
    constructor() {
        this.sprite = new SpriteService();
        this.viewport = new ViewportService();
        this.obstacles = new ObstaclesService();

        this.path = new PathFindingService(this.obstacles);
        this.loop = new GameLoopService(this.viewport);
    }
}

export class ServiceProvider {
    private static _services = new ServiceRegistry();

    public get PathFindingService(): PathFindingService { return ServiceProvider._services.path; }
    public get SpriteService(): SpriteService { return ServiceProvider._services.sprite; }
    public get GameLoopService(): GameLoopService { return ServiceProvider._services.loop; }
    public get ViewportService(): ViewportService { return ServiceProvider._services.viewport; }
    public get ObstaclesService(): ObstaclesService { return ServiceProvider._services.obstacles; }
}