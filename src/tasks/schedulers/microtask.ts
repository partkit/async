import { CancelError } from '../../cancellation';
import { TaskScheduler, TaskCallback, TaskReference } from '../types';

export const microtask: TaskScheduler = <T> (callback: TaskCallback<T>, signal?: AbortSignal): TaskReference<T> => {

    let rejectDone: (reason?: unknown) => void;
    let cancelled = false;

    const cancel = (reason?: unknown) => {
        if (cancelled) return;
        cancelled = true;
        rejectDone(reason ?? new CancelError('Microtask was cancelled.'));
    };

    const done = new Promise<T>((resolve, reject) => {
        rejectDone = reject;
        void Promise.resolve().then(() => resolve(callback()));
    });

    signal?.addEventListener('abort', () => cancel());

    return { cancel, done };
};
