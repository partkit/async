import { CancelError } from '../../cancellation';
import { TaskScheduler, TaskCallback, TaskReference } from '../types';

// TODO: not in node...
export const animationtask: TaskScheduler = <T> (callback: TaskCallback<T>): TaskReference<T> => {

    let cancelled = false;
    let cancelReason: unknown;

    return {
        cancel: (reason?: unknown) => {
            cancelled = true;
            cancelReason = reason;
        },
        done: new Promise((resolve, reject) => {
            requestAnimationFrame(() => {
                if (cancelled) { reject(cancelReason ?? new CancelError('Animationtask was cancelled.')); }
                resolve(callback());
            });
        }),
    };
};
