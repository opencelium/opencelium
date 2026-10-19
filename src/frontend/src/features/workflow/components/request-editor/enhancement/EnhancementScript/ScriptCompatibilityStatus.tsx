import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types';
import type { CompatibilityIssue } from '@features/workflow/script-sandbox/checkNashornCompatibility';
import { issueMessage } from '@features/workflow/script-sandbox/issueMessage';

type Props = {
	issues: CompatibilityIssue[];
	isEnabled: boolean;
	onLocate: (line: number, column: number) => void;
};
type Tone = 'error' | 'warning' | 'success' | 'info';

const toneIcon: Record<Tone, IconName> = {
	error: 'error-circle',
	warning: 'warning',
	success: 'check-circle',
	info: 'info',
};

export function ScriptCompatibilityStatus({ issues, isEnabled, onLocate }: Props) {
	const { t } = useI18n('workflow');
	const [isOpen, setOpen] = useState(false);
	const errors = issues.filter((issue) => issue.kind === 'syntax').length;
	const warnings = issues.length - errors;
	const summary = [
		errors && t('sandbox.errors', { count: errors }),
		warnings && t('sandbox.warningCount', { count: warnings }),
	]
		.filter(Boolean)
		.join(' · ');
	const tone: Tone = !isEnabled ? 'info' : errors ? 'error' : warnings ? 'warning' : 'success';
	return (
		<div className="scriptCompatibilityIssues">
			<div className="scriptCompatibilitySummary">
				<span className="scriptCompatibilitySummaryText">
					<span className={`scriptTone scriptTone--${tone}`}>
						<Icon name={toneIcon[tone]} size={14} color="inherit" />
					</span>
					{!isEnabled
						? t('sandbox.compatibilityOnlyJs')
						: issues.length
							? summary
							: t('sandbox.compatible')}
				</span>
				{isEnabled && issues.length > 0 && (
					<Button
						type="link"
						testId="script-compatibility-issues-toggle"
						onClick={() => setOpen(!isOpen)}
					>
						{t(isOpen ? 'sandbox.hide' : 'sandbox.show')}
					</Button>
				)}
			</div>
			{isEnabled &&
				isOpen &&
				issues.map((issue, index) => (
					<Button
						key={index}
						type="text"
						className="scriptCompatibilityIssue"
						testId={`script-compatibility-issue-${index}`}
						onClick={() => onLocate(issue.line, issue.column)}
					>
						{issue.line}:{issue.column + 1} — {issueMessage(issue, t)}
					</Button>
				))}
		</div>
	);
}
