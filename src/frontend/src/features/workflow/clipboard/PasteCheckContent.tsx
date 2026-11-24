import { useState } from 'react';
import { Select } from '@shared/ui/primitives/Select';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceRemapChoices } from '../components/reference-remap/ReferenceRemapChoices';
import type { ReferenceRemapPlan } from '../utils/graph.referenceRemap';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { prepareClipboardPaste } from './clipboardGraph';
import './paste-check.css';

type WorkflowConnectorRef = NonNullable<WorkflowNodeModel['data']['connector']>;
export type ConnectorChoice = { node: WorkflowNodeModel; options: WorkflowConnectorRef[] };

type Props = {
	preview: ReturnType<typeof prepareClipboardPaste>;
	choices: ConnectorChoice[];
	blocked: WorkflowNodeModel[];
	onConnector: (id: string, connector: WorkflowConnectorRef) => void;
	onRemap: (plan: ReferenceRemapPlan) => void;
};

export function PasteCheckContent({ preview, choices, blocked, onConnector, onRemap }: Props) {
	const { t } = useI18n('workflow');
	const [selected, setSelected] = useState<Record<string, number>>({});
	const isNothingPasteable = !preview.nodes.some((node) => preview.insertedIds.has(node.id));
	return (
		<div className='pasteCheck' data-testid='workflow-node-paste-check-dialog'>
			<Typography variant='body'>{t(isNothingPasteable ? 'pasteCheck.nothingToPaste' : 'pasteCheck.intro')}</Typography>
			{blocked.length > 0 && (
				<ul className='pasteCheckBlocked'>
					{blocked.map((node) => (
						<li key={node.id}>
							<Typography variant='body' isDanger>
								{t('pasteCheck.unavailable', { name: node.data.subtitle || node.data.title, connector: node.data.connector?.title ?? '—' })}
							</Typography>
						</li>
					))}
				</ul>
			)}
			{choices.map(({ node, options }) => (
				<div key={node.id} className='pasteCheckConnector'>
					<Typography variant='label'>{t('pasteCheck.connector', { name: node.data.subtitle || node.data.title })}</Typography>
					<Select value={selected[node.id] ?? options[0]?.connectorId}
						testId={`workflow-paste-check-connector-${node.id}`}
						options={options.map((connector) => ({ value: connector.connectorId, label: connector.title }))}
						onChange={(value) => {
							const connector = options.find((item) => item.connectorId === value);
							if (!connector) return;
							setSelected((current) => ({ ...current, [node.id]: connector.connectorId }));
							onConnector(node.id, connector);
						}} />
				</div>
			))}
			{preview.targets.length > 0 && (
				<ReferenceRemapChoices intro={t('pasteCheck.referencesIntro')} targets={preview.targets}
					before={preview.before} after={preview} onChange={onRemap} />
			)}
		</div>
	);
}
