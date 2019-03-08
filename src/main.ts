import { ServiceProvider } from "./services";
import { World } from "./objects/world";

const serviceProvider: ServiceProvider = new ServiceProvider();

window.onload = function () {
    const world = new World();
    world.attachToGameLoop(serviceProvider.GameLoopService);
    
    if (!serviceProvider.GameLoopService.start()) {
        console.log('Could not start game loop');
    }
};