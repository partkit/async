import { expect } from 'chai';
import { CancelError, compose, filter, map, subscribe } from '../../../src/index.js';
import { stream } from '../stream.js';

const ENABLE_LOGS = false;

describe('compose', () => {

    it('should compose operators', async () => {

        const result: number[] = [];

        const pipeline = compose(
            stream(5, 2, ENABLE_LOGS),
            map(value => value * 2),
            filter(value => value > 2),
        );

        const { done } = subscribe(pipeline, value => result.push(value));

        await done;

        expect(result).to.eql([4, 6, 8]);
        // pipeline should be 'done'
        expect(await pipeline.next()).to.eql({ done: true, value: undefined });
    });

    it('should compose operators in correct order', async () => {

        const result: number[] = [];

        const pipeline = compose(
            stream(5, 2, ENABLE_LOGS),
            filter(value => value > 2),
            map(value => value * 2),
        );

        const { done } = subscribe(pipeline, value => result.push(value));

        await done;

        expect(result).to.eql([6, 8]);
        // pipeline should be 'done'
        expect(await pipeline.next()).to.eql({ done: true, value: undefined });
    });

    it('should cancel all operators', async () => {

        const result: number[] = [];
        let error: unknown;

        const pipeline = compose(
            stream(5, 2, ENABLE_LOGS),
            filter(value => value > 2),
            map(value => value * 2),
        );

        const { done, cancel } = subscribe(pipeline, value => {

            if (value > 6) {

                cancel();

            } else {

                result.push(value);
            }
        });

        try {
            await done;
        } catch (err) {
            error = err;
        }

        expect(result).to.eql([6]);
        expect(error).to.be.instanceOf(CancelError);
        // pipeline should be 'done'
        expect(await pipeline.next()).to.eql({ done: true, value: undefined });
    });
});
