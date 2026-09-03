async function withTimeout<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    ms: number = 40_000
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);

    try {
        return await operation(controller.signal);
    } finally {
        clearTimeout(timeout);
    }
}

export default withTimeout;
