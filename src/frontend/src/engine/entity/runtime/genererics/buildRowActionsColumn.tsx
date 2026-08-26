import React from 'react';
import { Popover } from 'antd';
import type { ColumnDef } from '@tanstack/react-table';
import type { EntityDefinition, ListAction } from '@/engine/entity/EntityDefinition';
import type { TooltipPlacement } from '@shared/ui/primitives/Tooltip/Tooltip.types';
import { getValueByPath } from '@shared/utils/getValueByPath';
import { buildTestId } from '@shared/testing/testId';
import { IconButton } from '@shared/ui/primitives/IconButton';
import {
    ViewAction,
    UpdateAction,
    DeleteAction,
} from '@shared/ui/wizard-step/list/actions';

// Rough per-button footprint (icon button + gap) used to size the column so
// all actions fit in a row without wrapping.
const ACTION_BUTTON_WIDTH = 36;
// Column width for the collapsed 'menu' display — just the "more" trigger.
const MENU_TRIGGER_WIDTH = 48;
// Icon size used by the 'inline' display, matched to the workflow execution-logs
// panel's maximize icon. The 'menu' display leaves iconSize undefined instead, so
// its actions fall back to IconButton's original size-tier default — unchanged
// from before the inline row existed.
const INLINE_ACTION_ICON_SIZE = 15;
// The 'inline' row's tooltips point up; the 'menu' display stacks actions
// vertically inside a popover, so its tooltips point right instead (away from
// the popover) rather than overlapping the action above/below.
const INLINE_TOOLTIP_PLACEMENT: TooltipPlacement = 'top';
const MENU_TOOLTIP_PLACEMENT: TooltipPlacement = 'right';

const renderAction = (
    action: ListAction,
    index: number,
    entity: EntityDefinition,
    row: unknown,
    rowId: string,
    iconSize: number | undefined,
    tooltipPlacement: TooltipPlacement | undefined,
): React.ReactNode => {
    const testId = buildTestId(entity.name, 'row-action', action.type, rowId);
    switch (action.type) {
        case 'view':
            return <ViewAction key={`view-${index}`} entity={entity} row={row} rowId={rowId} config={action} testId={testId} iconSize={iconSize} tooltipPlacement={tooltipPlacement} />;
        case 'update':
            return <UpdateAction key={`update-${index}`} entity={entity} row={row} rowId={rowId} config={action} testId={testId} iconSize={iconSize} tooltipPlacement={tooltipPlacement} />;
        case 'delete':
            return <DeleteAction key={`delete-${index}`} entity={entity} row={row} rowId={rowId} config={action} testId={testId} iconSize={iconSize} tooltipPlacement={tooltipPlacement} />;
        case 'custom':
            return (
                <React.Fragment key={`custom-${action.key}`}>
                    {action.render({
                        entity,
                        row,
                        rowId,
                        iconSize,
                        tooltipPlacement,
                        // Keyed by `action.key`, not the shared 'custom' type — a row
                        // with two custom actions must not hand both the same selector.
                        testId: buildTestId(entity.name, 'row-action', action.key, rowId),
                    })}
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
    const display = entity.list?.rowActionsDisplay ?? 'inline';

    return {
        id: '__row_actions__',
        header: () => null,
        size: display === 'menu' ? MENU_TRIGGER_WIDTH : actions.length * ACTION_BUTTON_WIDTH + 16,
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { align: 'center', resizable: false },
        cell: ({ row }) => {
            // Sub-rows (depth > 0) are decorative children — they carry no actions.
            if (row.depth > 0) return null;
            const original = row.original;
            const rowId = String(getValueByPath(original as Record<string, unknown>, rowKey) ?? '');
            const iconSize = display === 'menu' ? undefined : INLINE_ACTION_ICON_SIZE;
            const tooltipPlacement = display === 'menu' ? MENU_TOOLTIP_PLACEMENT : INLINE_TOOLTIP_PLACEMENT;
            const rendered = actions.map((action, index) => renderAction(action, index, entity, original, rowId, iconSize, tooltipPlacement));

            if (display === 'menu') {
                return (
                    <div data-row-click-ignore data-testid={buildTestId(entity.name, 'row', rowId)} style={{ display: 'flex', justifyContent: 'center' }}>
                        <Popover
                            trigger={['hover']}
                            placement="leftTop"
                            arrow={false}
                            overlayInnerStyle={{ padding: 4 }}
                            content={
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {rendered}
                                </div>
                            }
                        >
                            <IconButton iconProps={{ name: 'more' }} type="text" size="xs" testId={buildTestId(entity.name, 'row-actions-trigger', rowId)} />
                        </Popover>
                    </div>
                );
            }

            return (
                <div
                    data-row-click-ignore
                    data-testid={buildTestId(entity.name, 'row', rowId)}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}
                >
                    {rendered}
                </div>
            );
        },
    };
}
