import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';
import type { RunFix } from '../../model/aiGateway.types';
import { bodyText, changedHeaders, isSameBody, prettyBody } from '../../run/runFailure.utils';

type Props = {
	fix: RunFix;
	/** The step as it is now, shown beside the proposal. */
	currentConfig: WorkflowMethodConfig;
	/** A running test locks the graph. */
	isLocked: boolean;
	onApply: () => void;
	onDiscard: () => void;
};

/** The corrected body and headers next to the current ones; applying them is a normal, undoable edit of that step. */
export function AiRunFixProposal({ fix, currentConfig, isLocked, onApply, onDiscard }: Props) {
	const { t } = useI18n('workflow');
	const currentBody = bodyText(currentConfig.body);
	const isBodyChanged = !isSameBody(currentConfig.body, fix.body);
	const headers = changedHeaders(currentConfig, fix.headers ?? []);
	const isUnchanged = !isBodyChanged && headers.length === 0;
	return (
		<div className="aiRunFix" data-testid="ai-run-fix">
			{/* A request left as it is leaves the changes as advice on what to change outside the step. */}
			{(isUnchanged || fix.changes.length > 0) && (
				<div className="aiRunLabel">{t(isUnchanged ? 'ai.run.noBodyChange' : 'ai.run.changes')}</div>
			)}
			{fix.changes.length > 0 && <ul className="aiRunFixList">{fix.changes.map((change) => <li key={change}>{change}</li>)}</ul>}
			{!isUnchanged && fix.problems.length > 0 && (
				<Alert type="warning" showIcon message={t('ai.run.problems')} description={fix.problems.join(' · ')} />
			)}
			{headers.length > 0 && (
				<div data-testid="ai-run-proposed-headers">
					<div className="aiRunLabel">{t('ai.run.changedHeaders')}</div>
					<ul className="aiRunHeaderChanges">
						{headers.map(({ name, before, after }) => (
							<li key={name}>
								<code>{name}</code>: {before === null ? <span className="aiRunHeaderNew">{t('ai.run.newHeader')}</span> : <del>{before}</del>}
								{' → '}<code className="aiRunHeaderAfter">{after}</code>
							</li>
						))}
					</ul>
				</div>
			)}
			{isBodyChanged && (
				<div className="aiRunBodies">
					<div>
						<div className="aiRunLabel">{t('ai.run.currentBody')}</div>
						<pre className="aiRunBody">{currentBody}</pre>
					</div>
					<div>
						<div className="aiRunLabel">{t('ai.run.proposedBody')}</div>
						<pre className="aiRunBody aiRunBody--proposed" data-testid="ai-run-proposed-body">{prettyBody(fix.body)}</pre>
					</div>
				</div>
			)}
			{/* Nothing to apply leaves only the advice, closed like a message. */}
			<div className="aiRunActions">
				{isUnchanged ? (
					<Button onClick={onDiscard} testId="ai-run-dismiss">{t('ai.run.dismiss')}</Button>
				) : (
					<>
						{isLocked ? (
							<Tooltip content={t('ai.run.applyLocked')}>
								<span><Button type="primary" disabled testId="ai-run-apply">{t('ai.run.apply')}</Button></span>
							</Tooltip>
						) : (
							<Button type="primary" onClick={onApply} testId="ai-run-apply">{t('ai.run.apply')}</Button>
						)}
						<Button onClick={onDiscard} testId="ai-run-discard">{t('ai.run.discard')}</Button>
					</>
				)}
			</div>
		</div>
	);
}
