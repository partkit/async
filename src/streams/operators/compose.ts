import { AsyncOperator } from './types';

export function compose<T, U> (
    stream: AsyncIterable<T>,
    operator: AsyncOperator<T, U>,
): AsyncGenerator<U>;

export function compose<T, T1, U> (
    stream: AsyncIterable<T>,
    operator1: AsyncOperator<T, T1>,
    operator2: AsyncOperator<T1, U>,
): AsyncGenerator<U>;

export function compose<T, T1, T2, U> (
    stream: AsyncIterable<T>,
    operator1: AsyncOperator<T, T1>,
    operator2: AsyncOperator<T1, T2>,
    operator3: AsyncOperator<T2, U>,
): AsyncGenerator<U>;

export function compose<T, T1, T2, T3, U> (
    stream: AsyncIterable<T>,
    operator1: AsyncOperator<T, T1>,
    operator2: AsyncOperator<T1, T2>,
    operator3: AsyncOperator<T2, T3>,
    operator4: AsyncOperator<T3, U>,
): AsyncGenerator<U>;

export function compose<T, T1, T2, T3, T4, U> (
    stream: AsyncIterable<T>,
    operator1: AsyncOperator<T, T1>,
    operator2: AsyncOperator<T1, T2>,
    operator3: AsyncOperator<T2, T3>,
    operator4: AsyncOperator<T3, T4>,
    operator5: AsyncOperator<T4, U>,
): AsyncGenerator<U>;

export function compose<T, U> (stream: AsyncIterable<T>, ...operators: AsyncOperator[]): AsyncGenerator<U> {

    return operators.reduce((innerStream, operator) => operator(innerStream) as AsyncGenerator<U>, stream as AsyncGenerator<U>);
}
