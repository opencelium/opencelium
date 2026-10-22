import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';

export function PlaygroundHeader() {
	const { t } = useI18n('workflow');
	return (
		<div className="scriptPlaygroundInputHeader">
			<strong className="scriptPlaygroundTitle">
				<Icon name="flask" size={17} color="inherit" />
				{t('sandbox.title')}
				<small>{t('sandbox.simulation')}</small>
			</strong>
		</div>
	);
}
