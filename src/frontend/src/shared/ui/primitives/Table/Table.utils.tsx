import type { ReactNode } from 'react';
import type { Cell, RowData } from '@tanstack/react-table';

const MAX_CELL_TEXT_LENGTH = 150;

/**
 * True when a row click originated from an interactive element (action buttons,
 * checkboxes, links, inputs) or a cell explicitly opted out with
 * `data-row-click-ignore`. Lets a row-level `onRowClick` coexist with in-row
 * controls without hijacking their clicks.
 */
export const isRowClickIgnored = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    return !!el?.closest?.('button, a, input, select, textarea, label, [data-row-click-ignore]');
};

export const truncateCellNode = (node: ReactNode): ReactNode => {
    if (typeof node !== 'string' && typeof node !== 'number') return node;
    const text = String(node);
    if (text.length <= MAX_CELL_TEXT_LENGTH) return node;
    return <span title={text}>{text.slice(0, MAX_CELL_TEXT_LENGTH) + '…'}</span>;
};

/**
 * Render a tanstack cell with the 150-char truncation applied.
 *
 * `flexRender` always wraps a function-form `cell` in `<Comp {...props}/>`, so
 * the rendered output is a React element — `truncateCellNode` only sees a
 * string when the column def provides one statically. Invoking the cell
 * function directly lets us inspect its actual return value and truncate it
 * when it's a primitive.
 *
 * Cell renderers in this codebase are pure (no hooks), so calling them
 * outside React's render tree is safe. Cells that return JSX pass through
 * unchanged.
 */
export const renderTruncatedCell = <TData extends RowData>(
    cell: Cell<TData, unknown> | undefined,
): ReactNode => {
    if (!cell) return null;
    const cellDef = cell.column.columnDef.cell;
    const rendered =
        typeof cellDef === 'function'
            ? (cellDef as (ctx: ReturnType<typeof cell.getContext>) => ReactNode)(cell.getContext())
            : (cellDef as ReactNode);
    return truncateCellNode(rendered);
};
