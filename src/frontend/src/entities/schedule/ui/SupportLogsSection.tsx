import type { ReactNode } from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'

type Props = {
    label: string
    isMasked: boolean
    onToggle: () => void
    children: ReactNode
}

export function SupportLogsSection({ label, isMasked, onToggle, children }: Props) {
    const { t: tEntities } = useI18n('entities')

    return (
        <div style={{ marginTop: 16 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                }}
            >
                <Typography variant="label" isBold>
                    {label}
                </Typography>
                <Tooltip
                    content={tEntities(
                        isMasked
                            ? 'schedule.supportLogs.unmask'
                            : 'schedule.supportLogs.mask',
                    )}
                >
                    <IconButton
                        iconProps={{
                            name: isMasked ? 'eye-off' : 'eye',
                            color: 'primary',
                        }}
                        size="xs"
                        type="text"
                        onClick={onToggle}
                    />
                </Tooltip>
            </div>
            {children}
        </div>
    )
}
