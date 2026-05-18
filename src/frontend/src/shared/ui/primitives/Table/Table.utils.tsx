import type { ReactNode } from 'react';
import type { Cell, RowData } from '@tanstack/react-table';

const MAX_CELL_TEXT_LENGTH = 150;

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
