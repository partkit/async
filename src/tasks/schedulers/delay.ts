import { CancelError } from '../../cancellation/index.js';
import { TaskCallback, TaskReference } from '../types.js';

export const delay = <T> (callback: TaskCallback<T>, delay: number, signal?: AbortSignal): TaskReference<T> => {

    let cancelled = false;
    let handle: ReturnType<typeof setTimeout>;
    let reject: (reason?: unknown) => void;

    const cancel = (reason?: unknown) => {
        if (cancelled) return;
        cancelled = true;
        clearTimeout(handle);
        reject(reason ?? new CancelError('Task was cancelled.'));
    };

    const done = new Promise<T>((res, rej) => {
        reject = rej;
        handle = setTimeout(() => res(callback()), delay);
    });

    signal?.addEventListener('abort', () => cancel());

    return { cancel, done };
};
