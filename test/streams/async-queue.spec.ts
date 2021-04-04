import { expect } from 'chai';
import { CancelError, subscribe } from '../../src/streams';
import { asyncQueue } from '../../src/streams/async-queue';

describe('asyncQueue', () => {

    it('should emit items', async () => {

        const result: number[] = [];
        let error: unknown;

        const queue = asyncQueue<number>();

        const { cancel, done } = subscribe(queue, value => {

            result.push(value);

            if (value >= 3) cancel();

            queue.add(value + 1);
        });

        queue.add(1);

        try {

            await done;

        } catch (err) {

            error = err;
        }

        // add should have no effect after cancel
        queue.add(10);

        // the queue should be 'done' after cancel
        expect(await queue.next()).to.eql({ value: undefined, done: true });

        expect(result).to.eql([1, 2, 3]);
        expect(error instanceof CancelError).to.equal(true);
    });

    it('should be \'done\' after breaking off async for-loop', async () => {

        const result: number[] = [];

        const queue = asyncQueue<number>();

        queue.add(1);
        queue.add(2);
        queue.add(3);

        for await (const value of queue) {
            result.push(value);
            if (value >= 3) break;
        }

        // we should receive all values
        expect(result).to.eql([1, 2, 3]);
        // the queue should be 'done'
        expect(await queue.next()).to.eql({ value: undefined, done: true });
    });

    it('should allow synchronous next() calls', async () => {

        const queue = asyncQueue<number>();

        const promises = [
            queue.next(),
            queue.next(),
            queue.next(),
        ];

        queue.add(1);
        queue.add(2);
        queue.add(3);

        const result = (await Promise.all(promises)).map(res => res.value);

        await queue.return();

        // we should receive all values
        expect(result).to.eql([1, 2, 3]);
        // the queue should be 'done' after return
        expect(await queue.next()).to.eql({ value: undefined, done: true });
    });

    it('should not add more values after queue is done', async () => {

        let queue = asyncQueue<number>();
        let result: number[] = [];
        let error!: Error | undefined;

        const done = subscribe(queue, value => {

            result.push(value);
        }).done;

        queue.add(1);
        queue.add(2);
        queue.add(3);

        await queue.return();

        // should have no effect after queue is 'done'
        queue.add(10);

        await done;

        expect(result).to.eql([1]);
        expect(await queue.next()).to.eql({ value: undefined, done: true });



        queue = asyncQueue<number>();
        result = [];
        error = undefined;

        const done2 = subscribe(queue, value => {

            result.push(value);
        }).done;

        queue.add(1);
        queue.add(2);
        queue.add(3);

        try {

            await queue.throw(new Error('TestError'));

        } catch (err) {

            error = err as Error;
        }

        // should have no effect after queue is 'done'
        queue.add(10);

        await done2;

        expect(result).to.eql([1]);
        expect(await queue.next()).to.eql({ value: undefined, done: true });

        // subscription should throw the queue error
        expect(error).to.be.instanceOf(Error);
        expect(error?.message).to.equal('TestError');
    });

    describe('should throw if push queue reaches maximum size', () => {

        it('should throw if maxSize is reached before any yield', async () => {

            const queue = asyncQueue<number>(3);
            const result: number[] = [];
            let syncError!: Error;
            let asyncError!: Error;

            try {

                queue.add(1);
                queue.add(2);
                queue.add(3);
                queue.add(4);

            } catch (error) {

                // queue.add() will throw after we reach maxSize
                syncError = error as Error;
            }

            try {

                for await (const value of queue) {

                    result.push(value);
                }

            } catch (error) {

                // queue will throw on first attempted iteration
                asyncError = error as Error;
            }

            // queue should throw and not produce any result
            expect(result).to.eql([]);

            // queue.add should throw an error
            expect(syncError).to.be.instanceOf(Error);
            expect(syncError.message).to.equal('asyncQueue: Maximum queue size reached: 3');

            // queue should throw on first iteration
            expect(asyncError).to.be.instanceOf(Error);
            expect(asyncError.message).to.equal('asyncQueue: Maximum queue size reached: 3');

            // queue should be 'done' and not produce any result
            expect(await queue.next()).to.eql({ value: undefined, done: true });
        });

        it('should reject pending promises if maxSize is reached', async () => {

            const queue = asyncQueue<number>(3);
            let syncError!: Error;
            let asyncError!: Error;

            const promises = [
                queue.next(),
                queue.next(),
                queue.next(),
                queue.next(),
            ];

            try {

                queue.add(1);
                queue.add(2);
                queue.add(3);
                queue.add(4);
                queue.add(5);

            } catch (error) {

                // queue.add() will throw after we reach maxSize
                syncError = error as Error;
            }

            try {

                await Promise.all(promises);

            } catch (error) {

                // Promise.all should reject from the pending promises
                asyncError = error as Error;
            }

            // queue.add should throw an error
            expect(syncError).to.be.instanceOf(Error);
            expect(syncError.message).to.equal('asyncQueue: Maximum queue size reached: 3');

            // Promise.all should reject
            expect(asyncError).to.be.instanceOf(Error);
            expect(asyncError.message).to.equal('asyncQueue: Maximum queue size reached: 3');

            // the queue should be 'done' after error
            expect(await queue.next()).to.eql({ value: undefined, done: true });
        });

        it('should throw on subscription if maxSize is reached', async () => {

            const queue = asyncQueue<number>(3);
            const result: number[] = [];
            let error!: Error;

            const { done } = subscribe(queue, value => {

                result.push(value);

                queue.add(2);
                queue.add(3);
                queue.add(4);
                queue.add(5);
            });

            queue.add(1);

            try {

                await done;

            } catch (err) {

                error = err as Error;
            }

            expect(result).to.eql([1]);

            // subscription should throw the queue error
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('asyncQueue: Maximum queue size reached: 3');

            // the queue should be 'done' after error
            expect(await queue.next()).to.eql({ value: undefined, done: true });
        });
    });
});
