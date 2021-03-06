import { CancelError } from '../../cancellation';
import { TaskScheduler, TaskCallback, TaskReference } from '../types';

// TODO: not in node...
export const animationtask: TaskScheduler = <T> (callback: TaskCallback<T>, signal?: AbortSignal): TaskReference<T> => {

    let rejectDone: (reason?: unknown) => void;
    let handle: ReturnType<typeof requestAnimationFrame>;
    let cancelled = false;

    const cancel = (reason?: unknown) => {
        if (cancelled) return;
        cancelled = true;
        cancelAnimationFrame(handle);
        rejectDone(reason ?? new CancelError('Animationtask was cancelled.'));
    };

    const done = new Promise<T>((resolve, reject) => {
        rejectDone = reject;
        handle = requestAnimationFrame(() => resolve(callback()));
    });

    signal?.addEventListener('abort', () => cancel());

    return { cancel, done };
};
