import type { ColumnDef } from '@tanstack/react-table';
import type { LensBinding, LensInvalidReason } from '../bindingLens.types';
import { BindingTableEndpoint } from './BindingTableEndpoint';
import { BindingTableExpander } from './BindingTableExpander';
import { type BindingTableRow, getRowBindings } from './bindingTableRows';

type Translate = (key: string, values?: Record<string, unknown>) => string;

export const REASON_KEYS: Record<LensInvalidReason, string> = {
	'out-of-scope': 'bindingLens.reasonOutOfScope',
	'missing-method': 'bindingLens.reasonMissingMethod',
	'missing-variable': 'bindingLens.reasonMissingVariable',
};

const describeSources = (bindings: LensBinding[]) => bindings
	.map((binding) => `${binding.provider.label ?? ''} ${binding.provider.path}`).join(' ');

/** One row per filled field, summarising its sources; each source is a sub-row
 *  under it.
 *
 *  There is deliberately no status column: a break is stated on the source that
 *  is broken, so every other row would have shown a dash. */
export const buildBindingTableColumns = (t: Translate): ColumnDef<BindingTableRow, unknown>[] => {
	const unknownLabel = t('bindingLens.unknownMethod');
	const renderSource = (binding: LensBinding) => (
		<BindingTableEndpoint
			endpoint={binding.provider}
			unknownLabel={unknownLabel}
			reason={binding.invalidReason ? t(REASON_KEYS[binding.invalidReason]) : undefined}
		/>
	);
	const renderSummary = (bindings: LensBinding[]) => {
		const broken = bindings.filter((binding) => !!binding.invalidReason).length;
		return (
			<span className='bindingTableSummary'>
				{t('bindingLens.sourceCount', { count: bindings.length })}
				{broken > 0 && (
					<span className='bindingTableReason'>
						{` · ${t('bindingLens.brokenCount', { count: broken })}`}
					</span>
				)}
			</span>
		);
	};

	return [
		{
			id: 'target',
			accessorFn: (row) => (row.kind === 'field'
				? `${row.group.consumer.label ?? ''} ${row.group.consumer.path}` : ''),
			header: () => t('bindingLens.tableColumnTarget'),
			meta: { width: '50%' },
			cell: ({ row }) => {
				const data = row.original;
				if (data.kind === 'source') return null;
				return (
					<div className='bindingTableTarget'>
						<BindingTableExpander
							isExpanded={row.getIsExpanded()}
							onToggle={row.getToggleExpandedHandler()}
							testId={`workflow-binding-table-expand-${row.id}`}
						/>
						<BindingTableEndpoint endpoint={data.group.consumer} unknownLabel={unknownLabel} />
					</div>
				);
			},
		},
		{
			id: 'source',
			accessorFn: (row) => describeSources(getRowBindings(row)),
			header: () => t('bindingLens.tableColumnSource'),
			meta: { width: '50%' },
			cell: ({ row }) => {
				const data = row.original;
				return data.kind === 'source'
					? renderSource(data.binding)
					: renderSummary(data.group.bindings);
			},
		},
	];
};
