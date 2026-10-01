import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Input } from '@shared/ui/primitives/Input';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type BindingTableToolbarProps = {
	search: string;
	onSearchChange: (search: string) => void;
	isAllExpanded: boolean;
	onToggleAllExpanded: () => void;
};

export function BindingTableToolbar({ search, onSearchChange, isAllExpanded,
	onToggleAllExpanded }: BindingTableToolbarProps) {
	const { t } = useI18n('workflow');
	return (
		<div className='bindingTableFilters'>
			<div className='bindingTableSearch'>
				<Input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder={t('bindingLens.tableSearch')}
					leftSlot={<Icon name='search' size={14} isSubtle />}
					testId='workflow-binding-table-search'
				/>
			</div>
			<Tooltip content={t(isAllExpanded ? 'bindingLens.tableCollapseAll' : 'bindingLens.tableExpandAll')}>
				<span>
					<IconButton
						iconProps={{ name: isAllExpanded ? 'collapse' : 'expand' }}
						type='text'
						onClick={onToggleAllExpanded}
						testId='workflow-binding-table-toggle-all'
					/>
				</span>
			</Tooltip>
		</div>
	);
}
