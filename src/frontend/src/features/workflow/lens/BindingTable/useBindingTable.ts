import { useMemo, useState } from 'react';
import {
	type ExpandedState,
	getCoreRowModel,
	getExpandedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LensBindingGraph } from '../bindingLens.types';
import { buildBindingTableColumns } from './bindingTableColumns';
import {
	getBindingTableRowId,
	getSourceRows,
	selectBindingTableRows,
	toFieldRows,
} from './bindingTableRows';

export function useBindingTable(graph: LensBindingGraph, search: string) {
	const { t } = useI18n('workflow');
	// `true` is tanstack's "every row expanded", including rows that appear later
	// (a new binding, a cleared search) — so the table opens fully.
	const [expanded, setExpanded] = useState<ExpandedState>(true);
	const rows = useMemo(() => toFieldRows(selectBindingTableRows(graph, { search })),
		[graph, search]);
	const columns = useMemo(() => buildBindingTableColumns(t), [t]);

	const tableInstance = useReactTable({
		data: rows,
		columns,
		enableRowSelection: false,
		getRowId: getBindingTableRowId,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSubRows: getSourceRows,
		getExpandedRowModel: getExpandedRowModel(),
		// A field's sources stay on its page and don't count toward the page size.
		paginateExpandedRows: false,
		state: { expanded },
		onExpandedChange: setExpanded,
	});

	const isAllExpanded = expanded === true || tableInstance.getIsAllRowsExpanded();
	const toggleAllExpanded = () => setExpanded(isAllExpanded ? {} : true);

	return { rows, columns, tableInstance, isAllExpanded, toggleAllExpanded };
}
