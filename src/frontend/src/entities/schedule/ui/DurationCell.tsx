import { memo, useMemo } from 'react'

type Props = {
    duration?: number
}

export const DurationCell = memo(function DurationCell({ duration }: Props) {
    const formattedValue = useMemo(() => {
        if (!duration) return '-'
        const seconds = Math.trunc(duration / 1000)
        if (seconds === 0) return '<1s'
        return `${seconds}s`
    }, [duration])

    return <span>{formattedValue}</span>
})
