import type {Role} from '@entities/role/model/types'
import {TruncatedTextCell} from '@shared/table/TruncatedTextCell'
import {RoleIcon} from './RoleIcon'

type Props = {
    row: Role
    value: unknown
}

const wrapperStyle = {display: 'inline-flex', alignItems: 'center', gap: 8} as const

export const RoleNameCell = ({row, value}: Props) => (
    <span style={wrapperStyle}>
        <RoleIcon icon={row.icon} />

        <TruncatedTextCell value={value} />
    </span>
)
