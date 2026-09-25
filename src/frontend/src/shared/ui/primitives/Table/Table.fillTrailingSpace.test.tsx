import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { AntTable } from './Table.ant';
import { findStretchColumnId } from './Table.utils';

type Row = { id: string; name: string };
const data: Row[] = [{ id: '1', name: 'Ada' }];

const baseColumns: ColumnDef<Row>[] = [
	{ accessorKey: 'name', header: () => 'Name' },
];

const actionsColumn = (fill: boolean): ColumnDef<Row> => ({
	id: '__row_actions__',
	header: () => null,
	size: 88,
	enableSorting: false,
	meta: { align: 'center', resizable: false, ...(fill ? { fillTrailingSpace: true } : {}) },
	cell: () => <div style={{ display: 'flex', justifyContent: 'center' }}>A</div>,
});

const Harness = ({ fill }: { fill: boolean }) => {
	const columns = [...baseColumns, actionsColumn(fill)];
	const tableInstance = useReactTable({
		data, columns, enableRowSelection: false, getCoreRowModel: getCoreRowModel(),
	});
	return <AntTable data={data} columns={columns} tableInstance={tableInstance} />;
};

const headerCells = (container: HTMLElement) =>
	[...container.querySelectorAll('thead th')].map((th) => ({
		id: th.getAttribute('data-col-id'),
		align: (th as HTMLElement).style.textAlign || undefined,
	}));

beforeAll(() => {
	// antd's responsive observer needs it, and jsdom has no matchMedia.
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: () => ({
			matches: false, media: '', addListener() {}, removeListener() {},
			addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
		}),
	});
});

describe('findStretchColumnId', () => {
	const col = (id: string, columnDef: Record<string, unknown>) => ({ id, columnDef });

	it('hands the stretch to a volunteering column over the last unsized one', () => {
		expect(findStretchColumnId([
			col('name', {}),
			col('actions', { size: 88, meta: { fillTrailingSpace: true } }),
		])).toBe('actions');
	});

	it('still falls back to the last unsized column when nobody volunteers', () => {
		expect(findStretchColumnId([
			col('name', {}),
			col('actions', { size: 88 }),
		])).toBe('name');
	});

	it('returns null when every column is sized and none volunteers', () => {
		expect(findStretchColumnId([
			col('name', { size: 200 }),
			col('actions', { meta: { width: '10%' } }),
		])).toBeNull();
	});
});

describe('AntTable trailing space', () => {
	it('appends an empty filler column when no column volunteers for the surplus', () => {
		// Without a sink, the frozen widths would be handed back to the browser to
		// spread across every column, so an unnamed column absorbs them instead.
		const { container } = render(<Harness fill={false} />);
		const cells = headerCells(container);
		expect(cells).toHaveLength(3);
		expect(cells[2]?.id).toBeNull();
		expect(cells[1]?.id).toBe('__row_actions__');
	});

	it('drops the filler and lets the volunteering column take the surplus', () => {
		const { container } = render(<Harness fill />);
		const cells = headerCells(container);
		// The actions column is now last: nothing sits between it and the right edge.
		expect(cells).toHaveLength(2);
		expect(cells[1]?.id).toBe('__row_actions__');
		// Still centred within whatever width it ends up with.
		expect(cells[1]?.align).toBe('center');
	});

	it('leaves the sink column unsized so the surplus has somewhere to go', () => {
		const { container } = render(<Harness fill />);
		const actionsCol = container.querySelector('colgroup col:last-child');
		// A width here would pin the column and undo the freeze it exists to hold.
		expect((actionsCol as HTMLElement | null)?.style.width).toBeFalsy();
	});
});
