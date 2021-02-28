import { CancelCallback } from '../cancellation';

export interface TaskReference<T = unknown> {
    cancel: CancelCallback;
    done: Promise<T>;
}

export type TaskCallback<T> = () => T | Promise<T>;

export type TaskScheduler = <T = unknown>(callback: TaskCallback<T>) => TaskReference<T>;
