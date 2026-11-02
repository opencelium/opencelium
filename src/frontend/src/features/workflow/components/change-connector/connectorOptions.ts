export function connectorsWithSameInvoker<T extends {invoker?: {name?: string | null}; invokerName?: string | null}>(
    connectors: T[], invokerName: string | null | undefined,
): T[] {
    const name = invokerName?.toLowerCase();
    return name ? connectors.filter((connector) =>
        (connector.invokerName ?? connector.invoker?.name)?.toLowerCase() === name) : [];
}
