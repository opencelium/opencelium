import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { SandboxResult } from '@features/workflow/script-sandbox/sandbox.types';
import { compareSandboxResults } from './compareSandboxResults';
import { formatSandboxValue } from './formatSandboxValue';
import { sandboxErrorKey } from './sandboxErrorText';

type Props = {
	current: SandboxResult | null;
	candidate: SandboxResult | null;
	candidateLabel: string;
	isStale: boolean;
};

function ResultCell({ result }: { result: SandboxResult | null }) {
	const { t } = useI18n('workflow');
	if (!result) return <pre className="scriptPlaygroundComparisonValue">—</pre>;
	switch (result.kind) {
		case 'value':
			return (
				<>
					<span className={`scriptPlaygroundType scriptPlaygroundType--${result.serverType}`}>{result.serverType}</span>
					<pre className="scriptPlaygroundComparisonValue">{formatSandboxValue(result.value)}</pre>
				</>
			);
		case 'error': {
			const error = sandboxErrorKey(result.message);
			return (
				<pre className="scriptPlaygroundComparisonValue scriptPlaygroundComparisonValue--error">
					{error ? t(error.key, error.options) : result.message}
				</pre>
			);
		}
		case 'timeout':
			return <pre className="scriptPlaygroundComparisonValue scriptPlaygroundComparisonValue--error">{t('sandbox.timeout')}</pre>;
	}
}

/** The editor's script and the candidate run on the same inputs, results side by side. */
export function PlaygroundComparison({ current, candidate, candidateLabel, isStale }: Props) {
	const { t } = useI18n('workflow');
	const verdict = isStale ? 'pending' : compareSandboxResults(current, candidate);
	return (
		<section className="scriptPlaygroundComparison" data-testid="script-playground-comparison">
			<header className="scriptPlaygroundComparisonHeader">
				<span>{t('sandbox.comparison.title', { candidate: candidateLabel })}</span>
				<span className={`scriptPlaygroundVerdict scriptPlaygroundVerdict--${verdict}`} data-testid="script-playground-verdict">
					{t(`sandbox.comparison.${verdict}`)}
				</span>
			</header>
			<div className="scriptPlaygroundComparisonGrid">
				<div>
					<div className="scriptPlaygroundComparisonLabel">{t('sandbox.comparison.current')}</div>
					<ResultCell result={current} />
				</div>
				<div>
					<div className="scriptPlaygroundComparisonLabel">{candidateLabel}</div>
					<ResultCell result={candidate} />
				</div>
			</div>
		</section>
	);
}
