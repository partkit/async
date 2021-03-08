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
        console.log('1 added...\n');

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
});
