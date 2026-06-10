import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Schedule } from '../model/types'

type Props = {
    schedule: Schedule
}

export const ConnectionTitleCell = memo(function ConnectionTitleCell({ schedule }: Props) {
    const connectionId = schedule.connection?.connectionId
    const title = schedule.connection?.title ?? ''

    if (connectionId == null) return <span>{title}</span>

    return <Link to={`/workflow/update/${connectionId}`}>{title}</Link>
})
