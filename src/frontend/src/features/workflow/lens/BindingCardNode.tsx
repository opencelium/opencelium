import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LensCardRow, LensNodeModel } from './bindingLens.types';
import { lensRowHandleId } from './lensIds';

const CardRow = ({ row }: { row: LensCardRow }) => (
	<div className={[
		'bindingCardRow',
		row.isBroken ? 'bindingCardRowBroken' : '',
		row.isSelected ? 'bindingCardRowSelected' : '',
	].filter(Boolean).join(' ')}
		data-testid={`workflow-binding-card-row-${row.role}-${row.path}`}>
		{/* Absolutely positioned by xyflow against this row, not the card, so the
		    arc lands on the field it actually binds. */}
		<Handle
			id={lensRowHandleId(row.role, row.path)}
			type={row.role}
			position={row.role === 'source' ? Position.Right : Position.Left}
			className='handleInvisible'
		/>
		<span className='bindingCardRowPath'>{row.path}</span>
		{row.hasScript && <span className='bindingCardRowScript'>ƒx</span>}
		{row.counterpartLabel && (
			<span className='bindingCardRowCounterpart' style={{ color: row.color }}>
				{row.counterpartLabel}
			</span>
		)}
	</div>
);

export function BindingCardNode({ data }: NodeProps<LensNodeModel>) {
	const { t } = useI18n('workflow');
	const targets = data.rows.filter((row) => row.role === 'target');
	const sources = data.rows.filter((row) => row.role === 'source');

	return (
		<div className='bindingCard nodrag nopan'
			data-testid={`workflow-binding-card-${data.anchorNodeId}`}>
			<div className='bindingCardHeader'>
				<span className='bindingCardDot' style={{ background: data.color }} />
				<span className='bindingCardTitle'>{data.label}</span>
				<Tooltip content={t('bindingLens.collapseCard')}>
					<IconButton
						iconProps={{ name: 'collapse', size: 13 }}
						type='text'
						size='xs'
						onClick={data.onCollapse}
						testId={`workflow-binding-card-collapse-${data.anchorNodeId}`}
					/>
				</Tooltip>
			</div>
			{data.rows.length === 0 && (
				<div className='bindingCardEmpty'>{t('bindingLens.cardEmpty')}</div>
			)}
			{targets.length > 0 && <>
				<div className='bindingCardGroup'>{t('bindingLens.cardReceives')}</div>
				{targets.map((row) => <CardRow key={`target:${row.path}`} row={row} />)}
			</>}
			{sources.length > 0 && <>
				<div className='bindingCardGroup'>{t('bindingLens.cardProvides')}</div>
				{sources.map((row) => <CardRow key={`source:${row.path}`} row={row} />)}
			</>}
		</div>
	);
}
