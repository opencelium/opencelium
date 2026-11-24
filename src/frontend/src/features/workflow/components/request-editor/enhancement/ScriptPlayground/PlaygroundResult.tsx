import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Empty } from '@shared/ui/primitives/Empty';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { ScriptExecutionError } from '@features/workflow/script-sandbox/langCode.types';
import { assertNever, type ScriptRunResult } from '@features/workflow/script-sandbox/sandbox.types';
import { formatSandboxValue } from './formatSandboxValue';
import { rejectionKey } from './rejectionKey';

type Props = {
	result: ScriptRunResult | null;
	isStale: boolean;
	missingNames: string[];
	onLocate: (line: number, column: number) => void;
};

function RunError({ error, missingNames, onLocate }: Omit<Props, 'result' | 'isStale'> & { error: ScriptExecutionError }) {
	const { t } = useI18n('workflow');
	const { line, column } = error;
	const detail = [error.name ? `${error.name}: ${error.message}` : error.message, error.codeLine]
		.filter(Boolean)
		.join('\n');
	return (
		<Alert
			type={error.type === 'TIMEOUT' ? 'warning' : 'error'}
			showIcon
			message={error.hint}
			description={
				<>
					<pre className="scriptPlaygroundErrorText scriptPlaygroundErrorDetail">{detail}</pre>
					{missingNames.length > 0 &&
						t('sandbox.missingRuntime', { names: missingNames.join(', ') })}
				</>
			}
			action={
				line !== null && (
					<Button
						type="link"
						testId="script-playground-error-location"
						onClick={() => onLocate(line, Math.max(0, (column ?? 1) - 1))}
					>
						{column === null ? t('sandbox.line', { line }) : t('sandbox.location', { line, column })}
					</Button>
				)
			}
		/>
	);
}

export function PlaygroundResult({ result, isStale, missingNames, onLocate }: Props) {
	const { t } = useI18n('workflow');
	if (!result)
		return (
			<Empty className="scriptPlaygroundEmpty" image={null} description={t('sandbox.empty')} />
		);
	switch (result.kind) {
		case 'rejected':
			return <Alert type="error" showIcon message={t(rejectionKey(result.failure))} />;
		case 'error':
			return <RunError error={result.error} missingNames={missingNames} onLocate={onLocate} />;
		case 'value': {
			const formatted = formatSandboxValue(result.value);
			return (
				<>
					<div className="scriptPlaygroundResultHeader">
						<span className={`scriptPlaygroundType scriptPlaygroundType--${result.resultType}`}>
							{result.resultType}
						</span>
						<span>{t(isStale ? 'sandbox.previous' : 'sandbox.serverResult')}</span>
						<span>{t('sandbox.duration', { ms: result.durationMs })}</span>
						<Tooltip content={t('sandbox.copy')}>
							<IconButton
								type="text"
								size="xs"
								testId="script-playground-copy"
								iconProps={{ name: 'content-copy', color: 'inherit' }}
								onClick={() => {
									void navigator.clipboard.writeText(formatted).catch(() => undefined);
								}}
							/>
						</Tooltip>
					</div>
					<div className="scriptPlaygroundValue">
						<pre>{formatted}</pre>
					</div>
				</>
			);
		}
		default:
			return assertNever(result);
	}
}
