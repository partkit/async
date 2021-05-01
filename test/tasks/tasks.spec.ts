import { expect } from 'chai';
import { animationtask, microtask, task, CancelError, TaskScheduler } from '../../src/tasks/index.js';

const assertTaskResult = async (scheduler: TaskScheduler): Promise<void> => {

    let result: unknown;

    result = await scheduler(() => true).done;
    expect(result).to.equal(true);

    result = await scheduler(() => Promise.resolve().then(() => 'false')).done;
    expect(result).to.equal('false');

    result = await scheduler(() => { /* not returning anything... */ }).done;
    expect(result).to.equal(undefined);

    result = await scheduler(() => Promise.resolve().then(() => { /* not returning anything... */ })).done;
    expect(result).to.equal(undefined);
};

const assertTaskCancellation = async (scheduler: TaskScheduler): Promise<void> => {

    await cancelTask(scheduler);
    await cancelTaskWithCustomError(scheduler);
    await cancelTaskWithAbortSignal(scheduler);
    await cancelTaskMultipleTimes(scheduler);
    await cancelTaskAfterCompletion(scheduler);
};

const cancelTask = async (scheduler: TaskScheduler): Promise<void> => {

    let executed = false;
    let caught = false;
    let error: unknown;

    const { cancel, done } = scheduler(() => true);

    const doneOrCancelled = done.then(
        value => executed = value,
        reason => error = reason as unknown,
    );

    try {

        cancel();
        await done;

    } catch (err) {

        caught = true;
    }

    await doneOrCancelled;

    expect(executed).to.equal(false, 'Cancelled task should not resolve with a result');
    expect(caught).to.equal(true, 'Awaiting a cancelled task should throw');
    expect(error instanceof CancelError).to.equal(true, 'Cancelled task should reject with CancelError');
};

const cancelTaskWithCustomError = async (scheduler: TaskScheduler): Promise<void> => {

    let executed = false;
    let error: unknown;

    const { cancel, done } = scheduler(() => true);

    const doneOrCancelled = done.then(
        value => executed = value,
        reason => error = reason as unknown,
    );

    cancel('cancellation reason');

    await doneOrCancelled;

    expect(executed).to.equal(false, 'Cancelled task should not resolve with a result');
    expect(error).to.equal('cancellation reason', 'Cancelled task should reject with provided reason');
};

const cancelTaskWithAbortSignal = async (scheduler: TaskScheduler): Promise<void> => {

    let executed = false;
    let error: unknown;

    const controller = new AbortController();

    const { done } = scheduler(() => true, controller.signal);

    const doneOrCancelled = done.then(
        value => executed = value,
        reason => error = reason as unknown,
    );

    controller.abort();

    await doneOrCancelled;

    expect(executed).to.equal(false, 'Cancelled task should not resolve with a result');
    expect(error instanceof CancelError).to.equal(true, 'Cancelled task should reject with CancelError');
};

const cancelTaskMultipleTimes = async (scheduler: TaskScheduler): Promise<void> => {

    let executed = false;
    let error: unknown;

    const controller = new AbortController();

    const { cancel, done } = scheduler(() => true, controller.signal);

    const doneOrCancelled = done.then(
        value => executed = value,
        reason => error = reason as unknown,
    );

    cancel('first cancellation');
    cancel('second cancellation');
    controller.abort();

    await doneOrCancelled;

    expect(executed).to.equal(false, 'Cancelled task should not resolve with a result');
    // cancellation should happen only once, consecutive cancellations shouldn't have any effect
    expect(error).to.equal('first cancellation', 'Task cancellation should happen only once');

    await done.catch(reason => expect(reason).to.equal(
        'first cancellation',
        'Cancelled task should be rejected with first cancellation reason',
    ));
};

const cancelTaskAfterCompletion = async (scheduler: TaskScheduler): Promise<void> => {

    let executed = false;
    let error: unknown;

    const controller = new AbortController();

    const { cancel, done } = scheduler(() => true, controller.signal);

    const doneOrCancelled = done.then(
        value => executed = value,
        reason => error = reason as unknown,
    );

    // we let the task complete first
    await doneOrCancelled;

    cancel('first cancellation');
    controller.abort();
    cancel('second cancellation');

    expect(executed).to.equal(true, 'Non-cancelled task should resolve with result');
    // once a task is completed, cancellations shouldn't have any effect
    expect(error).to.equal(undefined, 'Completed task should not be cancellable');
};

describe('microtask', () => {

    it('should schedule a microtask', async () => {

        let result = false;

        // schedule a microtask
        const { done } = microtask(() => {

            result = true;
        });

        // microtask should run *after* synchronous code
        expect(result).to.equal(false);

        // await the microtask
        await done;

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

    it('should be cancellable', async () => {

        await assertTaskCancellation(microtask);
    });
});

describe('task', () => {

    it('should schedule a task', async () => {

        let result = false;

        // schedule a task
        const { done } = task(() => {

            result = true;
        });

        // task should run *after* synchronous code
        expect(result).to.equal(false);

        await Promise.resolve().then(() => {
            // wait a microtask
        });

        // task should run *after* microtasks
        expect(result).to.equal(false);

        // await the task
        await done;

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

    it('should be cancellable', async () => {

        await assertTaskCancellation(task);
    });
});

xdescribe('animationtask', () => {

    it('should schedule an animationtask', async () => {

        let result = false;

        // schedule an animationtask
        const { done } = animationtask(() => {

            result = true;
        });

        // animationtask should run *after* synchronous code
        expect(result).to.equal(false);

        await Promise.resolve().then(() => {
            // wait a microtask
        });

        // animationtask should run *after* microtasks
        expect(result).to.equal(false);

        // we can't predict if the animationFrame will trigger
        // after the next task - scheduling depends on browser
        // and tests could be flaky

        // await the animationtask
        await done;

        // result should be updated
        expect(result).to.equal(true);
    });

    it('should resolve with the callback\'s return value', async () => {

        await assertTaskResult(animationtask);
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

    it('should be cancellable', async () => {

        await assertTaskCancellation(animationtask);
    });
});
