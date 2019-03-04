export interface IAnimator<T> {
    next(nTicks: number): T;
}