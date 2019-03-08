import { IAnimator } from "./animator";
import { ArrayAnimator } from "./array-animator";

export class SequenceAnimator implements IAnimator<{[key: string]: string}> {
    
    private _currTick = 0;
    private _storyboard: ISequencePoint[];
    private _queued: ISequencePoint[];
    private _started: ISequencePoint[];
    
    constructor(storyboard: ISequencePoint[]) {
        this._storyboard = storyboard;
        this._queued = [...storyboard];
        this._started = [];
    }

    next(nTicks: number): {[key: string]: string} {
        this._started.forEach(x => x.begin.next(nTicks));
        
        this._currTick += nTicks;
        this._queued
            .filter(x => x.atTick <= this._currTick)
            .forEach(x => {
                x.begin.next(this._currTick - x.atTick);
                this._started.push(x);
            });
    
        this._queued = this._queued.filter(x => x.atTick > this._currTick);

        return this.value();
    }

    value(): {[key: string]: string} {
        const frames = {};
        for (const point of this._queued) {
            frames[point.name] = point.before;
        }
        for (const point of this._started) {
            frames[point.name] = point.begin.finished() ? point.after : point.begin.value();
        }

        return frames;
    }

    finished(): boolean {
        return this._started.filter(x => !x.begin.finished()).length + this._queued.length == 0;
    }

    reset() {
        this._storyboard.forEach(x => x.begin.reset());
        this._queued = [...this._storyboard];
        this._started = [];
        this._currTick = 0;
    }
}

export interface ISequencePoint {
    atTick: number;
    begin: ArrayAnimator<string>;
    before: string;
    after: string;
    name: string;
}