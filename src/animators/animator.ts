export interface IAnimator<T> {
    next(nTicks: number): T;
    value(): T;
    finished(): boolean;
    reset(): void;
}