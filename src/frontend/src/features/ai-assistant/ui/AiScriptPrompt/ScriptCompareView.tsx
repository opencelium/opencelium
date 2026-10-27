import { useI18n } from '@shared/i18n/hooks/useI18n';
import { diffLines } from '../../utils/scriptVersions.utils';

export type CompareMode = 'diff' | 'split' | 'candidate';

type Props = {
	mode: CompareMode;
	current: string;
	candidate: string;
	candidateLabel: string;
};

const MARK = { same: ' ', added: '+', removed: '-' } as const;

export function ScriptCompareView({ mode, current, candidate, candidateLabel }: Props) {
	const { t } = useI18n('workflow');
	switch (mode) {
		case 'diff': {
			if (current.trim() === candidate.trim())
				return <div className="aiScriptCompareSame">{t('ai.script.compare.noChanges')}</div>;
			return (
				<pre className="aiScriptCompareCode aiScriptDiff" data-testid="ai-script-diff">
					{diffLines(current, candidate).map((line, index) => (
						<div key={index} className={`aiScriptDiffLine aiScriptDiffLine--${line.kind}`}>
							<span className="aiScriptDiffMark" aria-hidden>{MARK[line.kind]}</span>
							{line.text || ' '}
						</div>
					))}
				</pre>
			);
		}
		case 'split':
			return (
				<div className="aiScriptCompareSplit">
					<div>
						<div className="aiScriptCompareLabel">{t('ai.script.compare.current')}</div>
						<pre className="aiScriptCompareCode">{current}</pre>
					</div>
					<div>
						<div className="aiScriptCompareLabel">{candidateLabel}</div>
						<pre className="aiScriptCompareCode">{candidate}</pre>
					</div>
				</div>
			);
		case 'candidate':
			return <pre className="aiScriptCompareCode">{candidate}</pre>;
		default: {
			const _exhaustive: never = mode;
			return _exhaustive;
		}
	}
}
