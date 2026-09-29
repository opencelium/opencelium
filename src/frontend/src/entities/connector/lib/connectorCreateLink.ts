/**
 * Deep link into the connector create form with its invoker already chosen.
 * The param name is shared so the link builder and the field that reads it
 * cannot drift apart.
 */
const INVOKER_PARAM = 'invoker'

export const CONNECTOR_CREATE_ROUTE = '/connector/create'

export function buildConnectorCreateLink(invokerName?: string) {
    if (!invokerName) return CONNECTOR_CREATE_ROUTE
    return `${CONNECTOR_CREATE_ROUTE}?${INVOKER_PARAM}=${encodeURIComponent(invokerName)}`
}

/**
 * Read at wizard mount by the invoker field's `getDefaultValue`. Returns '' rather
 * than undefined so the select stays a controlled empty value when absent.
 */
export function readPreselectedInvoker(): string {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get(INVOKER_PARAM) ?? ''
}
