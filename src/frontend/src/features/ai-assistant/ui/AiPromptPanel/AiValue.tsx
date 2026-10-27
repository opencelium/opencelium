import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import type { PreviewRef, PreviewValue } from '../../utils/dslPreview.utils';

export function AiValue({ value }: { value: PreviewValue }) {
	switch (value.kind) {
		case 'literal':
			return <code className="aiLiteral">"{value.text}"</code>;
		case 'ref':
			return <AiRefChip value={value} />;
		case 'script':
			return <AiScriptValue value={value} />;
		default: {
			const _exhaustive: never = value;
			return _exhaustive;
		}
	}
}

function AiRefChip({ value }: { value: PreviewRef }) {
	return (
		<span className="aiRefChip">
			<span className="aiRefSource">{value.source}</span>
			{value.path && (
				<>
					<span className="aiRefSeparator" aria-hidden>›</span>
					<code className="aiRefPath">{value.path}</code>
				</>
			)}
		</span>
	);
}

function AiScriptValue({ value }: { value: Extract<PreviewValue, { kind: 'script' }> }) {
	const { t } = useI18n('workflow');
	return (
		<div className="aiScript" data-testid="ai-step-script">
			<div className="aiScriptHeader">
				<span className="aiScriptBadge"><Icon name="code" size={12} color="inherit" />{t('ai.result.script')}</span>
				{value.description && <span className="aiScriptDescription">{value.description}</span>}
			</div>
			<ul className="aiScriptInputs">
				{value.inputs.map((input, index) => (
					<li key={`${index}-${input.source}-${input.path}`}>
						<code className="aiScriptVar">VAR_{index}</code>
						<AiRefChip value={input} />
					</li>
				))}
			</ul>
			<pre className="aiScriptCode">{value.code}</pre>
			{value.problems.map((problem) => (
				<div key={`${problem.line}:${problem.column}:${problem.message}`} className="aiScriptProblem">
					<Icon name="warning" size={12} color="inherit" />
					{t('ai.result.scriptProblem', { line: problem.line, message: problem.message })}
				</div>
			))}
		</div>
	);
}
