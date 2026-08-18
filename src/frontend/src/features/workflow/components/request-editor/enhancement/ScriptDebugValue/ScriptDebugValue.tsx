import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ScriptDebugValueBody } from './ScriptDebugValueBody';
import type { ScriptDebugValueProps } from './ScriptDebugValue.types';
import type { ScriptDebugStatus } from './useScriptDebugValue';
import type { WorkflowI18nKey } from './scriptDebugValue.utils';

// No badge for the normal "resolved fine" state — only states that need the
// user's attention (loading/error/stale) get a chip; "value" speaks for itself.
const BADGE_LABEL_KEY: Partial<Record<ScriptDebugStatus, WorkflowI18nKey>> = {
	idle: 'enhancement.debugValue.status.idle',
	loading: 'enhancement.debugValue.status.loading',
	error: 'enhancement.debugValue.status.error',
	stale: 'enhancement.debugValue.status.stale',
};

// The header's trigger button in Enhancement.tsx is the only control (open+
// resolve / close) — no header actions of its own.
export function ScriptDebugValue({ isOpen, status, snapshot }: ScriptDebugValueProps) {
	const { t } = useI18n('workflow');

	if (!isOpen) return null;

	return (
		<div className="scriptDebugValue" aria-live="polite">
			<div className="scriptDebugValueHeader">
				<div className="scriptDebugValueHeaderLeft">
					<span>{t('enhancement.debugValue.title')}</span>
					{BADGE_LABEL_KEY[status] && (
						<span className={`scriptDebugValueBadge scriptDebugValueBadge--${status}`}>
							{t(BADGE_LABEL_KEY[status])}
						</span>
					)}
				</div>
			</div>
			<div className="scriptDebugValueBody">
				<ScriptDebugValueBody status={status} snapshot={snapshot} />
			</div>
		</div>
	);
}
