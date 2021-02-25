import { expect } from 'chai';
import { animationtask, microtask, task, TaskScheduler } from '../../src/tasks/tasks';

const assertTaskResult = async (scheduler: TaskScheduler<unknown>): Promise<void> => {

    let result: unknown;

    result = await scheduler(() => true);
    expect(result).to.equal(true);

    result = await scheduler(() => Promise.resolve().then(() => 'false'));
    expect(result).to.equal('false');

    result = await scheduler(() => { /* not returning anything... */ });
    expect(result).to.equal(undefined);

    result = await scheduler(() => Promise.resolve().then(() => { /* not returning anything... */ }));
    expect(result).to.equal(undefined);
};

describe('microTask', () => {

    it('should schedule a microtask', async () => {

        let result = false;

        // schedule a microtask
        const taskFinished = microtask(() => {

            result = true;
        });

        // microtask should run *after* synchronous code
        expect(result).to.equal(false);

        // await the microtask
        await taskFinished;

        // result should be updated
        expect(result).to.equal(true);
    });

    it('should resolve with the callback\'s return value', async () => {

        await assertTaskResult(microtask);
    });

    it('should execute microtask in expected order', async () => {

        const result: number[] = [];

        // schedule a task
        setTimeout(() => result.push(4), 0);

        // schedule a microtask
        void Promise.resolve().then(() => result.push(1));

        // schedule a microtask with the function under test
        void microtask(() => result.push(2));

        // schedule another microtask
        void Promise.resolve().then(() => result.push(3));

        // run this synchronously
        result.push(0);

        // schedule a final task which should complete last
        const done = new Promise<void>(resolve => {

            setTimeout(() => {

                result.push(5);
                resolve();
            }, 0);
        });

        await done;

        expect(result).to.eql([0, 1, 2, 3, 4, 5]);
    });
});

describe('task', () => {

    it('should schedule a task', async () => {

        let result = false;

        // schedule a task
        const taskFinished = task(() => {

            result = true;
        });

        // task should run *after* synchronous code
        expect(result).to.equal(false);

        await Promise.resolve().then(() => {
            // wait a microtask
        });

        // task should run *after* microtasks
        expect(result).to.equal(false);

        // await the microtask
        await taskFinished;

        // result should be updated
        expect(result).to.equal(true);
    });

    it('should resolve with the callback\'s return value', async () => {

        await assertTaskResult(task);
    });

    it('should execute task in expected order', async () => {

        const result: number[] = [];

        // schedule a task
        setTimeout(() => result.push(4), 0);

        // schedule a microtask
        void Promise.resolve().then(() => result.push(1));

        // schedule a task with the function under test
        void task(() => result.push(2));

        // schedule another microtask
        void Promise.resolve().then(() => result.push(3));

        // run this synchronously
        result.push(0);

        // schedule a final task which should complete last
        const done = new Promise<void>(resolve => {

            setTimeout(() => {

                result.push(5);
                resolve();
            }, 0);
        });

        await done;

        expect(result).to.eql([0, 1, 3, 4, 2, 5]);
    });
});

xdescribe('animationtask', () => {

    it('should schedule an animationtask', async () => {

        let result = false;

        // schedule a microtask
        const taskFinished = animationtask(() => {

            result = true;
        });

        // task should run *after* synchronous code
        expect(result).to.equal(false);

        await Promise.resolve().then(() => {
            // wait a microtask
        });

        // task should run *after* microtasks
        expect(result).to.equal(false);

        // await the microtask
        await taskFinished;

        // result should be updated
        expect(result).to.equal(true);
    });

    it('should resolve with the callback\'s return value', async () => {

        await assertTaskResult(animationtask);
    });

    // it('should execute task in expected order', async () => {

    //     const result: number[] = [];

    //     // schedule a task
    //     setTimeout(() => result.push(4), 0);

    //     // schedule a microtask
    //     void Promise.resolve().then(() => result.push(1));

    //     // schedule a task with the function under test
    //     void task(() => result.push(2));

    //     // schedule another microtask
    //     void Promise.resolve().then(() => result.push(3));

    //     // run this synchronously
    //     result.push(0);

    //     // schedule a final task which should complete last
    //     const done = new Promise<void>(resolve => {

    //         setTimeout(() => {

    //             result.push(5);
    //             resolve();
    //         }, 0);
    //     });

    //     await done;

    //     expect(result).to.eql([0, 1, 3, 4, 2, 5]);
    // });
});
