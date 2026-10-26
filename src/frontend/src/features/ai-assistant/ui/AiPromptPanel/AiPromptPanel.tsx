import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { Icon } from '@shared/ui/primitives/Icon';
import type { AiPromptPanelModel } from '../../hooks/useAiPromptPanel';
import { AiPromptForm } from './AiPromptForm';
import { AiResultView } from './AiResultView';
import { AiPlanView } from './AiPlanView';
import { AiUnavailable } from './AiUnavailable';
import { AiPanelFooter } from './AiPanelFooter';
import '../../styles/ai-panel.css';

type Props = {
	model: AiPromptPanelModel;
};

// The drawer slides in over 0.22s; focusing before it is visible is ignored by the browser.
const FOCUS_DELAY_MS = 60;
// The field is still partly off-screen mid-slide; a plain focus() scrolls the editor page sideways to reveal it.
const FOCUS_OPTIONS: FocusOptions = { preventScroll: true };

export function AiPromptPanel({ model }: Props) {
	const { t } = useI18n('workflow');
	const { isOpen, view, choices, generation, isCheckingHealth, onCheckAgain, onClose, applyBlock, onApply } = model;
	const promptRef = useRef<HTMLTextAreaElement>(null);
	const planRef = useRef<HTMLTextAreaElement>(null);
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
		if (!isOpen || (view !== 'prompt' && view !== 'plan')) return;
		const field = view === 'prompt' ? promptRef : planRef;
		const timer = window.setTimeout(() => field.current?.focus(FOCUS_OPTIONS), FOCUS_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [isOpen, view]);

	const onShortcut = (action: () => Promise<void>) => (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void action();
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
							connectors={generation.connectors} onEditPlan={generation.backToPlan} />
					)}
					{(view === 'prompt' || view === 'planning') && (
						<AiPromptForm generation={generation} choices={choices} promptRef={promptRef}
							onPromptKeyDown={onShortcut(generation.plan)} />
					)}
					{(view === 'plan' || view === 'building') && (
						<AiPlanView generation={generation} choices={choices} planRef={planRef}
							onPlanKeyDown={onShortcut(generation.build)} />
					)}
				</div>
				<AiPanelFooter view={view} canPlan={generation.canPlan} canBuild={generation.canBuild} applyBlock={applyBlock}
					onPlan={() => void generation.plan()} onBuild={() => void generation.build()} onCancel={generation.cancel}
					onDiscard={generation.discard} onApply={onApply} />
			</aside>
		</>
	);
}
