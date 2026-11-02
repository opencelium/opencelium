import { useState } from 'react';
import { Select } from '@shared/ui/primitives/Select';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceRemapChoices } from '../components/reference-remap/ReferenceRemapChoices';
import type { ReferenceRemapPlan } from '../utils/graph.referenceRemap';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { prepareClipboardPaste } from './clipboardGraph';
import './paste-check.css';
export type ConnectorChoice = {node: WorkflowNodeModel; options: NonNullable<WorkflowNodeModel['data']['connector']>[]};
type Props = {
    preview: ReturnType<typeof prepareClipboardPaste>;
    choices: ConnectorChoice[];
    blocked: WorkflowNodeModel[];
    onConnector: (id: string, connector: NonNullable<WorkflowNodeModel['data']['connector']>) => void;
    onRemap: (plan: ReferenceRemapPlan) => void;
};
export function PasteCheckContent({preview, choices, blocked, onConnector, onRemap}: Props) {
    const {t} = useI18n('workflow');
    const [selected, setSelected] = useState<Record<string, number>>({});
    return <div className="pasteCheck" data-testid="workflow-node-paste-check-dialog">
        <p>{t('pasteCheck.intro')}</p>
        {blocked.map((node) => <p key={node.id}>{t('pasteCheck.unavailable', {
            name: node.data.title, invoker: node.data.connector?.invokerName ?? '—',
        })}</p>)}
        {choices.map(({node, options}) => <div key={node.id}>
            <p>{t('pasteCheck.connector', {name: node.data.title})}</p>
            <Select value={selected[node.id] ?? options[0]?.connectorId}
                options={options.map((connector) => ({value: connector.connectorId, label: connector.title}))}
                onChange={(value) => {
                    const connector = options.find((item) => item.connectorId === value);
                    if (!connector) return;
                    setSelected((current) => ({...current, [node.id]: value}));
                    onConnector(node.id, connector);
                }} />
        </div>)}
        {preview.targets.length > 0 && <ReferenceRemapChoices intro={t('pasteCheck.referencesIntro')} targets={preview.targets}
            before={preview.before} after={preview} onChange={onRemap} />}
    </div>;
}
