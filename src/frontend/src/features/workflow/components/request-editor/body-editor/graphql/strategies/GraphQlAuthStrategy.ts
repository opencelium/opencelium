import type { Connector } from '@entities/connector/model/types'
import type { GraphQlQueryParams, GraphQlQueryResult } from '../graphQlTypes'

export type GraphQlLoginResult =
    | { ok: true; accessToken: string }
    | { ok: false; error: unknown }

export type GraphQlQueryOutcome =
    | { ok: true; result: GraphQlQueryResult }
    | { ok: false; error: unknown }

export interface GraphQlAuthStrategy {
    login(connector: Connector): Promise<GraphQlLoginResult>
    query(params: GraphQlQueryParams): Promise<GraphQlQueryOutcome>
}
