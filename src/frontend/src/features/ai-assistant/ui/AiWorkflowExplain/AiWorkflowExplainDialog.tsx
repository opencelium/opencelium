import { useEffect, useState } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { useExplainWorkflowMutation } from '../../api/aiApi';
import { buildWorkflowOutline } from '../../explain/workflowOutline';
import type { WorkflowExplanation } from '../../model/aiGateway.types';
import { AiExpectedTime } from '../AiExpectedTime/AiExpectedTime';
import '../../styles/ai-explain.css';

type Props = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	title: string;
	onUseDescription: (description: string) => void;
	onClose: () => void;
};

/** The workflow explained step by step, with a proposed description the user can edit before using it. */
export function AiWorkflowExplainDialog({ nodes, edges, title, onUseDescription, onClose }: Props) {
	const { t, lang } = useI18n('workflow');
	const [explain] = useExplainWorkflowMutation();
	const [result, setResult] = useState<WorkflowExplanation | null>(null);
	const [isFailed, setIsFailed] = useState(false);
	const [description, setDescription] = useState('');

	// The graph as it was when the dialog opened; edits made while it is open are not chased.
	useEffect(() => {
		// Cleanup aborts the request (StrictMode does so right after the first mount); that abort is not a failure.
		let isCancelled = false;
		const request = explain({ language: lang.startsWith('de') ? 'de' : 'en', title, outline: buildWorkflowOutline(nodes, edges) });
		void request.unwrap()
			.then((answer) => {
				if (isCancelled) return;
				setResult(answer);
				setDescription(answer.description);
			})
			.catch((error: unknown) => {
				if (isCancelled) return;
				console.error(error);
				setIsFailed(true);
			});
		return () => {
			isCancelled = true;
			request.abort();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- one explanation per opening
	}, []);

	const footer = (
		<>
			<Button onClick={onClose} testId="ai-explain-close">{t('ai.explain.close')}</Button>
			<Button type="primary" disabled={!description.trim()} onClick={() => onUseDescription(description.trim())}
				testId="ai-explain-use">{t('ai.explain.use')}</Button>
		</>
	);

	return (
		<Dialog open onClose={onClose} title={t('ai.explain.title')} footer={footer} width={640} testId="ai-explain-dialog">
			{!result && !isFailed && (
				<div className="aiExplainLoading"><Loading size="sm" inline /> {t('ai.explain.working')} <AiExpectedTime feature="workflowExplain" /></div>
			)}
			{isFailed && <Alert type="error" showIcon message={t('ai.explain.failed')} />}
			{result && (
				<div className="aiExplain">
					<div className="aiExplainLabel">{t('ai.explain.whatItDoes')}</div>
					<ol className="aiExplainSteps" data-testid="ai-explain-steps">
						{result.explanation.map((step) => <li key={step}>{step}</li>)}
					</ol>
					<div className="aiExplainLabel">{t('ai.explain.description')}</div>
					<Textarea value={description} onChange={(event) => setDescription(event.target.value)} testId="ai-explain-description" />
				</div>
			)}
		</Dialog>
	);
}
