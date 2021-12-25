import { expect } from 'chai';
import { asyncFilter, CancelError, subscribe } from '../../../src/index.js';
import { stream } from '../stream.js';

describe('filter', () => {

    it('should filter streams', async () => {

        const result: number[] = [];
        const filtered = asyncFilter(stream(5, 2), value => value % 2 === 0);

        for await (const value of filtered) {

            result.push(value);
        }

        expect(result).to.eql([0, 2, 4]);

        expect(await filtered.next()).to.eql({ done: true, value: undefined });
    });

    it('should be cancelable', async () => {

        const result: number[] = [];
        const filtered = asyncFilter(stream(5, 2), value => value % 2 === 0);
        let error: unknown;

        const { done, cancel } = subscribe(filtered, value => {

            result.push(value);
            cancel();
        });

        try {

            await done;

        } catch (err) {

            error = err;
        }

        expect(result).to.eql([0]);

        expect(error).to.be.instanceOf(CancelError);

        expect(await filtered.next()).to.eql({ done: true, value: undefined });
    });
});
