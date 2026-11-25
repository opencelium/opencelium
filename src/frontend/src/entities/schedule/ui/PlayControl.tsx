import {Progress} from 'antd'
import {IconButton} from '@shared/ui/primitives/IconButton'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Icon} from '@shared/ui/primitives/Icon'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import type {Schedule} from '../model/types'
import {useRunScheduleNow} from './useRunScheduleNow'

export type RingStatus = 'success' | 'exception'
export type PlayVariant = 'bare' | 'neutral' | RingStatus

const NEUTRAL_STROKE = 'var(--color-border-strong)'
const NEUTRAL_TRAIL = 'var(--color-border-subtle)'
const CIRCLE_SIZE = 28

type Props = {
    schedule: Schedule
    variant: PlayVariant
    blockedHint: string | null
}

export function PlayControl({schedule, variant, blockedHint}: Props) {
    const {t: tEntities} = useI18n('entities')
    const {run: handleClick, pending} = useRunScheduleNow(schedule.schedulerId)
    const isBlocked = blockedHint != null
    const tooltip = blockedHint ?? tEntities('schedule.start.tooltip')

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
