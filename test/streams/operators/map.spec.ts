import { expect } from 'chai';
import { asyncMap, CancelError, subscribe } from '../../../src/streams/index.js';
import { stream } from '../stream.js';

const ENABLE_LOGS = false;

describe('map', () => {

    it('should map values from a stream', async () => {

        const result: number[] = [];
        const mapped = asyncMap(stream(5, 2, ENABLE_LOGS), value => value * 2);

        await subscribe(mapped, value => result.push(value)).done;

        expect(result).to.eql([0, 2, 4, 6, 8]);

        expect(await mapped.next()).to.eql({ done: true, value: undefined });
    });

    it('should be cancelable', async () => {

        const result: number[] = [];
        const mapped = asyncMap(stream(5, 2, ENABLE_LOGS), value => value * 2);
        let error: unknown;

        const { cancel, done } = subscribe(mapped, value => {

            result.push(value);

            if (result.length > 2) cancel();
        });

        try {

            await done;

        } catch (err) {

            error = err;
        }

        expect(result).to.eql([0, 2, 4]);

        expect(error).to.be.instanceOf(CancelError);

        expect(await mapped.next()).to.eql({ done: true, value: undefined });
    });
});
