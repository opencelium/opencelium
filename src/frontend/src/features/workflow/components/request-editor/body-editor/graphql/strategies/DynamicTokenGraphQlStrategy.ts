import type { Connector } from '@entities/connector/model/types'
import type { InvokerOperation } from '@entities/invoker/model/types'
import type { GraphQlAuthStrategy, GraphQlLoginResult, GraphQlQueryOutcome } from './GraphQlAuthStrategy'
import type { GraphQlQueryParams, GraphQlQueryResult } from '../graphQlTypes'
import { remoteApiRequest } from './remoteApiRequest'

type LoginOperationFields = {
    query?: string
    variables?: Record<string, string>
}

// The requiredData token reference has the shape "${operationName.someKey.path.to.token}" —
// the operation whose response yields the token, and a path into that response's parsed
// JSON body. Ported verbatim from the v4.8.3 GraphiQLRequestWithDynamicToken.login.
const parseTokenReference = (tokenReference: string): { operationName: string; pathToToken: string[] } | null => {
    const inner = tokenReference.substring(2, tokenReference.length - 1)
    const segments = inner.split('.')
    if (segments.length <= 2) return null

    const operationName = segments[0]
    const pathToToken = segments.slice(2)
    return { operationName, pathToToken }
}

const buildLoginVariables = (fields: LoginOperationFields, connector: Connector): Record<string, unknown> => {
    const variables: Record<string, unknown> = {}
    for (const param in fields.variables) {
        const value = fields.variables[param]
        if (typeof value === 'string' && value[0] === '{' && value[value.length - 1] === '}') {
            variables[param] = connector.requestData?.[value.substring(1, value.length - 1)]
        } else {
            variables[param] = connector.requestData?.[param]
        }
    }
    return variables
}

const extractTokenAtPath = (body: unknown, pathToToken: string[]): string => {
    let cursor: unknown = body
    for (const segment of pathToToken) {
        if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) return ''
        cursor = (cursor as Record<string, unknown>)[segment]
    }
    return typeof cursor === 'string' ? cursor : ''
}

export const dynamicTokenGraphQlStrategy: GraphQlAuthStrategy = {
    async login(connector: Connector): Promise<GraphQlLoginResult> {
        const tokenReference = connector.invoker.requiredData?.token
        if (!tokenReference) return { ok: true, accessToken: '' }

        const parsed = parseTokenReference(tokenReference)
        if (!parsed) return { ok: true, accessToken: '' }

        const loginOperation = connector.invoker.operations.find(
            (operation: InvokerOperation) => operation.name === parsed.operationName,
        )
        if (!loginOperation) return { ok: true, accessToken: '' }

        const fields = loginOperation.request.body.fields as LoginOperationFields
        const variables = buildLoginVariables(fields, connector)

        const result = await remoteApiRequest({
            url: connector.requestData?.url ?? '',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            body: { query: fields.query, variables },
            sslOn: connector.sslCert,
        })

        if (!result.ok) return { ok: false, error: result.error }
        return { ok: true, accessToken: extractTokenAtPath(result.data, parsed.pathToToken) }
    },

    async query({ url, accessToken, sslOn, query, variables, operationName }: GraphQlQueryParams): Promise<GraphQlQueryOutcome> {
        const result = await remoteApiRequest<GraphQlQueryResult>({
            url,
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: { query, variables, operationName },
            sslOn,
        })

        return result.ok ? { ok: true, result: result.data } : { ok: false, error: result.error }
    },
}
