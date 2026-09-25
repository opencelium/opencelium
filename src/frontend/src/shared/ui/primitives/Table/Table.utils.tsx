import type { ReactNode } from 'react';
import type { Cell, RowData } from '@tanstack/react-table';
import type { TableColumnMeta } from './Table.types';

/**
 * Tanstack's `ColumnSizing` feature unconditionally merges a `size: 150`
 * default into every column's resolved `columnDef` (see
 * `defaultColumnSizing` in `@tanstack/table-core`), so `column.columnDef.size`
 * is never actually `undefined` unless a table instance opts out. That
 * defeats the `size === undefined` sentinel `findStretchColumnId` and the
 * Ant/Material adapters rely on to tell "no explicit width" apart from "sized
 * to 150" — the last-column stretch never triggers and percentage
 * `meta.width` columns are always shadowed by the phantom 150. Spread this
 * into every `useReactTable({ defaultColumn: ... })` call that feeds the
 * shared `Table` primitive to keep unset sizes genuinely `undefined`.
 */
export const tableDefaultColumn = { size: undefined } as const;

// A single token (no whitespace) longer than this can't wrap, so it stretches the column —
// and with it the whole table — regardless of table-layout/overflow CSS. Truncating the
// actual string is the only fix that's guaranteed to work independent of table CSS.
const MAX_WORD_LENGTH = 50;
// Cap on the whole cell, wrappable or not: a description field allows thousands of
// characters, and one such row would otherwise be as tall as the viewport.
const MAX_TEXT_LENGTH = 150;

/**
 * Shortens `text` to what a table cell can carry: every over-long token is cut to
 * `MAX_WORD_LENGTH` where it sits (so the readable words around it survive), then the
 * result is capped at `MAX_TEXT_LENGTH`. Safe to call on any string; text within both
 * limits is returned unchanged, which is how callers detect that nothing was cut and
 * skip the "full value" tooltip.
 */
export const truncateCellText = (text: string): string => {
    const wordsCut = text.replace(/\S+/g, (word) =>
        word.length > MAX_WORD_LENGTH ? `${word.slice(0, MAX_WORD_LENGTH)}…` : word,
    );
    return wordsCut.length > MAX_TEXT_LENGTH
        ? `${wordsCut.slice(0, MAX_TEXT_LENGTH)}…`
        : wordsCut;
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
 * The column that fills whatever width the sized ones (checkbox, expander,
 * row-actions) leave behind, instead of every unsized column competing for space
 * based on raw content width.
 *
 * A column that sets `meta.fillTrailingSpace` claims the job outright, size and
 * all — that is how a trailing row-actions column ends up flush against the
 * right edge rather than parked just after the last data column. Otherwise it is
 * the last column with no explicit size (tanstack's numeric `columnDef.size` or
 * a percentage `meta.width`), and null when every column has one.
 */
export const findStretchColumnId = (
    columns: { id: string; columnDef: { size?: number; meta?: TableColumnMeta } }[],
): string | null => {
    for (let i = columns.length - 1; i >= 0; i--) {
        if (columns[i].columnDef.meta?.fillTrailingSpace) return columns[i].id;
    }
    for (let i = columns.length - 1; i >= 0; i--) {
        const { size, meta } = columns[i].columnDef;
        if (size === undefined && meta?.width === undefined) return columns[i].id;
    }
    return null;
};

export const truncateCellNode = (node: ReactNode): ReactNode => {
    if (typeof node !== 'string' && typeof node !== 'number') return node;
    const text = String(node);
    const shortened = truncateCellText(text);
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
 * column) must call `truncateCellText` itself (or render <TruncatedTextCell/>), since this can't safely
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
