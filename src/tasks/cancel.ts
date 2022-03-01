import { CancelError } from '../cancellation/index.js';
import { TaskReference } from './types.js';

/**
 * Cancel a task without an unhandled Promise rejection.
 */
export const cancelTask = (task: TaskReference): void => {

    task.done.catch(error => {

        if (!(error instanceof CancelError)) throw error;
    });

    task.cancel();
};
