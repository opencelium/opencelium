import React from 'react';
import { Popover } from 'antd';
import type { ColumnDef } from '@tanstack/react-table';
import type { EntityDefinition, ListAction } from '@/engine/entity/EntityDefinition';
import { getValueByPath } from '@shared/utils/getValueByPath';
import { IconButton } from '@shared/ui/primitives/IconButton';
import {
    ViewAction,
    UpdateAction,
    DeleteAction,
} from '@shared/ui/wizard-step/list/actions';

const renderAction = (
    action: ListAction,
    index: number,
    entity: EntityDefinition,
    row: unknown,
    rowId: string,
): React.ReactNode => {
    switch (action.type) {
        case 'view':
            return <ViewAction key={`view-${index}`} entity={entity} row={row} rowId={rowId} config={action} />;
        case 'update':
            return <UpdateAction key={`update-${index}`} entity={entity} row={row} rowId={rowId} config={action} />;
        case 'delete':
            return <DeleteAction key={`delete-${index}`} entity={entity} row={row} rowId={rowId} config={action} />;
        case 'custom':
            return (
                <React.Fragment key={`custom-${action.key}`}>
                    {action.render({ entity, row, rowId })}
                </React.Fragment>
            );
        default: {
            const _exhaustive: never = action;
            return _exhaustive;
        }
    }
};

export function buildRowActionsColumn<T extends Record<string, unknown>>(
    entity: EntityDefinition,
    actions: ListAction[],
): ColumnDef<T> {
    const rowKey = entity.list?.rowKey ?? entity.api?.primaryKey ?? 'id';

    return {
        id: '__row_actions__',
        header: () => null,
        size: 48,
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { align: 'center' },
        cell: ({ row }) => {
            const original = row.original;
            const rowId = String(getValueByPath(original as Record<string, unknown>, rowKey) ?? '');
            return (
                <div data-row-click-ignore style={{ display: 'flex', justifyContent: 'center' }}>
                    <Popover
                        trigger={['hover', 'click']}
                        placement="leftTop"
                        arrow={false}
                        overlayInnerStyle={{ padding: 4 }}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {actions.map((action, index) => renderAction(action, index, entity, original, rowId))}
                            </div>
                        }
                    >
                        <IconButton iconProps={{ name: 'more' }} type="text" size="xs" />
                    </Popover>
                </div>
            );
        },
    };
}
