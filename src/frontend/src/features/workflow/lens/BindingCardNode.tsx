import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { MouseEvent } from 'react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { MethodColorDot } from '../components/MethodColorDot/MethodColorDot';
import type { LensCardRow, LensNodeModel } from './bindingLens.types';
import { lensRowHandleId } from './lensIds';

const CardRow = ({ row, editHint, ambiguousHint }: {
	row: LensCardRow;
	editHint: string;
	ambiguousHint: (count: number) => string;
}) => {
	const className = [
		'bindingCardRow',
		row.onActivate ? 'bindingCardRowAction' : '',
		row.isBroken ? 'bindingCardRowBroken' : '',
		row.isSelected ? 'bindingCardRowSelected' : '',
	].filter(Boolean).join(' ');
	const testId = `workflow-binding-card-row-${row.role}-${row.path}`;
	const content = <>
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
		{row.bindingKeys.length > 1 && (
			<span className='bindingCardRowCount'>{`×${row.bindingKeys.length}`}</span>
		)}
		{row.counterpartLabel && (
			<span className='bindingCardRowCounterpart'>
				<MethodColorDot color={row.color} size={8} />
				<span className='bindingCardRowCounterpartName'>{row.counterpartLabel}</span>
			</span>
		)}
	</>;

	// A row that cannot open one editor stays a plain row rather than a control
	// that does nothing on click, and says why on hover.
	if (!row.onActivate) {
		return (
			<div className={className} data-testid={testId}
				title={row.bindingKeys.length > 1 ? ambiguousHint(row.bindingKeys.length) : undefined}>
				{content}
			</div>
		);
	}

	// The canvas must not also see this click: the card is a lens element, and the
	// click's whole meaning is the drawer it opens.
	const onClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		row.onActivate?.();
	};

	return (
		<button type='button' className={className} data-testid={testId} title={editHint}
			onClick={onClick} onDoubleClick={(event) => event.stopPropagation()}>
			{content}
		</button>
	);
};

export function BindingCardNode({ data }: NodeProps<LensNodeModel>) {
	const { t } = useI18n('workflow');
	const targets = data.rows.filter((row) => row.role === 'target');
	const sources = data.rows.filter((row) => row.role === 'source');
	const rowProps = {
		editHint: t('bindingLens.rowEditHint'),
		ambiguousHint: (count: number) => t('bindingLens.rowAmbiguous', { count }),
	};

	return (
		<div className='bindingCard nodrag nopan'
			data-testid={`workflow-binding-card-${data.anchorNodeId}`}>
			<div className='bindingCardHeader'>
				<MethodColorDot color={data.color} size={8} />
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
				{targets.map((row) => <CardRow key={`target:${row.path}`} row={row} {...rowProps} />)}
			</>}
			{sources.length > 0 && <>
				<div className='bindingCardGroup'>{t('bindingLens.cardProvides')}</div>
				{sources.map((row) => <CardRow key={`source:${row.path}`} row={row} {...rowProps} />)}
			</>}
		</div>
	);
}
