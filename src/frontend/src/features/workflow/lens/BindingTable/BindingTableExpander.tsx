import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type BindingTableExpanderProps = {
	isExpanded: boolean;
	onToggle: () => void;
	testId: string;
};

export function BindingTableExpander({ isExpanded, onToggle, testId }: BindingTableExpanderProps) {
	const { t } = useI18n('workflow');
	return (
		// Toggling a row must not also open its binding in the drawer.
		<span className='bindingTableExpander' data-row-click-ignore>
			<Tooltip content={t(isExpanded ? 'bindingLens.tableCollapseRow' : 'bindingLens.tableExpandRow')}>
				<span>
					<IconButton
						iconProps={{ name: isExpanded ? 'chevron-down' : 'chevron-right' }}
						size='xs'
						type='text'
						onClick={onToggle}
						testId={testId}
					/>
				</span>
			</Tooltip>
		</span>
	);
}
