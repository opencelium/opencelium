import React from 'react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { UpdateActionProps } from './types';
import { useEntityUpdateOpener } from './useEntityUpdateOpener';

export const UpdateAction: React.FC<UpdateActionProps> = ({ entity, row, rowId, config, testId, iconSize, tooltipPlacement }) => {
    const openUpdate = useEntityUpdateOpener();
    const { t: tCommon } = useI18n('common');

    return (
        <Tooltip content={tCommon('actions.edit')} placement={tooltipPlacement}>
            <IconButton
                iconProps={{ name: 'edit', color: 'primary', size: iconSize }}
                type={'text'}
                size={'xs'}
                onClick={() => openUpdate(entity, config, row, rowId)}
                testId={testId}
            />
        </Tooltip>
    );
};
