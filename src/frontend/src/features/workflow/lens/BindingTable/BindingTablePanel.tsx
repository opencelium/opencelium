import { useMemo, useRef, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Table } from '@shared/ui/primitives/Table';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { fieldGroupKey } from '../groupBindingsByField';
import { useBindingGraph } from '../useBindingLens';
import { BindingTableToolbar } from './BindingTableToolbar';
import { type BindingTableRow, countBroken, getRowBindings } from './bindingTableRows';
import { useBindingTable } from './useBindingTable';
import { useDismissOnOutsideClick } from './useDismissOnOutsideClick';
import type { BindingTablePanelProps } from './BindingTablePanel.types';

/**
 * Every field binding in the workflow as one list — the view the canvas arcs
 * cannot give: complete (including the references no arc can be drawn for),
 * filterable, and sorted so anything broken is already at the top. Deliberately
 * without a backdrop: the canvas stays live behind it, so hovering a method
 * still lights up its bindings while the list is open — the dismissal a
 * backdrop would have given it comes from useDismissOnOutsideClick instead.
 */
export function BindingTablePanel({ open, nodes, edges, fieldBindings, selectedKey,
	isDetailOpen, onClose, onSelectBinding }: BindingTablePanelProps) {
	const { t } = useI18n('workflow');
	const panelRef = useRef<HTMLElement | null>(null);
	const [search, setSearch] = useState('');
	const graph = useBindingGraph({ nodes, edges, fieldBindings, open });
	const { rows, columns, tableInstance, isAllExpanded,
		toggleAllExpanded } = useBindingTable(graph, search);

	useDismissOnOutsideClick({ open, panelRef, onClose });

	const total = graph.bindings.length;
	const fieldCount = useMemo(() => new Set(graph.bindings.map(fieldGroupKey)).size, [graph]);
	const isSelected = (row: BindingTableRow) =>
		getRowBindings(row).some((binding) => binding.key === selectedKey);
	const broken = countBroken(graph.bindings);
	const notShown = graph.skipped.malformed + graph.skipped.outsideScope
		+ graph.skipped.unanchored;

	return (
		<aside
			ref={panelRef}
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
							{t('bindingLens.fieldCount', { count: fieldCount })}
							{` · ${t('bindingLens.referenceCount', { count: total })}`}
							{broken > 0 && ` · ${t('bindingLens.brokenCount', { count: broken })}`}
						</div>
					</div>
				</div>
				<button className='iconButton' type='button' onClick={onClose}
					data-testid='workflow-binding-table-close'>
					<CloseOutlined />
				</button>
			</div>
			<BindingTableToolbar
				search={search}
				onSearchChange={setSearch}
				isAllExpanded={isAllExpanded}
				onToggleAllExpanded={toggleAllExpanded}
			/>
			<div className='drawerBody bindingTableBody'>
				<Table<BindingTableRow>
					data={rows}
					columns={columns}
					tableInstance={tableInstance}
					// Every reference of a field opens the same editor; a field that is
					// already open keeps the reference it was opened on.
					onRowClick={(row) => {
						const bindings = getRowBindings(row);
						onSelectBinding(bindings.find((binding) => binding.key === selectedKey)
							?? bindings[0]);
					}}
					rowClassName={(row) => [
						row.kind === 'source' ? 'bindingTableSourceRow' : '',
						isSelected(row) ? 'bindingTableRowSelected' : '',
					].filter(Boolean).join(' ') || undefined}
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
