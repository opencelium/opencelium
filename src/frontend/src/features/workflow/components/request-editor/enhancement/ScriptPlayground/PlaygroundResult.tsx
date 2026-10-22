import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Empty } from '@shared/ui/primitives/Empty';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { assertNever, type SandboxResult } from '@features/workflow/script-sandbox/sandbox.types';
import { formatSandboxValue } from './formatSandboxValue';
import { sandboxErrorKey } from './sandboxErrorText';

type Props = {
	result: SandboxResult | null;
	isStale: boolean;
	missingNames: string[];
	onLocate: (line: number, column: number) => void;
};

export function PlaygroundResult({ result, isStale, missingNames, onLocate }: Props) {
	const { t } = useI18n('workflow');
	if (!result)
		return (
			<Empty className="scriptPlaygroundEmpty" image={null} description={t('sandbox.empty')} />
		);
	switch (result.kind) {
		case 'timeout':
			return <Alert type="warning" showIcon message={t('sandbox.timeout')} />;
		case 'error': {
			const { line, column = 0 } = result;
			const error = sandboxErrorKey(result.message);
			return (
				<Alert
					type="error"
					showIcon
					message={
						<pre className="scriptPlaygroundErrorText">
							{error ? t(error.key, error.options) : result.message}
						</pre>
					}
					description={
						missingNames.length > 0
							? t('sandbox.missingRuntime', { names: missingNames.join(', ') })
							: undefined
					}
					action={
						line !== undefined && (
							<Button
								type="link"
								testId="script-playground-error-location"
								onClick={() => onLocate(line, column)}
							>
								{t('sandbox.location', { line, column: column + 1 })}
							</Button>
						)
					}
				/>
			);
		}
		case 'value': {
			const formatted = formatSandboxValue(result.value);
			return (
				<>
					<div className="scriptPlaygroundResultHeader">
						<span className={`scriptPlaygroundType scriptPlaygroundType--${result.serverType}`}>
							{result.serverType}
						</span>
						<span>{t(isStale ? 'sandbox.previous' : 'sandbox.simulatedResult')}</span>
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
