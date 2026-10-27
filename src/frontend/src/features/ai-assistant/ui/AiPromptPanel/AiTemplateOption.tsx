import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';

type Props = {
	isOn: boolean;
	isDisabled: boolean;
	onChange: (isOn: boolean) => void;
};

/** Build with or without the installation's template scripts as examples, to show what each one contributes. */
export function AiTemplateOption({ isOn, isDisabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className="aiTemplateOption">
			<Checkbox checked={isOn} disabled={isDisabled} onChange={onChange} label={t('ai.templates.label')}
				testId="ai-panel-use-templates" />
			<Tooltip content={t('ai.templates.hint')} maxWidth={280}>
				<span className="aiTemplateOptionHint" aria-label={t('ai.templates.hint')} tabIndex={0}>
					<Icon name="info" size={14} color="inherit" />
				</span>
			</Tooltip>
		</div>
	);
}
