import type { Connector } from '@entities/connector/model/types'
import type { GraphQlAuthStrategy, GraphQlLoginResult, GraphQlQueryOutcome } from './GraphQlAuthStrategy'
import type { GraphQlQueryParams, GraphQlQueryResult } from '../graphQlTypes'
import { remoteApiRequest } from './remoteApiRequest'

export const staticTokenGraphQlStrategy: GraphQlAuthStrategy = {
    async login(connector: Connector): Promise<GraphQlLoginResult> {
        return { ok: true, accessToken: connector.requestData?.token ?? '' }
    },

    async query({ url, accessToken, sslOn, query, variables, operationName }: GraphQlQueryParams): Promise<GraphQlQueryOutcome> {
        const result = await remoteApiRequest<GraphQlQueryResult>({
            url,
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
                Authorization: `Token ${accessToken}`,
            },
            body: { query, variables, operationName },
            sslOn,
        })

        return result.ok ? { ok: true, result: result.data } : { ok: false, error: result.error }
    },
}
