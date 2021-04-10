/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Stream } from './types.js';

export const QUEUE_SIZE_ERROR = (maxSize: number): Error =>
    new Error(`asyncQueue: Maximum queue size reached: ${ maxSize }`);

type AsyncResolver<T = unknown> = {
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
};

/**
 * A push-based generator with an internal queue
 */
export interface AsyncQueue<T = unknown> extends Stream<T, void, undefined> {
    /**
     * Add a value to the generator's queue
     *
     * @remarks
     * Values added to the generator are queued up and yielded by the
     * generator during iteration or `next()` calls.
     *
     * @param value - The value to be added to the generator's queue
     */
    add (value: T): void;
}

/**
 * Creates an async generator that allows emitting values implicitly
 *
 * @remarks
 * The `asyncQueue` method creates an async generator which can be asynchronously iterated
 * over like any other async generator. In addition, the generator returned by this method
 * has an `add()` method, allowing you to add values to its internal queue which will be
 * yielded by the generator during async iteration or by invoking its `next()` method.
 * This provides a basis for event based streams, which can be iterated over.
 *
 * @returns - The async queue generator
 */
export const asyncQueue = <T> (maxSize = Infinity): AsyncQueue<T> => {

    // the internal queue for push/event-based emissions
    const queue: T[] = [];

    // the resolver for the currently yielded promise
    let resolver: AsyncResolver<T> | undefined;

    let error: unknown | undefined;
    let done = false;

    const push = (value: T) => {

        if (queue.length >= maxSize) {

            error = QUEUE_SIZE_ERROR(maxSize);

        } else {

            queue.push(value);
        }

        drain();
    };

    const pull = (): Promise<T> => new Promise<T>((resolve, reject) => {

        resolver = { resolve, reject };

        drain();
    });

    const drain = () => {

        if (resolver) {

            if (error) {

                // rejecting a pending promise with an error will reject the `yield await pull()`
                // statement in the generator and cause the generator to throw correctly
                resolver.reject(error);
                resolver = undefined;

            } else if (queue.length) {

                resolver.resolve(queue.shift()!);
                resolver = undefined;
            }
        }
    };

    /**
     * The generator function which creates the actual async queue generator
     *
     * @remarks
     * When creating an async generator from a generator function, the browser will handle
     * the pull queue for us: As the generator is paused in the first `yield await pull()`
     * step, another `pull()` is never called until the first `pull()` is awaited. This means,
     * we can't have multiple pending pull promises ever.
     */
    async function* AsyncQueue () {

        try {

            while (true) {

                // pull returns a promise which will be resolved with a value from the queue
                // or rejected with any error that occurred during a push;
                // in case of a rejection the await statement will cause the generator to throw
                yield await pull();
            }

        } catch (err) {

            error = err;
            throw err;

        } finally {

            done = true;
        }
    }

    const generator = AsyncQueue() as AsyncQueue<T>;

    generator.add = (value: T) => {

        if (done) return;

        push(value);

        // we have no control over when the `add()` method is invoked
        // if it is invoked between yields (while the generator is paused)
        // we would detect a possible `push()` error only on the next yield
        // this makes it difficult to debug when/where an error originated
        // by throwing any `push()` error in the `add()` method where it
        // occurred, we can make errors more discoverable
        if (error) throw error;
    };

    return generator;
};
