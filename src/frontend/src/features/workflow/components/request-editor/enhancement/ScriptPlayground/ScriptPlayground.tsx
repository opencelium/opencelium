import { Code, FlaskConical, Info, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Enhancement } from '@features/workflow/types/connection';
import {
	checkNashornCompatibility,
	type CompatibilityIssue,
} from '@features/workflow/script-sandbox/checkNashornCompatibility';
import { useScriptSandbox } from '@features/workflow/script-sandbox/useScriptSandbox';
import {
	emptyInput,
	parseInput,
	readInputs,
	saveInputs,
	type InputValues,
} from './playgroundInputs';
import { PlaygroundInput } from './PlaygroundInput';
import { PlaygroundOutput } from './PlaygroundOutput';
import { PlaygroundRunStatus } from './PlaygroundRunStatus';
import './ScriptPlayground.css';

type Props = {
	enhancement: Enhancement;
	script: string;
	issues: CompatibilityIssue[];
	onClose: () => void;
	onRuntimeLocation?: (location: { line: number; column: number } | undefined) => void;
	onLocate: (line: number, column: number) => void;
};
export function ScriptPlayground({
	enhancement,
	script,
	issues,
	onClose,
	onRuntimeLocation,
	onLocate,
}: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const [inputs, setInputs] = useState<InputValues>(() => readInputs(enhancement.enhanceId));
	const [lastRun, setLastRun] = useState<string>();
	const sandbox = useScriptSandbox();
	const args: Record<string, unknown> = {};
	const invalid: string[] = [];
	const names = Object.keys(enhancement.args).filter((name) => /^VAR_\d+$/.test(name));
	names.forEach((name) => {
		try {
			args[name] = parseInput(inputs[name] ?? emptyInput);
		} catch {
			invalid.push(name);
		}
	});

	const syntax =
		enhancement.language === 'js' &&
		checkNashornCompatibility(script).some((issue) => issue.kind === 'syntax');
	const disabled =
		enhancement.language !== 'js' || sandbox.status === 'running' || syntax || invalid.length > 0;
	const signature = JSON.stringify([script, inputs, enhancement.args, enhancement.language]);
	useEffect(() => {
		const result = sandbox.result;
		onRuntimeLocation?.(
			enhancement.language === 'js' &&
				lastRun === signature &&
				result?.kind === 'error' &&
				result.line !== undefined
				? { line: result.line, column: result.column ?? 0 }
				: undefined,
		);
	}, [sandbox.result, lastRun, signature, enhancement.language, onRuntimeLocation]);
	const run = () => {
		if (disabled) return;
		setLastRun(signature);
		sandbox.run({ script, args });
	};
	if (enhancement.language !== 'js')
		return (
			<section className={`scriptPlayground scriptPlayground--${themeMode}`}>
				<div className="scriptPlaygroundInputHeader">
					<strong className="scriptPlaygroundTitle">
						<FlaskConical size={17} />
						{t('sandbox.title')}
						<small>{t('sandbox.simulation')}</small>
					</strong>
					<button
						type="button"
						data-testid="script-playground-close"
						aria-label={t('sandbox.close')}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>
				<div className="scriptPlaygroundEmpty scriptPlaygroundUnsupported">
					<Code size={32} />
					<p>
						<span>{t('sandbox.onlyJs')}</span>
						<span>{t('sandbox.serverLanguages')}</span>
					</p>
				</div>
			</section>
		);
	return (
		<section
			className={`scriptPlayground scriptPlayground--${themeMode}`}
			onKeyDown={(event) => {
				if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
					event.preventDefault();
					run();
				}
			}}
		>
			<div className="scriptPlaygroundInputHeader">
				<strong className="scriptPlaygroundTitle">
					<FlaskConical size={17} />
					{t('sandbox.title')}
					<small>{t('sandbox.simulation')}</small>
				</strong>
				<button
					type="button"
					data-testid="script-playground-close"
					aria-label={t('sandbox.close')}
					onClick={onClose}
				>
					<X size={16} />
				</button>
			</div>
			<p className="scriptPlaygroundBanner">
				<Info size={16} />
				<span>{t('sandbox.banner')}</span>
			</p>
			{Object.values(args).some((value) => typeof value === 'number') && (
				<p role="alert">{t('sandbox.numberTypes')}</p>
			)}
			<h4>{t('sandbox.inputs')}</h4>
			{names.map((name) => (
				<PlaygroundInput
					key={name}
					name={name}
					reference={enhancement.args[name]}
					input={inputs[name] ?? emptyInput}
					invalid={invalid.includes(name)}
					onChange={(input) => {
						const next = { ...inputs, [name]: input };
						setInputs(next);
						saveInputs(enhancement.enhanceId, next);
					}}
				/>
			))}
			<div className="scriptPlaygroundRunRow">
				<button
					type="button"
					className="scriptPlaygroundRun"
					data-testid="script-playground-run"
					disabled={disabled}
					onClick={run}
					title={
						syntax
							? t('sandbox.fixSyntax')
							: invalid.length
								? t('sandbox.invalidJson', { name: invalid[0] })
								: t('sandbox.shortcut')
					}
				>
					<Play size={15} />
					{t(sandbox.status === 'running' ? 'sandbox.running' : 'sandbox.run')}
					<kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} ↵</kbd>
				</button>
				<PlaygroundRunStatus
					blockedReason={
						invalid.length ? t('sandbox.invalidJson', { name: invalid[0] }) : undefined
					}
					completedAt={sandbox.completedAt}
					status={sandbox.status}
					stale={lastRun !== signature}
				/>
			</div>
			<PlaygroundOutput
				missingNames={
					lastRun === signature ? names.filter((name) => inputs[name]?.mode === 'missing') : []
				}
				result={sandbox.result}
				issues={issues}
				stale={lastRun !== signature}
				onLocate={onLocate}
			/>
		</section>
	);
}
