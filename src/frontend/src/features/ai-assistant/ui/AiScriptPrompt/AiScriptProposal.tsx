import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import type { ScriptCandidate } from '../../hooks/useScriptVersions';
import { type CompareMode, ScriptCompareView } from './ScriptCompareView';

type Props = {
	candidate: ScriptCandidate;
	currentScript: string;
	isPlaygroundOpen: boolean;
	onOpenPlayground?: () => void;
	onAccept: () => void;
	onDiscard: () => void;
};

const MODES: CompareMode[] = ['diff', 'split', 'candidate'];

/** The generated script (or an earlier version) beside the editor's script, until the user applies or discards it. */
export function AiScriptProposal({ candidate, currentScript, isPlaygroundOpen, onOpenPlayground, onAccept, onDiscard }: Props) {
	const { t } = useI18n('workflow');
	const [mode, setMode] = useState<CompareMode>('diff');
	const isGenerated = candidate.kind === 'generated';
	const candidateLabel = t(isGenerated ? 'ai.script.compare.generated' : 'ai.script.compare.version');
	return (
		<section className="aiScriptProposal" data-testid="ai-script-proposal">
			<header className="aiScriptProposalHeader">
				<Icon name={isGenerated ? 'sparkles' : 'history'} size={14} color="primary" />
				<span className="aiScriptProposalTitle">
					{t(isGenerated ? 'ai.script.proposal.generatedTitle' : 'ai.script.proposal.versionTitle')}
				</span>
				<div className="aiScriptProposalModes">
					{MODES.map((value) => (
						<Button key={value} type="text" testId={`ai-script-compare-${value}`} onClick={() => setMode(value)}
							className={`aiScriptProposalMode ${mode === value ? 'aiScriptProposalMode--active' : ''}`}>
							{value === 'candidate' ? candidateLabel : t(`ai.script.compare.${value}`)}
						</Button>
					))}
				</div>
			</header>
			{isGenerated && candidate.problems.length > 0 && (
				<div className="aiScriptPromptStatus aiScriptPromptStatus--warning">{t('ai.script.problems')}</div>
			)}
			<ScriptCompareView mode={mode} current={currentScript} candidate={candidate.script} candidateLabel={candidateLabel} />
			{candidate.description && <div className="aiScriptProposalDescription">{candidate.description}</div>}
			<footer className="aiScriptProposalFooter">
				{!isPlaygroundOpen && onOpenPlayground && (
					<Button type="link" iconLeft="play" className="aiScriptProposalPlayground" onClick={onOpenPlayground}
						testId="ai-script-proposal-playground">
						{t('ai.script.proposal.compareInPlayground')}
					</Button>
				)}
				<Button onClick={onDiscard} testId="ai-script-proposal-discard">{t('ai.script.proposal.discard')}</Button>
				<Button type="primary" onClick={onAccept} testId="ai-script-proposal-apply">
					{t(isGenerated ? 'ai.script.proposal.apply' : 'ai.script.proposal.restore')}
				</Button>
			</footer>
		</section>
	);
}
