/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { delay, TaskReference } from '../../tasks/index.js';
import { StreamCallback } from '../types.js';
import { AsyncOperator } from './types.js';

const destream = async <T> (stream: AsyncIterable<T>, callback: StreamCallback<T>) => {

    for await (const value of stream) {

        callback(value);
    }
};

export async function* asyncDebounce<T> (stream: AsyncIterable<T>, time: number): AsyncGenerator<T, void> {

    let debounced: Promise<T>;
    let resolve: ((value: T | PromiseLike<T>) => void);
    let reject: ((reason?: unknown) => void);

    let task: TaskReference | undefined;
    let done = false;

    const reset = () => {

        debounced = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        task = undefined;
    };

    const debounceValue = (value: T) => {

        if (task) task.cancel();

        task = delay(() => {
            resolve!(value);
            reset();
        }, time);
    };

    reset();

    // we move awaiting the input stream to a separate function to decouple the timing of
    // input events and debounced output events: every input event will reset the timer
    // for when the pending output promise will be resolved
    destream(stream, debounceValue)
        // rejecting the current debounced promise will reject the `yield await debounced`
        // statement in the while loop and cause the generator to throw correctly
        .catch(reason => reject(reason))
        // if the input stream is done, we also exit this generator
        .finally(() => done = true);

    while (true && !done) {

        yield await debounced!;
    }
}

export function debounce<T = unknown> (time: number): AsyncOperator<T> {

    return stream => asyncDebounce(stream, time);
}
