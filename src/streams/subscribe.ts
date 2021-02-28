import { CancelError } from '../cancellation';
import { Stream, StreamCallback, Subscription } from './types';

export const subscribe = <T, TReturn, TNext> (
    stream: Stream<T, TReturn, TNext>,
    callback: StreamCallback<T, TNext>,
): Subscription<TReturn> => {

    let cancelled = false;
    let cancelReason: unknown;

    const cancel = (reason?: unknown) => {
        cancelled = true;
        cancelReason = reason;
    };

    const run = async () => {

        let next = undefined as unknown as TNext;

        // eslint-disable-next-line no-constant-condition
        while (true) {

            const result = cancelled
                ? await stream.throw(cancelReason ?? new CancelError('Stream was cancelled.'))
                : await stream.next(next);

            if (result.done) { return result.value; }

            next = await callback(result.value);
        }
    };

    return {
        cancel,
        done: run(),
    };
};
