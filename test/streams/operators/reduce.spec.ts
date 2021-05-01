/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { asyncReduce, CancelError, subscribe } from '../../../src/streams/index.js';
import { stream } from '../stream.js';

describe('reduce', () => {

    it('should reduce streams', async () => {

        const reduced = asyncReduce(stream(5, 2), (value, accumulator) => accumulator + value, 0);
        let result: number;

        for await (const value of reduced) {

            result = value;
        }

        expect(result!).to.equal(10);

        expect(await reduced.next()).to.eql({ done: true, value: undefined });
    });

    it('should be cancelable', async () => {

        const reduced = asyncReduce(stream(5, 2), (value, accumulator) => value + accumulator, 0);
        let result: number;
        let error: unknown;

        const { done, cancel } = subscribe(reduced, value => {

            result = value;
            cancel();
        });

        try {

            await done;

        } catch (err) {

            error = err;
        }

        expect(result!).to.eql(0);

        expect(error).to.be.instanceOf(CancelError);

        expect(await reduced.next()).to.eql({ done: true, value: undefined });
    });
});
