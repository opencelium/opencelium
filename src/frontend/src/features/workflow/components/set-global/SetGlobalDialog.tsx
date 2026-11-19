import { useMemo, useState } from 'react';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Button } from '@shared/ui/primitives/Button';
import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { GlobalVariableSelect } from '@entities/globalVariable/ui/picker/GlobalVariableSelect';
import type { PickerItem } from '@entities/globalVariable/model/types';
import type { Connection } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel, WorkflowSetGlobalConfig } from '../../types/workflow.types';
import { ConditionValueInput } from '../condition-builder/ConditionValueInput/ConditionValueInput';
import { buildNodeBackedMethods, getPreviousIterators, getSourceMethods } from '../condition-builder/conditionBuilderDialog.utils';
import '../request-editor/body-editor/bodyLegacy.css';
import '../condition-builder/conditionBuilder.css';

type Props = {
	open: boolean;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	connection: Connection;
	onClose: () => void;
	onSave: (nodeId: string, config: WorkflowSetGlobalConfig) => void;
};

// Only a mutable variable this workflow owns or may claim can be written (contract §8, `writable`).
const isWritable = (item: PickerItem) => item.kind === 'MUTABLE' && item.writable;

export function SetGlobalDialog({ open, node, nodes, edges, connection, onClose, onSave }: Props) {
	if (!open || node?.type !== 'setglobal') return null;
	// Keyed by node so each opening starts from that step's saved config.
	return <SetGlobalDialogContent key={node.id} node={node} nodes={nodes} edges={edges}
		connection={connection} onClose={onClose} onSave={onSave} />;
}

function SetGlobalDialogContent({ node, nodes, edges, connection, onClose, onSave }: Omit<Props, 'open' | 'node'> & {
	node: WorkflowNodeModel;
}) {
	const { t } = useI18n('workflow');
	const [variable, setVariable] = useState(node.data.setGlobal?.variable);
	const [value, setValue] = useState(node.data.setGlobal?.value ?? '');
	const methods = useMemo(() => getSourceMethods(connection, nodes, edges, node), [connection, edges, node, nodes]);
	const allMethods = useMemo(() => buildNodeBackedMethods(connection.fromConnector.method, nodes),
		[connection.fromConnector.method, nodes]);
	const iterators = useMemo(() => getPreviousIterators(connection, node), [connection, node]);
	const canSave = !!variable && value.trim() !== '';

	return (
		<Dialog
			open
			onClose={onClose}
			title={t('setGlobal.dialogTitle')}
			width={720}
			top={18}
			testId="workflow-setglobal-dialog"
			footer={
				<Button type="primary" disabled={!canSave} testId="workflow-setglobal-save"
					onClick={() => variable && onSave(node.id, { variable, value: value.trim() })}>
					{t('setGlobal.save')}
				</Button>
			}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				<div className="bodyLegacyEnhancementLabel">{t('setGlobal.variable')}</div>
				<GlobalVariableSelect value={variable} onChange={setVariable} filter={isWritable}
					testId="workflow-setglobal-variable" />
				<div className="bodyLegacyEnhancementLabel">{t('setGlobal.value')}</div>
				<div className="conditionBuilderModal">
					<ConditionValueInput side="left" properties={{ leftField: value }} methods={methods}
						allMethods={allMethods} iterators={iterators}
						onChange={(patch) => setValue(patch.leftField ?? '')} />
				</div>
				<Hint noPrefix>{t('setGlobal.hint')}</Hint>
			</div>
		</Dialog>
	);
}
