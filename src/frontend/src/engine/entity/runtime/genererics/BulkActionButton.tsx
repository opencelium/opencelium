import React, { useState } from 'react';
import { Button } from '@shared/ui/primitives/Button';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { BulkAction, EntityDefinition } from '@/engine/entity/EntityDefinition';

type Props = {
    action: BulkAction;
    entity: EntityDefinition;
    rows: unknown[];
    ids: string[];
    clearSelection: () => void;
};

export const BulkActionButton: React.FC<Props> = ({
    action,
    entity,
    rows,
    ids,
    clearSelection,
}) => {
    const confirm = useConfirm();
    const { t: tEntities } = useI18n('entities');
    const [isRunning, setIsRunning] = useState(false);

    const label = action.labelKey ? tEntities(action.labelKey) : (action.label ?? action.key);
    const min = action.minSelected ?? 1;
    const belowMin = ids.length < min;
    const exceedsMax =
        typeof action.maxSelected === 'number' && ids.length > action.maxSelected;
    const isDisabled = belowMin || exceedsMax;

    const handleClick = async () => {
        if (action.confirm) {
            const ok = await confirm({
                title: tEntities(action.confirm.titleKey),
                message: tEntities(action.confirm.messageKey),
            });
            if (!ok) return;
        }

        setIsRunning(true);
        try {
            await action.run({ rows, ids, entity, clearSelection });
        } catch (err) {
            console.error(err);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Button
            type={action.buttonType ?? 'default'}
            loading={isRunning}
            disabled={isDisabled}
            onClick={handleClick}
        >
            {label}
        </Button>
    );
};
