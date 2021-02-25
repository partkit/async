export type TaskCallback<T> = () => T | Promise<T>;

export interface TaskReference<T = unknown> {
    cancel: () => void;
    done: Promise<T>;
}

export type TaskScheduler<T = unknown> = (callback: TaskCallback<T>) => TaskReference<T>;

export class TaskCancellation extends Error {

    name = 'TaskCancellation';

    constructor (message = 'Task was cancelled.') {

        super(message);
    }
}

export const microtask = <T> (callback: TaskCallback<T>): TaskReference<T> => {

    let cancelled = false;

    return {
        cancel: () => cancelled = true,
        done: Promise.resolve().then(() => {
            if (cancelled) { throw new TaskCancellation('Microtask was cancelled.'); }
            return callback();
        }),
    };
};

export const task = <T> (callback: TaskCallback<T>): TaskReference<T> => {

    let cancelled = false;

    return {
        cancel: () => cancelled = true,
        done: new Promise((resolve, reject) => {
            setTimeout(() => {
                if (cancelled) { reject(new TaskCancellation('Task was cancelled.')); }
                resolve(callback());
            }, 0);
        }),
    };
};

// TODO: not in node...
export const animationtask = <T> (callback: TaskCallback<T>): TaskReference<T> => {

    let cancelled = false;

    return {
        cancel: () => cancelled = true,
        done: new Promise((resolve, reject) => {
            requestAnimationFrame(() => {
                if (cancelled) { reject(new TaskCancellation('Animationtask was cancelled.')); }
                resolve(callback());
            });
        }),
    };
};
