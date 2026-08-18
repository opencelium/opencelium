import type { Connector } from '@entities/connector/model/types'
import type { ConnectionVersionResource } from '@features/workflow/types/history.types'

export type Connection = {
    id: number
    title: string
    description: string
    fromConnector: Connector
    toConnector: Connector
    categoryId?: number | null
    modifiedAt?: number | null
    modifiedBy?: number | null
    lastVersion?: ConnectionVersionResource | null
}
