import { memo } from 'react'
import { formatDuration } from './cronLabel'

type Props = {
    duration?: number
}

export const DurationCell = memo(function DurationCell({ duration }: Props) {
    return <span>{formatDuration(duration)}</span>
})
