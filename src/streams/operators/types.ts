export type Awaitable<T> = T | Promise<T>;

export type AsyncOperator<T = unknown, U = T> = (stream: AsyncIterable<T>) => AsyncGenerator<U, void>;
