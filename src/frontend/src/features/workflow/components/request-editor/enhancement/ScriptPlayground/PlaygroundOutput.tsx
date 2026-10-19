import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Tabs } from '@shared/ui/primitives/Tabs';
import { issueMessage } from '@features/workflow/script-sandbox/issueMessage';
import type { CompatibilityIssue } from '@features/workflow/script-sandbox/checkNashornCompatibility';
import type { SandboxResult } from '@features/workflow/script-sandbox/sandbox.types';
import { PlaygroundResult } from './PlaygroundResult';

type Props = {
	result: SandboxResult | null;
	issues: CompatibilityIssue[];
	isStale: boolean;
	missingNames?: string[];
	onLocate: (line: number, column: number) => void;
};

export function PlaygroundOutput({ result, issues, isStale, missingNames = [], onLocate }: Props) {
	const { t } = useI18n('workflow');
	const consoleLines = result && result.kind !== 'timeout' ? result.console : [];
	const tabLabel = (name: 'result' | 'console' | 'warnings', count = 0) => (
		<span data-testid={`script-playground-tab-${name}`}>
			{t(`sandbox.${name}`)}
			{count > 0 ? ` (${count})` : ''}
		</span>
	);
	return (
		<div className="scriptPlaygroundOutput">
			{issues.some((issue) => issue.kind === 'serverOnly') && (
				<Alert type="warning" showIcon message={t('sandbox.unreliable')} />
			)}
			<Tabs
				defaultValue="result"
				items={[
					{
						key: 'result',
						label: tabLabel('result'),
						content: (
							<div className="scriptPlaygroundPanel" data-testid="script-playground-result">
								<PlaygroundResult
									result={result}
									isStale={isStale}
									missingNames={missingNames}
									onLocate={onLocate}
								/>
							</div>
						),
					},
					{
						key: 'console',
						label: tabLabel('console', consoleLines.length),
						content: (
							<ol className="scriptPlaygroundPanel scriptPlaygroundConsole">
								{consoleLines.map((line, index) => (
									<li key={index}>
										<pre>{line}</pre>
									</li>
								))}
							</ol>
						),
					},
					{
						key: 'warnings',
						label: tabLabel('warnings', issues.length),
						content: (
							<div className="scriptPlaygroundPanel scriptPlaygroundWarnings">
								{issues.map((issue, index) => (
									<Alert
										key={index}
										type={issue.kind === 'syntax' ? 'error' : 'warning'}
										showIcon
										message={issueMessage(issue, t)}
										action={
											<Button
												type="link"
												testId={`script-playground-warning-${index}`}
												onClick={() => onLocate(issue.line, issue.column)}
											>
												{t('sandbox.location', {
													line: issue.line,
													column: issue.column + 1,
												})}
											</Button>
										}
									/>
								))}
							</div>
						),
					},
				]}
			/>
		</div>
	);
}
