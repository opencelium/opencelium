import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature';
import { IconButton } from '@shared/ui/primitives/IconButton';
import '../styles/ai-panel.css';

// The antd Button sets an inline 51px min-width for text buttons; this one is a square like the header's menu button.
const SQUARE = { minWidth: 36 };

type Props = {
	isOpen: boolean;
	isAvailable: boolean;
	/** Opens the "new feature" card without a hover; it has no effect once the user dismissed the feature. */
	isIntroOpen: boolean;
	onToggle: () => void;
};

export function AiHeaderButton({ isOpen, isAvailable, isIntroOpen, onToggle }: Props) {
	const { t } = useI18n('workflow');
	const isDisabled = !isAvailable && !isOpen;
	return (
		// NewFeature owns the tooltip; its wrapper span still receives hovers while the button is disabled.
		<NewFeature id="workflow-ai-assistant" placement="bottom" isIntroOpen={isIntroOpen}
			tooltip={isDisabled ? t('ai.unavailableTooltip') : t('ai.open')}>
			<span className="aiHeaderButtonWrap">
				<IconButton type="text" iconProps={{ name: 'sparkles', color: 'inherit' }} onClick={onToggle}
					disabled={isDisabled} testId="ai-panel-open" style={SQUARE}
					className={`aiHeaderButton ${isOpen ? 'aiHeaderButton--active' : ''}`} />
			</span>
		</NewFeature>
	);
}
