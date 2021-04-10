import { AsyncOperator, Awaitable } from './types.js';

export type Reducer<T = unknown, U = T> = (value: T, accumulator: U) => Awaitable<U>;

export async function* asyncReduce<T, U = T> (stream: AsyncIterable<T>, reducer: Reducer<T, U>, accumulator: U): AsyncGenerator<U, void> {

    for await (const value of stream) {

        accumulator = await reducer(value, accumulator);

        yield accumulator;
    }
}

export function reduce<T, U = T> (reducer: Reducer<T, U>, accumulator: U): AsyncOperator<T, U> {

    return stream => asyncReduce(stream, reducer, accumulator);
}
