import { CancelError } from '../../cancellation/index.js';
import { TaskCallback, TaskReference } from '../types.js';

export interface Signal<T = void> {
    confirmed: boolean;
    cancelled: boolean;
    confirm: (value: T) => void;
    cancel: (reason?: unknown) => void;
    done: Promise<T>;
}

export const signal = <T = void> (abortSignal?: AbortSignal): Signal<T> => {

    let resolveDone: (value: T) => void;
    let rejectDone: (reason?: unknown) => void;

    let resolved = false;
    let rejected = false;

    const confirm = (value: T) => {
        if (resolved || rejected) return;
        resolved = true;
        resolveDone(value);
    };

    const cancel = (reason?: unknown) => {
        if (resolved || rejected) return;
        rejected = true;
        rejectDone(reason ?? new CancelError('Signal was cancelled.'));
    };

    const done = new Promise<T>((resolve, reject) => {

        resolveDone = resolve;
        rejectDone = reject;
    });

    abortSignal?.addEventListener('abort', cancel, { once: true });

    return {
        get confirmed (): boolean {
            return resolved;
        },
        get cancelled (): boolean {
            return rejected;
        },
        confirm,
        cancel,
        done,
    };
};

export const signaltask = <T, C = unknown | void> (callback: TaskCallback<T>, taskSignal: Signal<C>, abortSignal?: AbortSignal): TaskReference<T> => {

    let rejectDone: (reason?: unknown) => void;

    let cancelled = false;

    const cancel = (reason?: unknown) => {
        // TODO: for cleanliness check if done is already resolved...
        if (cancelled) return;
        cancelled = true;
        rejectDone(reason ?? new CancelError('Signaltask was cancelled.'));
    };

    const done = new Promise<T>((resolve, reject) => {
        rejectDone = reject;
        taskSignal.done.then(
            () => !cancelled && resolve(callback()),
            cancel,
        );
    });

    abortSignal?.addEventListener('abort', cancel, { once: true });

    return {
        cancel,
        done,
    };
};
