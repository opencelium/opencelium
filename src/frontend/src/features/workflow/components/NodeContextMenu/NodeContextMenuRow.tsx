import { buildTestId } from '@shared/testing/testId';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature';
import { Icon } from '@shared/ui/primitives/Icon';
import type { NodeMenuAction, NodeMenuActionId, NodeMenuRow } from '../context-menu/contextMenuData';

const testId = (id: string) => buildTestId('workflow-context-menu', id);

type ActionProps = { action: NodeMenuAction; isNested?: boolean; onRun: (id: NodeMenuActionId) => void };

function MenuActionButton({ action, isNested, onRun }: ActionProps) {
	const { t } = useI18n('workflow');
	const label = <span className='contextMenuItemLabel'>{t(action.labelKey)}</span>;
	return (
		<button type='button' className={`contextMenuItem${isNested ? ' contextMenuItemIndented' : ''}`}
			data-testid={testId(action.id)} onClick={() => onRun(action.id)}>
			<Icon name={action.icon} size={16} color='inherit' />
			{action.newFeatureId
				? <NewFeature id={action.newFeatureId} variant='pill' placement='right'>{label}</NewFeature>
				: label}
		</button>
	);
}

type Props = {
	row: NodeMenuRow;
	isExpanded: boolean;
	onToggle: () => void;
	onRun: (id: NodeMenuActionId) => void;
};

export function NodeContextMenuRow({ row, isExpanded, onToggle, onRun }: Props) {
	const { t } = useI18n('workflow');
	switch (row.kind) {
		case 'action':
			return <MenuActionButton action={row.action} onRun={onRun} />;
		case 'inline':
			return (
				<div className='contextMenuInlineRow' data-testid={testId(row.id)}>
					<span className='contextMenuInlineLabel'>
						<Icon name={row.icon} size={16} color='inherit' />
						{t(row.labelKey)}
					</span>
					<span className='contextMenuInlineActions'>
						{row.actions.map((action) => (
							<button key={action.id} type='button' className='contextMenuChip'
								data-testid={testId(action.id)} onClick={() => onRun(action.id)}>
								{t(action.labelKey)}
							</button>
						))}
					</span>
				</div>
			);
		case 'submenu':
			return (
				<>
					<button type='button' className='contextMenuItem' aria-expanded={isExpanded}
						data-testid={testId(row.id)} onClick={onToggle}>
						<Icon name={row.icon} size={16} color='inherit' />
						<span className='contextMenuItemLabel'>{t(row.labelKey)}</span>
						<Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color='inherit' />
					</button>
					{isExpanded && row.actions.map((action) =>
						<MenuActionButton key={action.id} action={action} isNested onRun={onRun} />)}
				</>
			);
		default: {
			const _exhaustive: never = row;
			return _exhaustive;
		}
	}
}
