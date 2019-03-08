import { IAnimator } from "./animator";

export class ArrayAnimator<T> implements IAnimator<T> {

    private _index: number = -1;
    constructor(private _values: T[], private _loop: boolean) {}

    public value(): T {
        return this._values[this._index > 0 ? this._index : 0];
    }

    public next(nTicks: number): T {
        if (this._values.length === 0) {
            return null;
        }
        
        this._index += nTicks;
        if (this._index < 0) {
            this._index = 0;
        }

        if (this._index >= this._values.length) {
            if (this._loop) {
                this._index %= this._values.length;
            }
            else {
                this._index = this._values.length - 1;
            }
        }

        return this.value();
    }

    public finished(): boolean {
        return (!this._loop && this._index == this._values.length - 1);
    }

    public reset(): void {
        this._index = -1;
    }
}