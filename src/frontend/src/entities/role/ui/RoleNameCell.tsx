import type {Role} from '@entities/role/model/types'
import {TruncatedTextCell} from '@shared/table/TruncatedTextCell'
import {EntityAvatar} from '@shared/ui/entity-avatar/EntityAvatar'

type Props = {
    row: Role
    value: unknown
}

const wrapperStyle = {display: 'inline-flex', alignItems: 'center', gap: 8} as const

export const RoleNameCell = ({row, value}: Props) => (
    <span style={wrapperStyle}>
        <EntityAvatar path={row.icon} fallbackIcon="team" imageSize={20} />

        <TruncatedTextCell value={value} />
    </span>
)
