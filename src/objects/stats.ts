import { Coords, Direction } from "../locators";
import { GirlState, Girl } from "./girl";
import { FlowerState } from "./flower";
import { DrawContext, GameSettings } from "../services";

export class Stats {
    FrameRate: number = 0;
    UpdateTime: number = 0;
    DrawTime: number = 0;

    World: WorldStats = new WorldStats();

    draw(context: DrawContext) {
        const text = this._toText();
        context.canvas.fillStyle = 'black';
    
        let curr_y = 10;
        for (const line of text) {
            context.canvas.fillText(line, 5, curr_y);
            curr_y += 10;
        }
    }

    private _toText(): string[] {
        const fps = this.FrameRate > 0 ? 1000 / this.FrameRate : 0;
        return [
            `Frames: ${fps.toFixed(3)} FPS (${this.FrameRate.toFixed(3)}ms per frame)`,
            `Update: ${this.UpdateTime.toFixed(3)}ms`,
            `Draw: ${this.DrawTime.toFixed(3)}ms`,
            '',
            'Settings:',
            `  FrameRate: ${GameSettings.FPS} FPS`,
            `  Search: ${GameSettings.Algorithm}`,
            `  Pace: ${GameSettings.Pace} pixels`,
            `  Debug Mode: ${GameSettings.Debug ? 'on' : 'off'}`,
            '',
            ...this._worldStats(this.World)
        ];
    }

    private _worldStats(stats: WorldStats): string[] {
        if (!stats)
            return []

        return [
            'World:',
            `  Flowers: ${stats.Flowers}`,
            '',
            ...this._houseStats(stats.House).map(x => '  ' + x),
            ...this._girlStats(stats.Girl).map(x => '  ' + x),
        ]
    }

    private _houseStats(stats: HouseStats): string[] {
        if (!stats)
            return [];

        return [
            'House: ',
            `  State: ${stats.State}`,
            ''
        ];
    }

    private _girlStats(stats: GirlStats): string[] {
        if (!stats)
            return [];

        return [
            'Girl:',
            `  Location: (${stats.Location.x}, ${stats.Location.y})`,
            `  Direction: ${stats.Direction}`,
            `  State: ${stats.State}`,
            '  Target:',
            ...this._flowerStats(stats.Target).map(x => '    ' + x),
            ''
        ]
    }

    private _flowerStats(stats: FlowerStats): string[] {
        if (!stats)
            return[];

        return [
            'Flower:',
            `  Type: ${stats.Type}`,
            `  Location: (${stats.Location.x}, ${stats.Location.y})`,
            `  State: ${stats.State}`,
            ''
        ]
    }

}

export class FlowerStats {
    Location: Coords;
    Type: string;
    State: FlowerState;
}

export class GirlStats {
    Location: Coords;
    State: GirlState;
    Direction: Direction;
    Target: FlowerStats = null;
}

export class HouseStats {
    State: string;
}

export class WorldStats {
    House: HouseStats;
    Flowers: number = 0;
    Girl: GirlStats;
}