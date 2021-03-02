import { CancelError } from '../../cancellation';
import { TaskScheduler, TaskCallback, TaskReference } from '../types';

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
