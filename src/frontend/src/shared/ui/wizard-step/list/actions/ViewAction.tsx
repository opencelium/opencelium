import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useDialog } from '@shared/ui/dialog/useDialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { EntityDialogContent } from '@/engine/entity/runtime/genererics/EntityDialogContent';
import type { ViewActionProps } from './types';
import { resolveActionValue } from './resolveAction';

export const ViewAction: React.FC<ViewActionProps> = ({ entity, row, rowId, config }) => {
    const dialog = useDialog();
    const navigate = useNavigate();
    const { t: tCommon } = useI18n('common');

    const handleClick = () => {
        const value = resolveActionValue(row, config.field, rowId);

        if (config.buildNavigationUrl) {
            navigate(config.buildNavigationUrl(entity, value, row));
            return;
        }

        const id = dialog.open({
            width: 1000,
            content: (
                <EntityDialogContent
                    entityName={entity.name}
                    mode="view"
                    identifier={value}
                    onSuccess={() => dialog.closeById(id)}
                />
            ),
        });
    };

    return (
        <Tooltip content={tCommon('actions.view')} placement="right">
            <IconButton iconProps={{ name: 'info', color: 'primary' }} type={'text'} size={'xs'} onClick={handleClick} />
        </Tooltip>
    );
};
