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

            // by awaiting the callback result, we enable backpressure, meaning we only
            // ask for the next stream value, once we've processed the current one
            try {

                next = await callback(result.value);

            } catch (error) {

                // when an error occurrs in the subscription callback, we throw it on
                // the stream to make sure the stream is ended and reject this runner
                await stream.throw(error);
            }
        }
    };

    return {
        cancel,
        done: run(),
    };
};
