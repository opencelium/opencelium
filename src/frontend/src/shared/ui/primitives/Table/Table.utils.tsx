import type { ReactNode } from 'react';
import type { Cell, RowData } from '@tanstack/react-table';

// A single token (no whitespace) longer than this can't wrap, so it stretches the column —
// and with it the whole table — regardless of table-layout/overflow CSS. Truncating the
// actual string is the only fix that's guaranteed to work independent of table CSS. Text
// that contains a space is left untouched, however long, since it can wrap normally.
const LONG_WORD_LENGTH = 14;

/**
 * Hard-truncates `text` when it contains a word (whitespace-delimited token) longer than
 * `LONG_WORD_LENGTH` — e.g. a slug or filename with no spaces. Safe to call on any string;
 * normal multi-word text is returned unchanged.
 */
export const truncateUnbreakableText = (text: string): string => {
    const hasUnbreakableWord = text.split(/\s+/).some((word) => word.length > LONG_WORD_LENGTH);
    if (!hasUnbreakableWord) return text;
    return text.length > LONG_WORD_LENGTH ? `${text.slice(0, LONG_WORD_LENGTH)}…` : text;
};

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

/**
 * The last column without an explicit `size` in its columnDef stretches to fill
 * whatever width the fixed-size columns (checkbox, expander, row-actions) leave
 * behind, instead of every unsized column competing for space based on raw
 * content width. Returns null when every column has an explicit size.
 */
export const findStretchColumnId = (
    columns: { id: string; columnDef: { size?: number } }[],
): string | null => {
    for (let i = columns.length - 1; i >= 0; i--) {
        if (columns[i].columnDef.size === undefined) return columns[i].id;
    }
    return null;
};

export const truncateCellNode = (node: ReactNode): ReactNode => {
    if (typeof node !== 'string' && typeof node !== 'number') return node;
    const text = String(node);
    const shortened = truncateUnbreakableText(text);
    if (shortened !== text) return <span title={text}>{shortened}</span>;
    return node;
};

/**
 * Render a tanstack cell with truncation applied.
 *
 * `flexRender` always wraps a function-form `cell` in `<Comp {...props}/>`, so
 * the rendered output is a React element — `truncateCellNode` only sees a
 * string when the column def provides one statically. Invoking the cell
 * function directly lets us inspect its actual return value and truncate it
 * when it's a primitive.
 *
 * Cell renderers in this codebase are pure (no hooks), so calling them
 * outside React's render tree is safe. Cells that return JSX pass through
 * unchanged — a custom cell renderer with free-text content (e.g. a name/title
 * column) must call `truncateUnbreakableText` itself, since this can't safely
 * rewrite arbitrary JSX.
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
