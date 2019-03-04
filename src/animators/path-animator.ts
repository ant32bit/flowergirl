import { IAnimator } from "./animator";

export class PathAnimator implements IAnimator<number> {

    public next(nTicks: number): number {
        return 0;
    }
}