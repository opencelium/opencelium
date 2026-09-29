import type { ColumnDef } from '@tanstack/react-table';
import type { LensBinding, LensInvalidReason } from '../bindingLens.types';
import { BindingTableEndpoint } from './BindingTableEndpoint';

type Translate = (key: string, values?: Record<string, unknown>) => string;

const REASON_KEYS: Record<LensInvalidReason, string> = {
	'out-of-scope': 'bindingLens.reasonOutOfScope',
	'missing-method': 'bindingLens.reasonMissingMethod',
	'missing-variable': 'bindingLens.reasonMissingVariable',
};

/** Columns over `LensBinding` itself — it is already the flat row this table
 *  wants (both endpoints, their labels and paths, script and break state), so
 *  there is no separate row model to keep in step with it.
 *
 *  There is deliberately no status column: a break is stated on the end that is
 *  broken, so every other row would have shown a dash. */
export const buildBindingTableColumns = (t: Translate): ColumnDef<LensBinding, unknown>[] => {
	const unknownLabel = t('bindingLens.unknownMethod');
	return [
		{
			id: 'target',
			accessorFn: (binding) => `${binding.consumer.label ?? ''} ${binding.consumer.path}`,
			header: () => t('bindingLens.tableColumnTarget'),
			meta: { width: '42%' },
			cell: ({ row }) => (
				<BindingTableEndpoint endpoint={row.original.consumer} unknownLabel={unknownLabel} />
			),
		},
		{
			id: 'source',
			accessorFn: (binding) => `${binding.provider.label ?? ''} ${binding.provider.path}`,
			header: () => t('bindingLens.tableColumnSource'),
			meta: { width: '42%' },
			cell: ({ row }) => {
				const reason = row.original.invalidReason;
				return (
					<BindingTableEndpoint
						endpoint={row.original.provider}
						unknownLabel={unknownLabel}
						reason={reason ? t(REASON_KEYS[reason]) : undefined}
					/>
				);
			},
		},
		{
			id: 'kind',
			accessorFn: (binding) => (binding.isScript ? 1 : 0),
			header: () => t('bindingLens.tableColumnKind'),
			meta: { width: '16%' },
			// "Enhancement" is what the body editor calls the thing such a row opens.
			// A reference that only names a field reads as direct either way, whether
			// or not it happens to carry a passthrough enhancement.
			cell: ({ row }) => (
				<span className='bindingTableKind'>
					{t(row.original.isScript
						? 'bindingLens.tableKindEnhancement'
						: 'bindingLens.tableKindDirect')}
				</span>
			),
		},
	];
};
