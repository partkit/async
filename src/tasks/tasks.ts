export type TaskCallback<T> = () => T | Promise<T>;

export type TaskScheduler<T = unknown> = (callback: TaskCallback<T>) => Promise<T>;

// TODO: task schedulers should return a cancel function
export const microtask = <T> (callback: TaskCallback<T>): Promise<T> => {

    let cancelled = false;

    const cancel = () => cancelled = true;

    return Promise.resolve().then(() => callback());
};

export const task = <T> (callback: TaskCallback<T>): Promise<T> => {

    return new Promise(resolve => setTimeout(() => resolve(callback()), 0));
};

// TODO: not in node...
export const animationtask = <T> (callback: TaskCallback<T>): Promise<T> => {

    return new Promise(resolve => requestAnimationFrame(() => resolve(callback())));
};
