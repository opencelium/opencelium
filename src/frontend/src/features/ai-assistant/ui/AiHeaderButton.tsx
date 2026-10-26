import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import '../styles/ai-panel.css';

// The antd Button sets an inline 51px min-width for text buttons; this one is a square like the header's menu button.
const SQUARE = { minWidth: 36 };

type Props = {
	isOpen: boolean;
	isAvailable: boolean;
	onToggle: () => void;
};

export function AiHeaderButton({ isOpen, isAvailable, onToggle }: Props) {
	const { t } = useI18n('workflow');
	const isDisabled = !isAvailable && !isOpen;
	return (
		<Tooltip content={isDisabled ? t('ai.unavailableTooltip') : t('ai.open')} placement="bottom" maxWidth={280}>
			{/* A disabled button fires no pointer events; the wrapper keeps the tooltip explaining why. */}
			<span className="aiHeaderButtonWrap">
				<IconButton type="text" iconProps={{ name: 'sparkles', color: 'inherit' }} onClick={onToggle}
					disabled={isDisabled} testId="ai-panel-open" style={SQUARE}
					className={`aiHeaderButton ${isOpen ? 'aiHeaderButton--active' : ''}`} />
			</span>
		</Tooltip>
	);
}
