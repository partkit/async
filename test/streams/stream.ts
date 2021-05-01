import { logger } from '../../src/log.js';

export async function* stream (max = 5, delay = 2, logs = false): AsyncGenerator<number, boolean> {

    const log = logger('stream', logs);

    log('enter...');

    try {

        for (let value = 0; value < max; value++) {

            log('vield...');

            yield await new Promise<number>(resolve => setTimeout(() => resolve(value), delay));

            log('next...');
        }

    } catch (error) {

        log('throw...', error);
        throw error;

    } finally {

        log('finally...');
    }

    // we can have a return value that's different from the emissions
    // the streams return value will be used to resolve the subscription promise
    log('return...', true);

    return true;
}
