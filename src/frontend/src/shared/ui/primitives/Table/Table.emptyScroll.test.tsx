import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { AntTable } from './Table.ant';
import { tableDefaultColumn } from './Table.utils';

type Version = { name: string; status: string };

// The update assistant's versions table: one fixed column plus three sharing what is
// left. The percentages only add up under the fixed layout an empty table never gets.
const columns: ColumnDef<Version>[] = [
	{ id: 'select', header: () => null, size: 48, cell: () => null },
	{ accessorKey: 'name', header: () => 'Version', meta: { width: 'calc((100% - 48px) / 3)' } },
	{ accessorKey: 'status', header: () => 'Status', meta: { width: 'calc((100% - 48px) / 3)' } },
	{ id: 'changelog', header: () => 'Changelog', meta: { width: 'calc((100% - 48px) / 3)' }, cell: () => null },
];

const Harness = ({ data }: { data: Version[] }) => {
	const tableInstance = useReactTable({
		data, columns, defaultColumn: tableDefaultColumn,
		enableRowSelection: false, getCoreRowModel: getCoreRowModel(),
	});
	return <AntTable data={data} columns={columns} tableInstance={tableInstance} emptyState={<span>No versions available</span>} />;
};

const scrollContainer = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('div[style*="overflow-x"]');

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

describe('AntTable horizontal scroll', () => {
	it('offers no horizontal scrollbar while there are no rows', () => {
		const { container } = render(<Harness data={[]} />);
		expect(scrollContainer(container)?.style.overflowX).toBe('hidden');
	});

	it('restores it once rows arrive', () => {
		const { container } = render(<Harness data={[{ name: '5.2.0', status: 'available' }]} />);
		expect(scrollContainer(container)?.style.overflowX).toBe('auto');
	});
});
