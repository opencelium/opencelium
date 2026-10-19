import { AlertTriangle, CirclePlay, CircleX, Clock, Copy } from 'lucide-react';
import { formatSandboxValue } from './formatSandboxValue';
import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { issueMessage } from '@features/workflow/script-sandbox/issueMessage';
import type { CompatibilityIssue } from '@features/workflow/script-sandbox/checkNashornCompatibility';
import { assertNever, type SandboxResult } from '@features/workflow/script-sandbox/sandbox.types';

type Props = {
	result: SandboxResult | null;
	issues: CompatibilityIssue[];
	stale: boolean;
	missingNames?: string[];
	onLocate: (line: number, column: number) => void;
};
export function PlaygroundOutput({ result, issues, stale, missingNames = [], onLocate }: Props) {
	const { t } = useI18n('workflow');
	const [tab, setTab] = useState<'result' | 'console' | 'warnings'>('result');
	const errorText = (message: string) => {
		if (message.startsWith('serverOnly:'))
			return t('sandbox.serverOnly', {
				name: message.slice('serverOnly:'.length),
			});
		const unavailable = message.match(
			/^(.*?) is not available on the server engine \(Nashorn ES5\.1\)$/,
		);
		if (unavailable) return t('sandbox.builtin', { name: unavailable[1] });
		return [
			'syntax',
			'nashornSyntax',
			'csp',
			'invalidResult',
			'workerError',
			'invalidArgument',
		].includes(message)
			? t(`sandbox.${message}`)
			: message;
	};
	const renderResult = () => {
		if (!result)
			return (
				<div className="scriptPlaygroundEmpty">
					<CirclePlay size={30} />
					<p>{t('sandbox.empty')}</p>
				</div>
			);
		switch (result.kind) {
			case 'timeout':
				return (
					<div className="scriptPlaygroundNotice" role="alert">
						<Clock size={18} />
						{t('sandbox.timeout')}
					</div>
				);
			case 'error':
				return (
					<div className="scriptPlaygroundNotice scriptPlaygroundNotice--error" role="alert">
						<CircleX size={18} />
						<div className="scriptPlaygroundErrorDetails">
							<pre>{errorText(result.message)}</pre>
							{result.line !== undefined && (
								<button
									type="button"
									data-testid="script-playground-error-location"
									onClick={() => onLocate(result.line!, result.column ?? 0)}
								>
									{t('sandbox.location', {
										line: result.line,
										column: (result.column ?? 0) + 1,
									})}
								</button>
							)}
							{missingNames.length > 0 && (
								<span>
									{' '}
									·{' '}
									{t('sandbox.missingRuntime', {
										names: missingNames.join(', '),
									})}
								</span>
							)}
						</div>
					</div>
				);
			case 'value':
				return (
					<>
						<div className="scriptPlaygroundResultHeader">
							<span className={`scriptPlaygroundType scriptPlaygroundType--${result.serverType}`}>
								{result.serverType}
							</span>
							<span>{t(stale ? 'sandbox.previous' : 'sandbox.simulatedResult')}</span>
							<button
								type="button"
								data-testid="script-playground-copy"
								aria-label={t('sandbox.copy')}
								onClick={() => {
									void navigator.clipboard
										.writeText(formatSandboxValue(result.value))
										.catch(() => undefined);
								}}
							>
								<Copy size={15} />
							</button>
						</div>
						<div className="scriptPlaygroundValue">
							<pre>{formatSandboxValue(result.value)}</pre>
						</div>
					</>
				);
			default:
				return assertNever(result);
		}
	};
	return (
		<div className="scriptPlaygroundOutput">
			<div role="tablist" aria-label={t('sandbox.result')}>
				{(['result', 'console', 'warnings'] as const).map((name) => (
					<button
						key={name}
						type="button"
						role="tab"
						aria-selected={tab === name}
						id={`script-playground-tab-${name}`}
						aria-controls={`script-playground-panel-${name}`}
						tabIndex={tab === name ? 0 : -1}
						onKeyDown={(event) => {
							const tabs = ['result', 'console', 'warnings'] as const;
							const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
							if (!direction) return;
							event.preventDefault();
							const next = tabs[(tabs.indexOf(name) + direction + 3) % 3];
							setTab(next);
							event.currentTarget.parentElement
								?.querySelector<HTMLButtonElement>(`[data-testid="script-playground-tab-${next}"]`)
								?.focus();
						}}
						data-testid={`script-playground-tab-${name}`}
						onClick={() => setTab(name)}
					>
						{t(`sandbox.${name}`)}
						{name === 'console' && result && result.kind !== 'timeout' && result.console.length > 0
							? ` (${result.console.length})`
							: name === 'warnings' && issues.length > 0
								? ` (${issues.length})`
								: ''}
					</button>
				))}
			</div>
			{issues.some((issue) => issue.kind === 'serverOnly') && (
				<div className="scriptPlaygroundNotice" role="alert">
					<AlertTriangle size={16} />
					{t('sandbox.unreliable')}
				</div>
			)}
			<div
				role="tabpanel"
				id={`script-playground-panel-${tab}`}
				aria-labelledby={`script-playground-tab-${tab}`}
				data-testid="script-playground-result"
			>
				{tab === 'result' ? (
					renderResult()
				) : tab === 'console' ? (
					<ol className="scriptPlaygroundConsole">
						{result &&
							result.kind !== 'timeout' &&
							result.console.map((line, index) => (
								<li key={index}>
									<pre>{line}</pre>
								</li>
							))}
					</ol>
				) : (
					issues.map((issue, index) => (
						<button
							key={index}
							className={`scriptPlaygroundNotice ${issue.kind === 'syntax' ? 'scriptPlaygroundNotice--error' : ''}`}
							type="button"
							data-testid={`script-playground-warning-${index}`}
							onClick={() => onLocate(issue.line, issue.column)}
						>
							{issue.kind === 'syntax' ? <CircleX size={16} /> : <AlertTriangle size={16} />}
							<span>{issueMessage(issue, t)}</span>
							<small>
								{t('sandbox.location', {
									line: issue.line,
									column: issue.column + 1,
								})}
							</small>
						</button>
					))
				)}
			</div>
		</div>
	);
}
