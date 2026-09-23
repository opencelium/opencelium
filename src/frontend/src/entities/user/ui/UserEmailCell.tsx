import type {User} from '@entities/user/model/types'
import {TruncatedTextCell} from '@shared/table/TruncatedTextCell'
import {EntityAvatar} from '@shared/ui/entity-avatar/EntityAvatar'

type Props = {
    row: User
    value: unknown
}

const wrapperStyle = {display: 'inline-flex', alignItems: 'center', gap: 8} as const

export const UserEmailCell = ({row, value}: Props) => (
    <span style={wrapperStyle}>
        <EntityAvatar path={row.userDetail?.profilePicture} fallbackIcon="user" fit="cover" />

        <TruncatedTextCell value={value} />
    </span>
)
