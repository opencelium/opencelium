import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { Icon } from '@shared/ui/primitives/Icon';
import type { AiPromptPanelModel } from '../../hooks/useAiPromptPanel';
import type { WorkflowDsl } from '../../model/workflowDsl.schema';
import { AiPromptForm } from './AiPromptForm';
import { AiResultView } from './AiResultView';
import { AiUnavailable } from './AiUnavailable';
import { AiPanelFooter } from './AiPanelFooter';
import '../../styles/ai-panel.css';

type Props = {
	model: AiPromptPanelModel;
	/** Absent until applying to the canvas is implemented; the Apply action is hidden without it. */
	onApply?: (dsl: WorkflowDsl) => void;
};

// The drawer slides in over 0.22s; focusing before it is visible is ignored by the browser.
const FOCUS_DELAY_MS = 60;

export function AiPromptPanel({ model, onApply }: Props) {
	const { t } = useI18n('workflow');
	const { isOpen, view, choices, generation, isCheckingHealth, onCheckAgain, onClose } = model;
	const promptRef = useRef<HTMLTextAreaElement>(null);
	const { state } = generation;

	useEffect(() => {
		if (!isOpen) return;
		const onEscape = (event: globalThis.KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen || view !== 'idle') return;
		const timer = window.setTimeout(() => promptRef.current?.focus(), FOCUS_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [isOpen, view]);

	const onPromptKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void generation.generate();
		}
	};

	return (
		<>
			<div className={`drawerOverlay ${isOpen ? 'drawerOverlayOpen' : ''}`} onClick={onClose} />
			<aside data-testid="ai-panel" aria-label={t('ai.title')}
				className={`rightDrawer aiPanelDrawer ${isOpen ? 'rightDrawerOpen' : ''}`}>
				<div className="drawerHeader">
					<div>
						<div className="drawerTitle">{t('ai.title')}</div>
						<div className="drawerSubTitle aiPanelSubtitle">
							<Icon name="lock" size={12} color="inherit" />
							{t('ai.subtitle')}
						</div>
					</div>
					<Tooltip content={t('ai.close')}>
						<IconButton type="text" iconProps={{ name: 'close' }} onClick={onClose} testId="ai-panel-close" />
					</Tooltip>
				</div>
				<div className="drawerBody aiPanelBody">
					{view === 'unavailable' && <AiUnavailable isChecking={isCheckingHealth} onCheckAgain={onCheckAgain} />}
					{state.status === 'result' && view === 'result' && (
						<AiResultView prompt={state.prompt} response={state.response} choices={choices}
							connectors={generation.connectors} onEditPrompt={generation.backToPrompt} />
					)}
					{view !== 'unavailable' && view !== 'result' && (
						<AiPromptForm generation={generation} choices={choices} promptRef={promptRef}
							onPromptKeyDown={onPromptKeyDown} />
					)}
				</div>
				<AiPanelFooter view={view} canGenerate={generation.canGenerate}
					onGenerate={() => void generation.generate()} onCancel={generation.cancel}
					onDiscard={generation.discard}
					onApply={onApply && state.status === 'result' ? () => onApply(state.response.dsl) : undefined} />
			</aside>
		</>
	);
}
