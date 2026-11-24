import React from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { TooltipPlacement } from '@shared/ui/primitives/Tooltip/Tooltip.types'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { useCloseOnNavigate } from '@shared/ui/dialog/useCloseOnNavigate'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { GlobalVariableDetailsWizard } from './GlobalVariableDetailsWizard'

const DetailsDialogContent: React.FC<{ id: number; close: () => void }> = ({ id, close }) => {
    useCloseOnNavigate(close)
    return <GlobalVariableDetailsWizard id={id} />
}

type Props = {
    id: number
    iconSize?: number
    tooltipPlacement?: TooltipPlacement
}

export const GlobalVariableDetailsAction: React.FC<Props> = ({ id, iconSize, tooltipPlacement = 'top' }) => {
    const { t } = useI18n('entities')
    const dialog = useDialog()

    const open = () => {
        const dialogId = dialog.open({
            width: 1000,
            top: 18,
            testId: 'global-variable-details-dialog',
            content: <DetailsDialogContent id={id} close={() => dialog.closeById(dialogId)} />,
        })
    }

    return (
        <Tooltip content={t('global-variable.details.tooltip')} placement={tooltipPlacement}>
            <IconButton
                iconProps={{ name: 'info', color: 'primary', size: iconSize }}
                type="text"
                size="xs"
                onClick={open}
                testId={`global-variable-row-action-details-${id}`}
            />
        </Tooltip>
    )
}
