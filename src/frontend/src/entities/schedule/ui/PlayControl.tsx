import {useState} from 'react'
import {message, Progress} from 'antd'
import {IconButton} from '@shared/ui/primitives/IconButton'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Icon} from '@shared/ui/primitives/Icon'
import {useGeneralRequestMutation} from '@shared/api/genericApi'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import type {Schedule} from '../model/types'
import { notifyError } from '@shared/ui/feedback/notifyError'

export type RingStatus = 'success' | 'exception'
export type PlayVariant = 'bare' | 'neutral' | RingStatus

const NEUTRAL_STROKE = 'var(--color-border-strong)'
const NEUTRAL_TRAIL = 'var(--color-border-subtle)'
const CIRCLE_SIZE = 28

// The backend rejects a manual trigger while the schedule is already running
// with this code; it can surface in the error body's message/error/code field.
function isConcurrentTestForbidden(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const data = (error as {data?: unknown}).data
    const candidates = [error, data].flatMap((source) =>
        source && typeof source === 'object'
            ? [
                  (source as Record<string, unknown>).message,
                  (source as Record<string, unknown>).error,
                  (source as Record<string, unknown>).code,
              ]
            : [source]
    )
    return candidates.some(
        (value) =>
            typeof value === 'string' && value.includes('CONCURRENT_TEST_IS_FORBIDDEN')
    )
}

type Props = {
    schedule: Schedule
    variant: PlayVariant
    blockedHint: string | null
}

export function PlayControl({schedule, variant, blockedHint}: Props) {
    const {t: tEntities} = useI18n('entities')
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)
    const isBlocked = blockedHint != null
    const tooltip = blockedHint ?? tEntities('schedule.start.tooltip')

    const handleClick = async () => {
        setPending(true)
        try {
            await generalRequest({
                url: `/scheduler/execute/${schedule.schedulerId}`,
                method: 'GET',
                options: {ignoreError: true},
            }).unwrap()
            message.success(tEntities('schedule.start.success'))
        } catch (error) {
            const key = isConcurrentTestForbidden(error)
                ? 'schedule.start.error.concurrentForbidden'
                : 'schedule.start.error.failed'
            notifyError(tEntities(key))
        } finally {
            setPending(false)
        }
    }

    if (variant === 'bare') {
        return (
            <Tooltip content={tooltip}>
                {/* span keeps tooltip hover events alive over a disabled button */}
                <span style={{display: 'inline-flex'}}>
                    <IconButton
                        iconProps={{name: 'play', color: isBlocked ? 'default' : 'primary', isSubtle: isBlocked}}
                        size="xs"
                        type="text"
                        loading={pending}
                        disabled={isBlocked}
                        onClick={handleClick}
                    />
                </span>
            </Tooltip>
        )
    }

    const ringProps =
        variant === 'neutral'
            ? {strokeColor: NEUTRAL_STROKE, trailColor: NEUTRAL_TRAIL}
            : {status: variant}

    return (
        <Tooltip content={tooltip}>
            {/* span keeps tooltip hover events alive over a disabled button */}
            <span style={{display: 'inline-flex'}}>
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={pending || isBlocked}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: isBlocked ? 'not-allowed' : pending ? 'wait' : 'pointer',
                        opacity: isBlocked ? 0.5 : 1,
                        display: 'inline-flex',
                        lineHeight: 0,
                    }}
                >
                    <Progress
                        type="circle"
                        percent={100}
                        size={CIRCLE_SIZE}
                        {...ringProps}
                        format={() =>
                            pending ? (
                                <Loading inline size="xs" />
                            ) : (
                                <Icon
                                    name="play"
                                    size={14}
                                    color={isBlocked ? 'default' : 'primary'}
                                    isSubtle={isBlocked}
                                />
                            )
                        }
                    />
                </button>
            </span>
        </Tooltip>
    )
}
