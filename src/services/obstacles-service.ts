import { Rect, Coords, Circle } from "../locators";

export class ObstaclesService {
    private _registry: {[key: string]: Rect[]} = {};

    public register(key: string, boundingBoxes: Rect[]) {
        this._registry[key] = boundingBoxes;
    }

    public collides(boundingBox: Rect, ...keys: string[]): boolean {
        for (const key of keys) {
            if (this._registry[key]) {
                for (const obstacle of this._registry[key]) {
                    if (boundingBox.collidesWith(obstacle)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public intersects(boundingCircle: Circle, ...keys: string[]): boolean {
        for (const key of keys) {
            if (this._registry[key]) {
                for (const obstacle of this._registry[key]) {
                    if (boundingCircle.collidesWith(obstacle, key === 'girl')) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public contains(point: Coords, ...keys: string[]): boolean {
        for (const key of keys) {
            if (this._registry[key]) {
                for (const obstacle of this._registry[key]) {
                    if (point.within(obstacle)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }


}