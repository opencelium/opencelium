import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import type { ScriptCandidate } from '../../hooks/useScriptVersions';
import { isUntouchedScript } from '../../utils/scriptVersions.utils';
import { AiProposalActions } from '../AiProposal/AiProposalActions';
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
	// Against an empty editor a diff is all additions: the script alone reads better.
	const [mode, setMode] = useState<CompareMode>(() => (isUntouchedScript(currentScript) ? 'candidate' : 'diff'));
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
			<AiProposalActions
				apply={{ label: t(isGenerated ? 'ai.script.proposal.apply' : 'ai.script.proposal.restore'), onClick: onAccept,
					testId: 'ai-script-proposal-apply' }}
				discard={{ label: t('ai.script.proposal.discard'), onClick: onDiscard, testId: 'ai-script-proposal-discard' }}
				extra={!isPlaygroundOpen && onOpenPlayground && (
					<Button type="link" iconLeft="play" onClick={onOpenPlayground} testId="ai-script-proposal-playground">
						{t('ai.script.proposal.compareInPlayground')}
					</Button>
				)} />
		</section>
	);
}
