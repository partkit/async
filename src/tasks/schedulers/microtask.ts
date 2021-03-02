import { CancelError } from '../../cancellation';
import { TaskScheduler, TaskCallback, TaskReference } from '../types';

export const microtask: TaskScheduler = <T> (callback: TaskCallback<T>): TaskReference<T> => {

    let cancelled = false;
    let cancelReason: unknown;

    return {
        cancel: (reason?: unknown) => {
            cancelled = true;
            cancelReason = reason;
        },
        done: Promise.resolve().then(() => {
            if (cancelled) { throw cancelReason ?? new CancelError('Microtask was cancelled.'); }
            return callback();
        }),
    };
};
