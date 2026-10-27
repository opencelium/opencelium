import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { AiWorkflowIssue } from '../../model/aiGateway.types';
import { type Assignment, type ConnectorSide, type FieldAssignment, type MethodStep, UNARY_CONDITION_OPS, type WorkflowStep } from '../../model/workflowDsl.schema';
import type { AiConnectorChoice } from '../../utils/aiConnectors.utils';
import { type DslPreview, issuesForAssignment } from '../../utils/dslPreview.utils';
import { AiValue } from './AiValue';

export type ConnectorLookup = Record<ConnectorSide, AiConnectorChoice | undefined>;

type TreeProps = {
	steps: WorkflowStep[];
	preview: DslPreview;
	connectors: ConnectorLookup;
	issues: AiWorkflowIssue[];
};

export function AiStepTree({ steps, ...rest }: TreeProps) {
	return (
		<ul className="aiStepTree">
			{steps.map((step) => <AiStepItem key={step.id} step={step} {...rest} />)}
		</ul>
	);
}

type ItemProps = Omit<TreeProps, 'steps'> & { step: WorkflowStep };

function AiStepItem({ step, preview, connectors, issues }: ItemProps) {
	const { t } = useI18n('workflow');
	const nested = { preview, connectors, issues };

	switch (step.kind) {
		case 'method':
			return <AiMethodItem step={step} {...nested} />;
		case 'loop':
			return (
				<li className="aiStep" data-testid={`ai-step-${step.id}`}>
					<div className="aiStepRow">
						<Icon name="loop" size={14} color="inherit" />
						<span className="aiStepName">{t('ai.result.loop')}</span>
						<span className="aiStepMuted">{t('ai.result.over')}</span>
						<AiValue value={preview.describeLoopSource(step)} />
					</div>
					<AiStepTree steps={step.body} {...nested} />
				</li>
			);
		case 'if':
			return (
				<li className="aiStep" data-testid={`ai-step-${step.id}`}>
					<div className="aiStepRow">
						<Icon name="if" size={14} color="inherit" />
						<span className="aiStepName">{t('ai.result.if')}</span>
					</div>
					<div className="aiStepCondition">
						<AiValue value={preview.describeValue(step.condition.left)} />
						<span className="aiStepMuted">{t(`ai.result.ops.${step.condition.op}`)}</span>
						{!UNARY_CONDITION_OPS.has(step.condition.op) && <AiValue value={preview.describeValue(step.condition.right)} />}
					</div>
					<AiStepTree steps={step.then} {...nested} />
				</li>
			);
		default: {
			const _exhaustive: never = step;
			return _exhaustive;
		}
	}
}

function AiMethodItem({ step, preview, connectors, issues }: Omit<ItemProps, 'step'> & { step: MethodStep }) {
	const connector = connectors[step.connector];
	const assignments: (Assignment | FieldAssignment)[] = [...step.params, ...step.fields];

	return (
		<li className="aiStep" data-testid={`ai-step-${step.id}`}>
			<div className="aiStepRow">
				{connector && <ConnectorIcon icon={connector.icon} size={18} isCircled />}
				<span className="aiStepName">{step.operation}</span>
				{connector && <span className="aiStepMuted">{connector.title}</span>}
			</div>
			{assignments.length > 0 && (
				<ul className="aiAssignments">
					{assignments.map((assignment) => {
						const assignmentIssues = issuesForAssignment(issues, step.id, assignment.name);
						return (
							<li key={assignment.name} className="aiAssignment">
								<span className="aiAssignmentName">{assignment.name}</span>
								<span className="aiAssignmentArrow" aria-hidden>←</span>
								<AiValue value={preview.describeValue(assignment.value)} />
								{assignmentIssues.length > 0 && (
									<Tooltip content={assignmentIssues.map((issue) => issue.message).join('\n')}>
										<span className={`aiAssignmentIssue aiIssue--${assignmentIssues[0]?.severity}`}>
											<Icon name="warning" size={13} color="inherit" />
										</span>
									</Tooltip>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</li>
	);
}
