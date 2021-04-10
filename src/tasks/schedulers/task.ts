import { CancelError } from '../../cancellation/index.js';
import { TaskScheduler, TaskCallback, TaskReference } from '../types.js';

export const task: TaskScheduler = <T> (callback: TaskCallback<T>, signal?: AbortSignal): TaskReference<T> => {

    let rejectDone: (reason?: unknown) => void;
    let handle: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const cancel = (reason?: unknown) => {
        if (cancelled) return;
        cancelled = true;
        clearTimeout(handle);
        rejectDone(reason ?? new CancelError('Task was cancelled.'));
    };

    const done = new Promise<T>((resolve, reject) => {
        rejectDone = reject;
        handle = setTimeout(() => resolve(callback()), 0);
    });

    signal?.addEventListener('abort', () => cancel());

    return { cancel, done };
};
