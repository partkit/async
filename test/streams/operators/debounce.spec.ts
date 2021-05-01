import { expect } from 'chai';
import { asyncDebounce, asyncQueue, CancelError, delay, subscribe } from '../../../src/index.js';
import { stream } from '../stream.js';

describe('debounce', () => {

    it('should debounce when emit frequency is higher than debounce time', async () => {

        const result: number[] = [];
        const time = 5;
        const max = 5;
        const delay = 2; // lower delay means higher emit frequency
        const debounced = asyncDebounce(stream(max, delay), time);
        const start = Date.now();

        for await (const value of debounced) {

            result.push(value);
        }

        const duration = Date.now() - start;

        expect(result).to.eql([4], 'only the last value should be emitted');

        expect(duration >= max * delay + time).to.equal(true, `should take at least ${ max * delay + time }ms`);

        expect(await debounced.next()).to.eql({ done: true, value: undefined });
    });

    it('should debounce when emit frequency is lower than debounce time', async () => {

        const result: number[] = [];
        const time = 5;
        const max = 5;
        const delay = 6; // higher delay means lower emit frequency
        const debounced = asyncDebounce(stream(max, delay), time);
        const start = Date.now();

        for await (const value of debounced) {

            result.push(value);
        }

        const duration = Date.now() - start;

        expect(result).to.eql([0, 1, 2, 3, 4]);

        expect(duration >= max * delay + time).to.equal(true, `should take at least ${ time }ms`);

        expect(await debounced.next()).to.eql({ done: true, value: undefined });
    });

    it('should debounce when emit frequency is variable', async () => {

        const result: number[] = [];
        const time = 5;
        const queue = asyncQueue<number>();

        const debounced = asyncDebounce(queue, time);

        const { done } = subscribe(debounced, value => result.push(value));

        await delay(() => queue.add(0), 1).done;
        await delay(() => queue.add(1), 1).done;
        await delay(() => queue.add(2), 1).done;

        await delay(() => queue.add(3), 10).done;

        await delay(() => queue.add(4), 10).done;
        await delay(() => queue.add(5), 2).done;
        await delay(() => queue.add(6), 3).done;

        await delay(() => queue.add(7), 10).done;

        await queue.return();

        await done;

        expect(result).to.eql([2, 3, 6, 7]);

        expect(await debounced.next()).to.eql({ done: true, value: undefined });
    });

    it('should reject on error', async () => {

        const result: number[] = [];
        const time = 5;
        const queue = asyncQueue<number>();
        let error: unknown;

        const debounced = asyncDebounce(queue, time);

        const { done, cancel } = subscribe(debounced, value => result.push(value));

        await delay(() => queue.add(0), 1).done;
        await delay(() => queue.add(1), 1).done;
        await delay(() => queue.add(2), 1).done;
        await delay(() => cancel(), 1).done;

        try {

            await done;

        } catch (e) {

            error = e;
        }

        // TODO: review this - should a cancelled debounce stream still emit last item when cancelled before debounce time?
        expect(result).to.eql([2]);

        expect(error instanceof CancelError).to.equal(true);
    });
});
