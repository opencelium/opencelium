import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { AiApplyBlock, AiPanelView } from '../../model/aiPanelState';

type Props = {
	view: AiPanelView;
	canPlan: boolean;
	canBuild: boolean;
	applyBlock: AiApplyBlock;
	onPlan: () => void;
	onBuild: () => void;
	onCancel: () => void;
	onDiscard: () => void;
	onApply: () => void;
};

const APPLY_BLOCK_KEY = { errors: 'ai.apply.blockedByErrors', locked: 'ai.apply.blockedByTestRun' } as const;

export function AiPanelFooter({ view, canPlan, canBuild, applyBlock, onPlan, onBuild, onCancel, onDiscard, onApply }: Props) {
	const { t } = useI18n('workflow');
	const discard = <Button type="text" onClick={onDiscard} testId="ai-panel-discard">{t('ai.actions.discard')}</Button>;

	switch (view) {
		case 'planning':
		case 'building':
			return (
				<div className="aiPanelFooter">
					<Button onClick={onCancel} testId="ai-panel-cancel">{t('ai.actions.cancel')}</Button>
					<Button type="primary" loading disabled testId="ai-panel-busy">
						{t(view === 'planning' ? 'ai.actions.planning' : 'ai.actions.building')}
					</Button>
				</div>
			);
		case 'plan':
			return (
				<div className="aiPanelFooter aiPanelFooter--split">
					{discard}
					<Button type="primary" iconLeft="sparkles" onClick={onBuild} disabled={!canBuild} testId="ai-panel-build">
						{t('ai.actions.buildWorkflow')}
					</Button>
				</div>
			);
		case 'result':
			return (
				<div className="aiPanelFooter aiPanelFooter--split">
					{discard}
					<div className="aiPanelFooterGroup">
						<Button iconLeft="refresh" onClick={onBuild} testId="ai-panel-regenerate">{t('ai.actions.regenerate')}</Button>
						{/* A tooltip with no content stays mounted, so the button does not remount when the block clears. */}
						<Tooltip content={applyBlock ? t(APPLY_BLOCK_KEY[applyBlock]) : null} maxWidth={260}>
							<span className="aiApplyWrap">
								<Button type="primary" onClick={onApply} disabled={applyBlock !== null} testId="ai-panel-apply">
									{t('ai.actions.apply')}
								</Button>
							</span>
						</Tooltip>
					</div>
				</div>
			);
		case 'prompt':
		case 'unavailable':
			return (
				<div className="aiPanelFooter">
					<Button type="primary" iconLeft="sparkles" onClick={onPlan}
						disabled={view === 'unavailable' || !canPlan} testId="ai-panel-generate">
						{t('ai.actions.createPlan')}
					</Button>
				</div>
			);
		default: {
			const _exhaustive: never = view;
			return _exhaustive;
		}
	}
}
