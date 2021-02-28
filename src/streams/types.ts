import { CancelCallback } from '../cancellation';

export type Stream<T = unknown, TReturn = unknown, TNext = unknown> = AsyncGenerator<T, TReturn, TNext>;

export type StreamCallback<T = unknown, TNext = unknown> = (value: T) => TNext | Promise<TNext>;

export interface Subscription<TReturn = unknown> {
    cancel: CancelCallback;
    done: Promise<TReturn>;
}
