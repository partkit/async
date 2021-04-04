import { expect } from 'chai';
import { CancelError } from '../../src/cancellation';
import { subscribe } from '../../src/streams';

describe('subscribe', () => {

    async function* stream (max = 5, delay = 2) {

        for (let value = 0; value < max; value++) {

            yield await new Promise<number>(resolve => setTimeout(() => resolve(value), delay));
        }

        // we can have a return value that's different from the emissions
        // the streams return value will be used to resolve the subscription promise
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async function* increment (max = 5, initial = 0) {

        let count = 0;

        while (count < max) {

            initial = (yield initial + 1) as number;
            count++;
        }
    }

    it('should subscribe to streams', async () => {

        const result: number[] = [];
        const count = 5;
        const delay = 2;
        const start = Date.now();

        await subscribe(stream(count, delay), value => result.push(value)).done;

        const duration = Date.now() - start;

        expect(result).to.eql([0, 1, 2, 3, 4]);
        expect(duration > count * delay).to.equal(true);
    });

    it('should be cancelable', async () => {

        const result: number[] = [];
        const count = 5;
        const delay = 2;
        const max = 2;
        const start = Date.now();
        let error!: Error;

        try {

            const { cancel, done } = subscribe(stream(count, delay), value => {
                result.push(value);
                if (value >= max) { cancel(); }
            });

            await done;

        } catch (err) {

            error = err as Error;
        }

        const duration = Date.now() - start;

        expect(result).to.eql([0, 1, 2]);
        expect(duration < count * delay).to.equal(true);
        expect(duration > max * delay).to.equal(true);
        expect(error instanceof CancelError).to.equal(true);
    });

    it('should be cancelable with custom error', async () => {

        const result: number[] = [];
        const reason = 'foo';
        let error!: unknown;

        try {

            const { cancel, done } = subscribe(stream(), value => {
                result.push(value);
                cancel(reason);
            });

            await done;

        } catch (err) {

            error = err;
        }

        expect(result).to.eql([0]);
        expect(error).to.equal(reason);
    });

    it('should pass return values from the callback to the stream', async () => {

        const result: number[] = [];

        await subscribe(increment(), value => {
            result.push(value);
            // a return value from the subscrition callback should be used by `subscribe`
            // to invoke the stream's `next()` method with
            return value * 2;
        }).done;

        expect(result).to.eql([1, 3, 7, 15, 31]);
    });

    it('should allow for backpressure from callback', async () => {

        const result: number[] = [];
        const count = 5;
        const delay = 2;
        const start = Date.now();

        const { cancel, done } = subscribe(stream(count, delay), async value => {
            result.push(value);
            // returning a promise from the subscription callback should apply
            // backpressure - subscribe should wait for the promise to resolve
            // before invoking the stream's next method
            await new Promise(resolve => setTimeout(resolve, delay));
        });

        await done;

        const duration = Date.now() - start;

        expect(result).to.eql([0, 1, 2, 3, 4]);
        expect(duration > count * delay).to.equal(true);
        // the callback has the same delay as the stream, so duration should be double
        expect(duration > 2 * count * delay).to.equal(true);
    });

    it('should throw error from callback on the stream', async () => {

        const count = 5;
        const delay = 2;
        let error!: Error;

        const { done } = subscribe(stream(count, delay), () => { throw new Error('CallbackError'); });

        try {

            await done;

        } catch (err) {

            error = err as Error;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('CallbackError');
    });

    it('should resolve with the return value of the stream', async () => {

        const emissions: number[] = [];

        const result = await subscribe(stream(), value => emissions.push(value)).done;

        // stream should emit numbers
        expect(emissions).to.eql([0, 1, 2, 3, 4]);
        // subscription should resolve with boolean value
        expect(result).to.equal(true);
    });
});
