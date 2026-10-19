import { AlertTriangle, CheckCircle2, CircleX, Info } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { CompatibilityIssue } from '@features/workflow/script-sandbox/checkNashornCompatibility';
import { issueMessage } from '@features/workflow/script-sandbox/issueMessage';

type Props = {
	issues: CompatibilityIssue[];
	enabled: boolean;
	onLocate: (line: number, column: number) => void;
};
export function ScriptCompatibilityStatus({ issues, enabled, onLocate }: Props) {
	const { t } = useI18n('workflow');
	const [open, setOpen] = useState(false);
	const errors = issues.filter((issue) => issue.kind === 'syntax').length;
	const warnings = issues.length - errors;
	const summary = [
		errors && t('sandbox.errors', { count: errors }),
		warnings && t('sandbox.warningCount', { count: warnings }),
	]
		.filter(Boolean)
		.join(' · ');
	return (
		<div className="scriptCompatibilityIssues">
			<div className="scriptCompatibilitySummary">
				<span className="scriptCompatibilitySummaryText">
					{enabled &&
						(errors ? (
							<CircleX size={14} color="#e5484d" />
						) : warnings ? (
							<AlertTriangle size={14} color="#d99500" />
						) : (
							<CheckCircle2 size={14} color="#389e0d" />
						))}
					{!enabled && <Info size={14} />}
					{!enabled ? t('sandbox.compatibilityOnlyJs') : issues.length ? summary : t('sandbox.compatible')}
				</span>
				{enabled && issues.length > 0 && (
					<button
						type="button"
						data-testid="script-compatibility-issues-toggle"
						aria-expanded={open}
						onClick={() => setOpen(!open)}
					>
						{t(open ? 'sandbox.hide' : 'sandbox.show')}
					</button>
				)}
			</div>
			{enabled &&
				open &&
				issues.map((issue, index) => (
					<button
						type="button"
						data-testid={`script-compatibility-issue-${index}`}
						key={index}
						onClick={() => onLocate(issue.line, issue.column)}
					>
						{issue.line}:{issue.column + 1} — {issueMessage(issue, t)}
					</button>
				))}
		</div>
	);
}
