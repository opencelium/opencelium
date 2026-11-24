export function debouncePromise<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    delay: number
): (...args: TArgs) => Promise<TResult> {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: TArgs) => {
        return new Promise<TResult>((resolve) => {
            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(async () => {
                const result = await fn(...args);
                resolve(result);
            }, delay);
        });
    };
}
