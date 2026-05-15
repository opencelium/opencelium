export function debouncePromise<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    delay: number
): T {
    let timeout: NodeJS.Timeout | null = null;

    return ((...args: unknown[]) => {
        return new Promise((resolve) => {
            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(async () => {
                const result = await fn(...args);
                resolve(result);
            }, delay);
        });
    }) as T;
}
