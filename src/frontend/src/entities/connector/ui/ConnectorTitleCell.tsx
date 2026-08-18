import type {Connector} from '@entities/connector/model/types'
import {ConnectorIcon} from './ConnectorIcon'

type Props = {
    row: Connector
    value: unknown
}

const wrapperStyle = {display: 'inline-flex', alignItems: 'center', gap: 8} as const

export const ConnectorTitleCell = ({row, value}: Props) => (
    <span style={wrapperStyle}>
        <ConnectorIcon icon={row.icon} />

        <span style={{ whiteSpace: 'normal' }}>{String(value ?? '')}</span>
    </span>
)
