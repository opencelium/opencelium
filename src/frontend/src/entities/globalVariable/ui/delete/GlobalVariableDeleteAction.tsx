import React from 'react'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { TooltipPlacement } from '@shared/ui/primitives/Tooltip/Tooltip.types'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableListItem } from '../../model/types'
import { useDeleteGlobalVariable } from './useDeleteGlobalVariable'

type Props = {
    row: GlobalVariableListItem
    iconSize?: number
    tooltipPlacement?: TooltipPlacement
}

export const GlobalVariableDeleteAction: React.FC<Props> = ({ row, iconSize, tooltipPlacement = 'top' }) => {
    const { t } = useI18n('entities')
    const { deleteGlobalVariable, isDeleting } = useDeleteGlobalVariable()
    const canDelete = row.myPermissions.includes('DELETE')

    return (
        <Tooltip content={t(canDelete ? 'global-variable.delete.tooltip' : 'global-variable.delete.noPermission')} placement={tooltipPlacement}>
            <DeleteIconButton
                iconSize={iconSize}
                disabled={!canDelete}
                loading={isDeleting}
                onClick={() => void deleteGlobalVariable({ id: row.id, name: row.name })}
                testId={`global-variable-row-action-delete-${row.id}`}
            />
        </Tooltip>
    )
}
