export const logger = (prefix: string, enabled = true) =>
    (...args: unknown[]): void => {

        if (enabled) {

            console.log(`[${ prefix }]: `, ...args);
        }
    };
