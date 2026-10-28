import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import type { RunFix } from '../../model/aiGateway.types';

type Props = {
	fix: RunFix;
	/** The step's body as it is now, shown beside the proposal. */
	currentBody: string;
	/** A running test locks the graph. */
	isLocked: boolean;
	onApply: () => void;
	onDiscard: () => void;
};

/** The corrected request body next to the current one; applying it is a normal, undoable edit of that step. */
export function AiRunFixProposal({ fix, currentBody, isLocked, onApply, onDiscard }: Props) {
	const { t } = useI18n('workflow');
	const isUnchanged = fix.body.trim() === currentBody.trim();
	return (
		<div className="aiRunFix" data-testid="ai-run-fix">
			<div className="aiRunLabel">{t('ai.run.changes')}</div>
			<ul className="aiRunFixList">{fix.changes.map((change) => <li key={change}>{change}</li>)}</ul>
			{fix.problems.length > 0 && (
				<Alert type="warning" showIcon message={t('ai.run.problems')} description={fix.problems.join(' · ')} />
			)}
			{isUnchanged ? (
				<div className="aiTemplateNote">{t('ai.run.noBodyChange')}</div>
			) : (
				<div className="aiRunBodies">
					<div>
						<div className="aiRunLabel">{t('ai.run.currentBody')}</div>
						<pre className="aiRunBody">{currentBody}</pre>
					</div>
					<div>
						<div className="aiRunLabel">{t('ai.run.proposedBody')}</div>
						<pre className="aiRunBody aiRunBody--proposed" data-testid="ai-run-proposed-body">{fix.body}</pre>
					</div>
				</div>
			)}
			<div className="aiRunActions">
				<Button type="primary" onClick={onApply} disabled={isUnchanged || isLocked} testId="ai-run-apply">{t('ai.run.apply')}</Button>
				<Button onClick={onDiscard} testId="ai-run-discard">{t('ai.run.discard')}</Button>
			</div>
		</div>
	);
}
