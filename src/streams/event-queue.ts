import { asyncQueue } from './async-queue.js';

export async function* eventQueue <K extends keyof WindowEventMap, T extends Event = WindowEventMap[K]> (
    target: EventTarget,
    type: K,
    options?: boolean | AddEventListenerOptions,
    maxSize?: number,
): AsyncGenerator<T, void, undefined> {

    const queue = asyncQueue<T>(maxSize);
    const listener = (event: Event) => queue.add(event as T);

    target.addEventListener(type, listener, options);

    try {

        for await (const event of queue) {

            yield event;
        }

    } finally {

        console.log('eventQueue finally... removing event listener');

        target.removeEventListener(type, listener, options);
    }
}
