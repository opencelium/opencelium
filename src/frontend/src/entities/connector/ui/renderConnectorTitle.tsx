import type {Connector} from '@entities/connector/model/types'
import {ConnectorTitleCell} from './ConnectorTitleCell'

export const renderConnectorTitle = (row: unknown, value: unknown) => (
    <ConnectorTitleCell row={row as Connector} value={value} />
)
