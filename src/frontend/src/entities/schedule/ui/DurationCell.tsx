import { useEffect, useMemo, useState } from 'react'
import { usePrevious } from './usePrevious'

const REFRESH_TIMEOUT = 1000

type Props = {
    duration?: number
}

export function DurationCell({ duration }: Props) {
    const prevDuration = usePrevious(duration)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        if (prevDuration !== undefined && prevDuration !== duration) {
            setIsRefreshing(true)
            const timeout = setTimeout(() => setIsRefreshing(false), REFRESH_TIMEOUT)
            return () => clearTimeout(timeout)
        }
    }, [duration, prevDuration])

    const formattedValue = useMemo(() => {
        if (!duration) return '-'
        const seconds = Math.trunc(duration / 1000)
        if (seconds === 0) return '<1s'
        return `${seconds}s`
    }, [duration])

    return (
        <span style={{ opacity: isRefreshing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {formattedValue}
        </span>
    )
}
