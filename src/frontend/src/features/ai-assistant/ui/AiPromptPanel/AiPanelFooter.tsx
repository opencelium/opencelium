import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import type { AiPanelView } from '../../model/aiPanelState';

type Props = {
	view: AiPanelView;
	canGenerate: boolean;
	onGenerate: () => void;
	onCancel: () => void;
	onDiscard: () => void;
	onApply?: () => void;
};

export function AiPanelFooter({ view, canGenerate, onGenerate, onCancel, onDiscard, onApply }: Props) {
	const { t } = useI18n('workflow');

	if (view === 'result') {
		return (
			<div className="aiPanelFooter aiPanelFooter--split">
				<Button type="text" onClick={onDiscard} testId="ai-panel-discard">{t('ai.actions.discard')}</Button>
				<div className="aiPanelFooterGroup">
					<Button iconLeft="refresh" onClick={onGenerate} testId="ai-panel-regenerate">
						{t('ai.actions.regenerate')}
					</Button>
					{onApply && (
						<Button type="primary" onClick={onApply} testId="ai-panel-apply">{t('ai.actions.apply')}</Button>
					)}
				</div>
			</div>
		);
	}

	if (view === 'generating') {
		return (
			<div className="aiPanelFooter">
				<Button onClick={onCancel} testId="ai-panel-cancel">{t('ai.actions.cancel')}</Button>
				<Button type="primary" loading disabled testId="ai-panel-generate">{t('ai.actions.generating')}</Button>
			</div>
		);
	}

	return (
		<div className="aiPanelFooter">
			<Button type="primary" iconLeft="sparkles" onClick={onGenerate}
				disabled={view === 'unavailable' || !canGenerate} testId="ai-panel-generate">
				{t('ai.actions.generate')}
			</Button>
		</div>
	);
}
