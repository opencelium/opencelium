import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type BindingLensToggleProps = {
	open: boolean;
	onToggle: () => void;
};

export function BindingLensToggle({ open, onToggle }: BindingLensToggleProps) {
	const { t } = useI18n('workflow');

	return (
		<div className='bindingLensToggle'>
			<Tooltip content={t(open ? 'bindingLens.hide' : 'bindingLens.show')}>
				<IconButton
					iconProps={{ name: 'bindings', color: open ? 'primary' : 'default' }}
					type={open ? 'primary' : 'text'}
					onClick={onToggle}
					testId='workflow-binding-lens-toggle'
				/>
			</Tooltip>
		</div>
	);
}
