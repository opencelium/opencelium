import { Button, Modal } from 'antd';
import { LoopInfoPanel } from './LoopInfoPanel/LoopInfoPanel';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../request-editor/body-editor/bodyLegacy.css';
import '../dialogHeader.css';
import './conditionBuilder.css';
import { GroupEditor } from './GroupEditor/GroupEditor';
import type { ConditionBuilderDialogProps } from './ConditionBuilderDialog.types';
import { useConditionBuilderDialog } from './useConditionBuilderDialog';


export function ConditionBuilderDialog({
	open,
	node,
	nodes,
	edges,
	connection,
	onClose,
	onSave,
}: ConditionBuilderDialogProps) {
	const { t } = useI18n('workflow');
	const state = useConditionBuilderDialog({ open, node, nodes, edges, connection, onClose, onSave });

	return (
		<Modal
			open={open}
			destroyOnHidden
			focusable={{ focusTriggerAfterClose: false }}
			title={t(state.isLoop ? 'conditionBuilder.dialogTitleLoop' : 'conditionBuilder.dialogTitleIf')}
			width="90vw"
			centered={false}
			className={`wfDialog conditionBuilderModal conditionBuilderModal-${state.operatorType}`}
			closeIcon={<span className="wfDialogClose">×</span>}
			onCancel={onClose}
			footer={[
				<Button
					key="save"
					type="primary"
					disabled={!node}
					data-testid="workflow-condition-save"
					onClick={state.save}
				>
					{t('actions.save')}
				</Button>,
			]}
		>
			<div key={state.renderKey} className="conditionBuilder" data-testid="workflow-condition-builder">
				<GroupEditor
					group={state.tree} operatorType={state.operatorType} methods={state.methods}
					allMethods={state.allMethods} iterators={state.iterators} onChange={state.setTree}
				/>
				{state.isLoop ? (
					<LoopInfoPanel
						iterator={state.loopIterator} operator={state.loopOperator} example={state.loopExample}
					/>
				) : null}
			</div>
		</Modal>
	);
}
