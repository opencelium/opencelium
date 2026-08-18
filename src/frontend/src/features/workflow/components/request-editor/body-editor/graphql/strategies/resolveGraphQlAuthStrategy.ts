import type { Connector } from '@entities/connector/model/types'
import type { GraphQlAuthStrategy } from './GraphQlAuthStrategy'
import { staticTokenGraphQlStrategy } from './StaticTokenGraphQlStrategy'
import { dynamicTokenGraphQlStrategy } from './DynamicTokenGraphQlStrategy'

export const resolveGraphQlAuthStrategy = (connector: Connector): GraphQlAuthStrategy =>
    connector.invoker.requiredData?.token ? dynamicTokenGraphQlStrategy : staticTokenGraphQlStrategy
