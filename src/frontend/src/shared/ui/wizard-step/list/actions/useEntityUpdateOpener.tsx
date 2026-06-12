import React, {useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDialog} from '@shared/ui/dialog/useDialog';
import {EntityDialogContent} from '@/engine/entity/runtime/genererics/EntityDialogContent';
import type {EntityDefinition, UpdateActionConfig} from '@/engine/entity/EntityDefinition';
import {resolveActionValue} from './resolveAction';

/**
 * Open the entity update flow for a row — a custom navigation URL when the
 * action defines one, otherwise the update dialog. Shared by the row-action
 * button and the clickable-row handler so both behave identically.
 */
export function useEntityUpdateOpener() {
    const dialog = useDialog();
    const navigate = useNavigate();

    return useCallback(
        (entity: EntityDefinition, config: UpdateActionConfig, row: unknown, rowId: string) => {
            const value = resolveActionValue(row, config.field, rowId);

            if (config.buildNavigationUrl) {
                navigate(config.buildNavigationUrl(entity, value, row));
                return;
            }

            const id = dialog.open({
                width: 1000,
                top: 18,
                content: (
                    <EntityDialogContent
                        entityName={entity.name}
                        mode="update"
                        identifier={value}
                        onSuccess={() => dialog.closeById(id)}
                    />
                ),
            });
        },
        [dialog, navigate],
    );
}
