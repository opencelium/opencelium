/** What kind of failure an error text shows; the model is told it, so it does not guess between look-alike causes. */
export type ConnectorErrorKind =
    | 'unknownHost' | 'refused' | 'timeout' | 'certificate' | 'unauthorized' | 'forbidden' | 'notFound' | 'serverError'
    | 'badRequest' | 'unknown'

const RULES: { kind: ConnectorErrorKind; pattern: RegExp }[] = [
    { kind: 'unknownHost', pattern: /UnknownHost|Name or service not known|nodename nor servname|getaddrinfo|ENOTFOUND|No such host/i },
    { kind: 'refused', pattern: /Connection refused|ECONNREFUSED|ConnectException/i },
    { kind: 'timeout', pattern: /timed? ?out|SocketTimeout|ETIMEDOUT|Read timeout|Connect timeout/i },
    { kind: 'certificate', pattern: /PKIX|SSLHandshake|certificate|unable to find valid certification path|SSL/i },
    { kind: 'unauthorized', pattern: /\b401\b|Unauthori[sz]ed|invalid (credentials|token|api key)|authentication failed/i },
    { kind: 'forbidden', pattern: /\b403\b|Forbidden|permission/i },
    { kind: 'notFound', pattern: /\b404\b|Not Found/i },
    { kind: 'serverError', pattern: /\b5\d\d\b|Internal Server Error|Bad Gateway|Service Unavailable/i },
    { kind: 'badRequest', pattern: /\b400\b|Bad Request/i },
]

const MEANING: Record<ConnectorErrorKind, string> = {
    unknownHost: 'the host name in the URL could not be resolved (a typo in the URL, or DNS/network)',
    refused: 'the host was reached but nothing accepts connections on that port (wrong port or protocol, service down, firewall)',
    timeout: 'the system did not answer in time (unreachable network, firewall, proxy, or a slow system)',
    certificate: 'the HTTPS certificate is not trusted (self-signed or internal CA missing from the Java truststore)',
    unauthorized: 'the system refused the credentials (wrong user, password, token or API key, or wrong auth method)',
    forbidden: 'the credentials are valid but lack permission for the test call',
    notFound: 'the URL reaches a server, but the path of the test call does not exist there (base URL or API path wrong)',
    serverError: 'the remote system failed while answering (its own problem, or a request it cannot handle)',
    badRequest: 'the system rejected the test request itself (a required setting such as a web service name may be wrong)',
    unknown: 'the error text does not show which kind of failure it is',
}

export function classifyConnectorError(error: string, status: string): { kind: ConnectorErrorKind; meaning: string } {
    const rule = RULES.find((candidate) => candidate.pattern.test(error))
    const kind = rule?.kind ?? (status === 'AUTH_FAILED' ? 'unauthorized' : 'unknown')
    return { kind, meaning: MEANING[kind] }
}
