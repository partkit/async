import { AsyncOperator, Awaitable } from './types.js';

export type Transformer<T = unknown, U = T> = (value: T) => Awaitable<U>;

export async function* asyncMap<T, U> (stream: AsyncIterable<T>, transform: Transformer<T, U>): AsyncGenerator<U, void> {

    for await (const value of stream) {

        yield await transform(value);
    }
}

export function map<T = unknown, U = T> (transform: (value: T) => U): AsyncOperator<T, U> {

    return stream => asyncMap(stream, transform);
}
