import { useEffect, useMemo, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Icon } from '@shared/ui/primitives/Icon';
import { Input } from '@shared/ui/primitives/Input';
import { Table } from '@shared/ui/primitives/Table';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LensBinding } from '../bindingLens.types';
import { useBindingGraph } from '../useBindingLens';
import { buildBindingTableColumns } from './bindingTableColumns';
import { countBroken, selectBindingTableRows } from './bindingTableRows';
import type { BindingTablePanelProps } from './BindingTablePanel.types';

/**
 * Every field binding in the workflow as one list — the view the canvas arcs
 * cannot give: complete (including the references no arc can be drawn for),
 * filterable, and sorted so anything broken is already at the top. Deliberately
 * without a backdrop: the canvas stays live behind it, so hovering a method
 * still lights up its bindings while the list is open.
 */
export function BindingTablePanel({ open, nodes, edges, fieldBindings, selectedKey,
	isDetailOpen, onClose, onSelectBinding }: BindingTablePanelProps) {
	const { t } = useI18n('workflow');
	const [search, setSearch] = useState('');
	const [brokenOnly, setBrokenOnly] = useState(false);
	const graph = useBindingGraph({ nodes, edges, fieldBindings, open });
	const rows = useMemo(() => selectBindingTableRows(graph, { search, brokenOnly }),
		[brokenOnly, graph, search]);
	const columns = useMemo(() => buildBindingTableColumns(t), [t]);

	const tableInstance = useReactTable({
		data: rows,
		columns,
		enableRowSelection: false,
		getRowId: (binding) => binding.key,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	useEffect(() => {
		if (!open) return;
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [open, onClose]);

	const total = graph.bindings.length;
	const broken = countBroken(graph.bindings);
	const notShown = graph.skipped.malformed + graph.skipped.outsideScope
		+ graph.skipped.unanchored;

	return (
		<aside
			data-testid='workflow-binding-table-panel'
			// Steps aside rather than sitting under the editor drawer: the list is
			// what a binding is picked from, so it has to stay readable while one of
			// its rows is open. The shift matches .bindingDrawer's own width.
			className={[
				'rightDrawer bindingTableDrawer',
				open ? 'rightDrawerOpen' : '',
				isDetailOpen ? 'bindingTableDrawerAside' : '',
			].filter(Boolean).join(' ')}
		>
			<div className='drawerHeader'>
				<div className='drawerHeaderContent'>
					<div>
						<div className='drawerTitle'>{t('bindingLens.legendTitle')}</div>
						<div className='drawerSubTitle'>
							{t('bindingLens.bindingCount', { count: total })}
							{broken > 0 && ` · ${t('bindingLens.brokenCount', { count: broken })}`}
						</div>
					</div>
				</div>
				<button className='iconButton' type='button' onClick={onClose}
					data-testid='workflow-binding-table-close'>
					<CloseOutlined />
				</button>
			</div>
			<div className='bindingTableFilters'>
				<Input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder={t('bindingLens.tableSearch')}
					leftSlot={<Icon name='search' size={14} isSubtle />}
					testId='workflow-binding-table-search'
				/>
				<Checkbox
					checked={brokenOnly}
					onChange={setBrokenOnly}
					label={t('bindingLens.tableBrokenOnly')}
					testId='workflow-binding-table-broken-only'
				/>
			</div>
			<div className='drawerBody bindingTableBody'>
				<Table<LensBinding>
					data={rows}
					columns={columns}
					tableInstance={tableInstance}
					onRowClick={onSelectBinding}
					rowClassName={(binding) =>
						(binding.key === selectedKey ? 'bindingTableRowSelected' : undefined)}
					emptyState={<span>{t(total === 0
						? 'bindingLens.legendEmpty' : 'bindingLens.tableNoMatch')}</span>}
				/>
			</div>
			{notShown > 0 && (
				<div className='bindingTableNote'>
					{t('bindingLens.legendNotShown', { count: notShown })}
				</div>
			)}
		</aside>
	);
}
