import { memo } from 'react'
import { Link } from 'react-router-dom'
import { truncateUnbreakableText } from '@shared/ui/primitives/Table/Table.utils'
import type { Schedule } from '../model/types'

type Props = {
    schedule: Schedule
}

export const ConnectionTitleCell = memo(function ConnectionTitleCell({ schedule }: Props) {
    const connectionId = schedule.connection?.connectionId
    const title = schedule.connection?.title ?? ''
    const displayTitle = truncateUnbreakableText(title)

    if (connectionId == null) return <span title={title}>{displayTitle}</span>

    return <Link to={`/workflow/update/${connectionId}`} title={title}>{displayTitle}</Link>
})
