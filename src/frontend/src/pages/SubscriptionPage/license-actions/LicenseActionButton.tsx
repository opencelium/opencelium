import React from 'react'
import { Button } from '@shared/ui/primitives/Button'
import type { ButtonProps } from '@shared/ui/primitives/Button/Button.types'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'

type Props = Pick<ButtonProps, 'type' | 'loading' | 'disabled' | 'onClick' | 'testId'> & {
    icon: IconName
    label: string
    isIconOnly: boolean
    /** Why the action is unavailable; replaces the label as the tooltip while set. */
    blockedReason?: string
}

/** A license action that falls back to its icon alone on narrow windows, with the label moved into the tooltip. */
export const LicenseActionButton: React.FC<Props> = ({ icon, label, isIconOnly, blockedReason, ...buttonProps }) => {
    if (isIconOnly) {
        return (
            <Tooltip content={blockedReason || label}>
                <IconButton {...buttonProps} iconProps={{ name: icon, size: 16, color: 'inherit' }} />
            </Tooltip>
        )
    }

    const button = (
        <Button {...buttonProps} iconLeft={icon}>
            {label}
        </Button>
    )
    return blockedReason ? <Tooltip content={blockedReason}>{button}</Tooltip> : button
}
