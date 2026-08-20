import React from 'react';
import { message } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useDeleteEntityMutation } from '@shared/api/genericApi';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { i18n } from '@shared/i18n/config/i18n';
import type { DeleteActionProps } from './types';
import { buildDeleteUrl, resolveActionValue } from './resolveAction';

export const DeleteAction: React.FC<DeleteActionProps> = ({ entity, row, rowId, config, testId, iconSize, tooltipPlacement }) => {
    const confirm = useConfirm();
    const { t: tCommon } = useI18n('common');
    const [deleteEntity, { isLoading }] = useDeleteEntityMutation();

    const disabledReason = config.disabledReason?.(row, entity) || null;

    const handleClick = async () => {
        if (!entity.api) return;

        const value = resolveActionValue(row, config.field, rowId);

        const message$ =
            config.confirmMessage?.(value, entity, row) ??
            tCommon('question.confirmation.delete', {
                entityName: entity.name,
                field: config.field ?? '',
                value,
            });

        const url = config.buildDeleteUrl
            ? config.buildDeleteUrl(entity, value, row)
            : buildDeleteUrl(entity, config.field, config.customPath, value);

        const ok = await confirm({
            title: tCommon('list.confirmDelete.title'),
            message: message$,
            onConfirm: async () => {
                await deleteEntity({ url }).unwrap();
                await config.afterDelete?.(value, row);
            },
        });
        if (!ok) return;

        const successT = i18n.getFixedT(i18n.language, 'success');
        message.success(successT('api.deleted'));
    };

    const button = (
        <DeleteIconButton
            iconSize={iconSize}
            loading={isLoading}
            disabled={!!disabledReason}
            onClick={handleClick}
            testId={testId}
        />
    );

    return <Tooltip content={disabledReason ?? tCommon('actions.delete')} placement={tooltipPlacement}>{button}</Tooltip>;
};
