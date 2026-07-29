import type { Connector } from '@entities/connector/model/types'

export type Connection = {
    id: number
    title: string
    description: string
    fromConnector: Connector
    toConnector: Connector
    categoryId?: number | null
}
