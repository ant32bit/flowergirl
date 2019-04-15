import { Bird } from "./bird";
import { Circle, Rect, Coords } from "../locators";
import { ServiceProvider, GameSettings, DrawContext } from "../services";

const __services = new ServiceProvider();

export class Flock {
    public birds: Bird[];
    private _area: Circle;
    private _trigger: Circle;

    constructor() {
        this.birds = [new Bird(), new Bird(), new Bird()];
        this._relocate();
    }

    update(ticks: number) {
        if (__services.ObstaclesService.intersects(this._trigger, 'girl')) {
            this._relocate();
        }
        else {
            for (const bird of this.birds) {
                if (bird.state === 'standing') {
                    if (Math.random() > 0.5) {
                        this._setBirdFeedingSession(bird);
                    }
                    else {
                        this._setRandomBirdLocation(bird);
                    }
                }
            }
        }

        

        for (const bird of this.birds) {
            bird.update(ticks);
        }
    }

    draw(context: DrawContext) {
        if (GameSettings.Debug) {
            if (this._area) {
                context.drawBoundingCircle(this._area);
            }

            if (this._trigger) {
                context.drawBoundingCircle(this._trigger, 'yellow');
            }
        }
    }

    private _relocate() {
        const flockRadius = GameSettings.FlockRadius;

        const visibleArea = __services.ViewportService.getVisibleRect();
        const expanded = new Rect(visibleArea.x - flockRadius, visibleArea.y - flockRadius, visibleArea.width + 2 * flockRadius, visibleArea.height + 2 * flockRadius);
        const quadrants = this._makeQuadrants(visibleArea);
        let eligible = this._area != null ? quadrants.filter(x => !this._area.collidesWith(x)) : quadrants;
        
        let area: Circle;
        let trigger: Circle;
        let retries = 0;
        let success = false;

        while (retries < 5 && !success && eligible.length > 0) {
            const quadrant = retries > 5 ? expanded : 
                eligible[Math.floor(Math.random() * eligible.length)];
            
            let location = quadrant.getRandomLocation();
            area = new Circle(location.x, location.y, flockRadius);
            trigger = new Circle(location.x, location.y, flockRadius * 1.5);
            retries++;
            success = 
                !__services.ObstaclesService.intersects(area, 'house') && 
                !__services.ObstaclesService.intersects(trigger, 'girl');
        }
        
        this._area = area;
        this._trigger = trigger;
        
        for (const bird of this.birds) {
            this._setRandomBirdLocation(bird);
        }
    }

    private _makeQuadrants(visibleArea: Rect): Rect[] {
        const margin = GameSettings.FlockRadius / Math.SQRT2;
        const quadrantWidth = (visibleArea.width - margin * 2) / 2;
        const quadrantHeight = (visibleArea.height - margin * 2) / 2;

        const topleft = new Coords(visibleArea.x + margin, visibleArea.y + margin);
        const centre = new Coords(visibleArea.x + visibleArea.width / 2, visibleArea.y + visibleArea.height / 2); 

        return [
            new Rect(centre.x, topleft.y, quadrantWidth, quadrantHeight),
            new Rect(centre.x, centre.y, quadrantWidth, quadrantHeight),
            new Rect(topleft.x, centre.y, quadrantWidth, quadrantHeight),
            new Rect(topleft.x, topleft.y, quadrantWidth, quadrantHeight)
        ];
    }

    private _setRandomBirdLocation(bird: Bird) {
        do {
            bird.target = this._area.getRandomLocation().move(-8, -12);
        }
        while (__services.ObstaclesService.collides(bird.finalBoundingBox, 'birds', 'house'))

        this._setBirdFeedingSession(bird);
        __services.ObstaclesService.register('birds', this.birds.map(x => x.finalBoundingBox));
    }

    private _setBirdFeedingSession(bird: Bird) {
        const pecks = Math.ceil(Math.random() * 5);
        bird.feed(pecks);
    }
}