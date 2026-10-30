import { useEffect, useRef } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import type { RunFailureAssist } from '../../run/useRunFailureAssist';
import { AiExpectedTime } from '../AiExpectedTime/AiExpectedTime';
import { AiRunExplanation } from './AiRunExplanation';
import { AiRunFixProposal } from './AiRunFixProposal';
import '../../styles/ai-run.css';

type Props = {
	assist: RunFailureAssist;
	nodes: WorkflowNodeModel[];
	/** A running test locks the graph: a fix can be prepared but not applied. */
	isLocked: boolean;
};

/** The AI's answer right under the failing element's error: explanation, then Fix with AI and its proposal. */
export function AiRunPanel({ assist, nodes, isLocked }: Props) {
	const { t, lang } = useI18n('workflow');
	const { state, explainedAt, isShown } = assist;
	const panelRef = useRef<HTMLElement>(null);

	// Brought into view when it opens and again when the answer lands, which makes it taller.
	useEffect(() => {
		if (isShown) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, [isShown, state.status]);

	if (!isShown) return null;

	const explanation = 'explanation' in state ? state.explanation : null;
	const canFix = explanation?.isRequestFixable && (state.status === 'explained' || state.status === 'fixing');
	const currentConfig = state.status === 'fix'
		? nodes.find((node) => node.id === state.target.nodeId)?.data.methodConfig ?? state.target.methodConfig
		: null;

	return (
		<section ref={panelRef} className="aiRunPanel" data-testid="ai-run-assist">
			<div className="aiRunPanelHeader">
				<Icon name="sparkles" color="primary" />
				<span className="aiRunPanelTitle">{t('ai.run.title')}</span>
				<Tooltip content={t('ai.run.close')}>
					<IconButton type="text" size="xs" iconProps={{ name: 'close' }} onClick={assist.hide} testId="ai-run-close" />
				</Tooltip>
			</div>
			{state.status === 'explaining' && (
				<div className="aiRunWorking"><Loading size="xs" inline />{t('ai.run.working')}<AiExpectedTime feature="runExplain" /></div>
			)}
			{state.status === 'error' && <div className="aiRunError" data-testid="ai-run-error">{t('ai.run.failed')}</div>}
			{explanation && <AiRunExplanation explanation={explanation} />}
			{state.status === 'fix' && (
				<AiRunFixProposal fix={state.fix} currentConfig={currentConfig ?? state.target.methodConfig} isLocked={isLocked} onApply={assist.apply} onDiscard={assist.discard} />
			)}
			{state.status === 'applied' && <div className="aiTemplateNote" data-testid="ai-run-applied">{t('ai.run.appliedHint')}</div>}
			{state.status !== 'explaining' && state.status !== 'fix' && (
				<div className="aiRunPanelFooter">
					{canFix && (
						<Button type="primary" iconLeft="sparkles" onClick={() => void assist.fix()} loading={state.status === 'fixing'}
							testId="ai-run-fix-button">{t('ai.run.fix')}</Button>
					)}
					<Button iconLeft="refresh" onClick={() => void assist.explain()} disabled={state.status === 'fixing'}
						testId="ai-run-regenerate">{t('ai.run.regenerate')}</Button>
					{state.status === 'fixing' && <AiExpectedTime feature="runFix" />}
					{explainedAt !== null && explanation && (
						<span className="aiRunGeneratedAt" data-testid="ai-run-generated-at">
							{t('ai.run.generatedAt', { time: new Date(explainedAt).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) })}
						</span>
					)}
				</div>
			)}
		</section>
	);
}
