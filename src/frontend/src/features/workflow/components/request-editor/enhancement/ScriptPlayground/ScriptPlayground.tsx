import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Empty } from '@shared/ui/primitives/Empty';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { Enhancement } from '@features/workflow/types/connection';
import {
	checkNashornCompatibility,
	type CompatibilityIssue,
} from '@features/workflow/script-sandbox/checkNashornCompatibility';
import { useScriptSandbox } from '@features/workflow/script-sandbox/useScriptSandbox';
import { useEnhancementArgs } from '../EnhancementArgs/useEnhancementArgs';
import {
	emptyInput,
	parseInput,
	readInputs,
	saveInputs,
	type InputValues,
} from './playgroundInputs';
import { PlaygroundHeader } from './PlaygroundHeader';
import { PlaygroundInput } from './PlaygroundInput';
import { PlaygroundOutput } from './PlaygroundOutput';
import { PlaygroundRunStatus } from './PlaygroundRunStatus';
import { SimulationBanner } from './SimulationBanner';
import './ScriptPlayground.css';

type Props = {
	enhancement: Enhancement;
	script: string;
	issues: CompatibilityIssue[];
	onRuntimeLocation?: (location: { line: number; column: number } | undefined) => void;
	onLocate: (line: number, column: number) => void;
};

export function ScriptPlayground({
	enhancement,
	script,
	issues,
	onRuntimeLocation,
	onLocate,
}: Props) {
	const { t } = useI18n('workflow');
	const [inputs, setInputs] = useState<InputValues>(() => readInputs(enhancement.enhanceId));
	const [lastRun, setLastRun] = useState<string>();
	const sandbox = useScriptSandbox();
	const { entries: argEntries } = useEnhancementArgs(enhancement);
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

	const hasSyntaxError =
		enhancement.language === 'js' &&
		checkNashornCompatibility(script).some((issue) => issue.kind === 'syntax');
	const isDisabled =
		enhancement.language !== 'js' ||
		sandbox.status === 'running' ||
		hasSyntaxError ||
		invalid.length > 0;
	const signature = JSON.stringify([script, inputs, enhancement.args, enhancement.language]);
	const isStale = lastRun !== signature;
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
		if (isDisabled) return;
		setLastRun(signature);
		sandbox.run({ script, args });
	};
	if (enhancement.language !== 'js')
		return (
			<section className="scriptPlayground">
				<PlaygroundHeader hasDocsLink={false} />
				<Empty
					className="scriptPlaygroundEmpty"
					image={<Icon name="code" size={32} isSubtle />}
					description={
						<>
							<span className="scriptPlaygroundUnsupportedLine">{t('sandbox.onlyJs')}</span>
							<span className="scriptPlaygroundUnsupportedLine">
								{t('sandbox.serverLanguages')}
							</span>
						</>
					}
				/>
			</section>
		);
	return (
		<section
			className="scriptPlayground"
			onKeyDown={(event) => {
				if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
					event.preventDefault();
					run();
				}
			}}
		>
			<PlaygroundHeader hasDocsLink />
			<SimulationBanner />
			{Object.values(args).some((value) => typeof value === 'number') && (
				<Alert type="warning" showIcon message={t('sandbox.numberTypes')} />
			)}
			<h4>{t('sandbox.inputs')}</h4>
			{names.map((name) => (
				<PlaygroundInput
					key={name}
					name={name}
					reference={enhancement.args[name]}
					entry={argEntries.find((entry) => entry.key === name)}
					input={inputs[name] ?? emptyInput}
					isInvalid={invalid.includes(name)}
					onChange={(input) => {
						const next = { ...inputs, [name]: input };
						setInputs(next);
						saveInputs(enhancement.enhanceId, next);
					}}
				/>
			))}
			<div className="scriptPlaygroundRunRow">
				<Tooltip
					content={
						hasSyntaxError
							? t('sandbox.fixSyntax')
							: invalid.length
								? t('sandbox.invalidJson', { name: invalid[0] })
								: t('sandbox.shortcut')
					}
				>
					<Button
						type="primary"
						iconLeft="play"
						testId="script-playground-run"
						disabled={isDisabled}
						onClick={run}
					>
						{t(sandbox.status === 'running' ? 'sandbox.running' : 'sandbox.run')}
					</Button>
				</Tooltip>
				<PlaygroundRunStatus
					blockedReason={
						invalid.length ? t('sandbox.invalidJson', { name: invalid[0] }) : undefined
					}
					completedAt={sandbox.completedAt}
					status={sandbox.status}
					isStale={isStale}
				/>
			</div>
			<PlaygroundOutput
				missingNames={isStale ? [] : names.filter((name) => inputs[name]?.mode === 'missing')}
				result={sandbox.result}
				issues={issues}
				isStale={isStale}
				onLocate={onLocate}
			/>
		</section>
	);
}
