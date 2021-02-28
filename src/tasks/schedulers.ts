import { CancelError } from '../cancellation';
import { TaskScheduler, TaskCallback, TaskReference } from './types';

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

export const task: TaskScheduler = <T> (callback: TaskCallback<T>): TaskReference<T> => {

    let cancelled = false;
    let cancelReason: unknown;

    return {
        cancel: (reason?: unknown) => {
            cancelled = true;
            cancelReason = reason;
        },
        done: new Promise((resolve, reject) => {
            setTimeout(() => {
                if (cancelled) { reject(cancelReason ?? new CancelError('Task was cancelled.')); }
                resolve(callback());
            }, 0);
        }),
    };
};

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
