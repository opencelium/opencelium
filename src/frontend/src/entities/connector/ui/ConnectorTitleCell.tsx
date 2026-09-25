import type {Connector} from '@entities/connector/model/types'
import {resolveConnectorIcon} from '@entities/connector/model/iconUrl'
import {TruncatedTextCell} from '@shared/table/TruncatedTextCell'
import {ConnectorIcon} from './ConnectorIcon'

type Props = {
    row: Connector
    value: unknown
}

const wrapperStyle = {display: 'inline-flex', alignItems: 'center', gap: 8} as const

export const ConnectorTitleCell = ({row, value}: Props) => (
    <span style={wrapperStyle}>
        <ConnectorIcon icon={resolveConnectorIcon(row)} isCircled />

        <TruncatedTextCell value={value} />
    </span>
)
