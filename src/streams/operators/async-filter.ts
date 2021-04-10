import { AsyncOperator, Awaitable } from './types.js';

export type Filter<T = unknown> = (value: T) => Awaitable<boolean>;

export async function* asyncFilter<T> (stream: AsyncIterable<T>, filter: Filter<T>): AsyncGenerator<T, void> {

    for await (const value of stream) {

        if (await filter(value)) yield value;
    }
}

export function filter<T = unknown> (filter: Filter<T>): AsyncOperator<T> {

    return stream => asyncFilter(stream, filter);
}
