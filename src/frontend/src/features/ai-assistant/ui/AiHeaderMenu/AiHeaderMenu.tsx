import { useCallback, useState } from 'react';
import { useIsAiFeatureOn } from '../../api/useIsAiFeatureOn';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { WorkflowMenuItem } from '@features/workflow/components/header/WorkflowMenuItem/WorkflowMenuItem';
import { useWorkflowTutorialStore } from '@features/onboarding/workflow-tutorial/model/workflowTutorial.store';
import { WAKE_WORD } from '../../voice/wakeWord';
import { useWakeWordToggle } from '../../voice/useWakeWordToggle';
import { type AiWorkflowExplainParams, useAiWorkflowExplain } from '../AiWorkflowExplain/useAiWorkflowExplain';
import { useMenuDismiss } from './useMenuDismiss';
import { AiSettingsDialog } from '../../settings/AiSettingsDialog';
import '../../styles/ai-panel.css';
import '../WakeWordToggle/wakeWordToggle.css';

// The antd Button sets an inline 51px min-width for text buttons; this one is a square like the header's menu button.
const SQUARE = { minWidth: 36 };

type Props = {
	/** "Generate with AI": the side panel's state. */
	generate: { isOpen: boolean; isAvailable: boolean; isIntroOpen: boolean; onToggle: () => void };
	/** Explaining the workflow; left out where the workflow cannot be changed. */
	explain?: AiWorkflowExplainParams;
	/** Generating changes the workflow: hidden while it cannot be changed. */
	canEdit: boolean;
};

/**
 * The editor header's one AI button: Generate with AI, Explain this workflow, Beebot and the AI settings in a menu. While Beebot is on,
 * the button is its glyph, so listening and working stay visible with the menu closed; the bee also flies from here.
 */
export function AiHeaderMenu({ generate, explain, canEdit }: Props) {
	const { t } = useI18n('workflow');
	const [isMenuOpen, setMenuOpen] = useState(false);
	const close = useCallback(() => setMenuOpen(false), []);
	const ref = useMenuDismiss(isMenuOpen, close);
	const beebot = useWakeWordToggle();
	const [isSettingsOpen, setSettingsOpen] = useState(false);
	// The tutorial owns the page while it runs: no second card next to its steps.
	const isTutorialRunning = useWorkflowTutorialStore((state) => state.requested);
	const explaining = useAiWorkflowExplain(explain ?? { nodes: [], edges: [], title: '', onUseDescription: () => {} });
	const isGenerateDisabled = !generate.isAvailable && !generate.isOpen;
	const isGenerateOn = useIsAiFeatureOn('generate-workflow');
	const choose = (action: () => void) => () => {
		close();
		action();
	};

	const trigger = (
		<span className={`aiHeaderButtonWrap ${beebot.isOn ? 'wakeWordToggle' : ''}`} data-beebot-home
			data-state={beebot.isOn ? beebot.state : undefined} data-away={beebot.isAway || undefined}
			style={beebot.isOn ? beebot.style : undefined}>
			<IconButton type="text" style={SQUARE} testId="workflow-ai-menu" onClick={() => setMenuOpen((open) => !open)}
				className={`aiHeaderButton ${generate.isOpen || isMenuOpen ? 'aiHeaderButton--active' : ''}`}
				iconProps={beebot.isOn ? { name: 'beebot', state: beebot.state, size: 20 } : { name: 'sparkles', color: 'inherit' }} />
		</span>
	);

	return (
		<div className="headerActionWrap" ref={ref}>
			{/* The "new" card would cover the open menu; the menu explains itself. */}
			{isMenuOpen ? trigger : (
				<NewFeature id="workflow-ai-assistant" placement="bottom" isIntroOpen={generate.isIntroOpen && !isTutorialRunning} tooltip={t('ai.menu.title')}>
					{trigger}
				</NewFeature>
			)}
			{isMenuOpen && (
				<div className="headerMenu" data-testid="workflow-ai-menu-list">
					<div className="headerMenuSection">
						{canEdit && isGenerateOn && (
							<WorkflowMenuItem className="headerMenuItem" testId="ai-panel-open" label={t('ai.open')}
								disabled={isGenerateDisabled} tooltip={isGenerateDisabled ? t('ai.unavailableTooltip') : undefined}
								onClick={choose(generate.onToggle)} />
						)}
						{explain && explaining.isAvailable && (
							<WorkflowMenuItem className="headerMenuItem" testId="workflow-ai-explain" label={t('ai.menu.explain')}
								disabled={!explaining.hasSteps} tooltip={explaining.hasSteps ? undefined : t('ai.explain.noSteps')}
								onClick={choose(explaining.open)} />
						)}
						{beebot.isAvailable && (
							<WorkflowMenuItem className="headerMenuItem" testId="voice-wake-toggle" loading={beebot.isStarting}
								label={t(beebot.isOn ? 'ai.menu.beebotOff' : 'ai.menu.beebotOn', { name: WAKE_WORD.name })}
								badge={<Icon name="beebot" state={beebot.state} size={18} />}
								onClick={choose(beebot.toggle)} />
						)}
					</div>
					<div className="headerMenuSection">
						<WorkflowMenuItem className="headerMenuItem" testId="workflow-ai-settings" label={t('ai.menu.settings')}
							badge={<Icon name="settings" size={16} isSubtle />} onClick={choose(() => setSettingsOpen(true))} />
					</div>
				</div>
			)}
			{explaining.dialog}
			<AiSettingsDialog open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
		</div>
	);
}
