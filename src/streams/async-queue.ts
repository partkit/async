/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Stream } from './types';

type AsyncResolver<T = unknown> = {
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
};

export interface AsyncQueue<T = unknown> extends Stream<T, void, undefined> {
    add (value: T): void;
}

export const asyncQueue = <T> (): AsyncQueue<T> => {

    let done = false;
    const pushQueue: T[] = [];
    const pullQueue: AsyncResolver<T>[] = [];

    const push = (value: T) => {

        console.log('push()... value: ', value);

        pushQueue.push(value);
        drain();
    };

    const pull = (): Promise<T> => new Promise<T>((resolve, reject) => {

        console.log('pull()...');

        pullQueue.push({ resolve, reject });
        drain();
    });

    const drain = () => {

        console.log(`drain()... [state=${ done ? 'done' : 'active' }] [pullQueue.length=${ pullQueue.length }]`);

        while (pullQueue.length) {

            if (done) {

                console.log('drain()... rejecting pending promise');

                pullQueue.shift()!.reject();

            } else {

                if (pushQueue.length) {

                    console.log('drain()... resolving pending promise with: ', pushQueue[0]);

                    pullQueue.shift()!.resolve(pushQueue.shift() as T);

                } else {

                    console.log('drain()... pushQueue empty');
                    break;
                }
            }
        }

        console.log();
    };

    async function* AsyncQueue () {

        try {

            while (true) {

                console.log('[AsyncQueue] yield...');
                yield await pull();
            }

        } catch (error) {

            console.log('[AsyncQueue] throw...', error);
            throw error;

        } finally {

            console.log('[AsyncQueue] finally...');
            done = true;
            drain();
        }
    }

    const queue = AsyncQueue() as AsyncQueue<T>;

    queue.add = (value: T) => {

        if (!done) push(value);
    };

    return queue;
};
