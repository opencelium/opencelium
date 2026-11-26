import { useRef } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { notifyError } from '@shared/ui/feedback/notifyError';
import type { NotificationConfig, NotificationEditorState } from '../../model/notification.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { NotificationReferenceProvider } from '../references/NotificationReferenceContext';
import { NotificationDialogHeader } from './NotificationDialogHeader';
import { NotificationDialogFooter } from './NotificationDialogFooter';
import { NotificationStepNav } from './NotificationStepNav';
import { NotificationStepContent } from './NotificationStepContent';
import { useNotificationDialog } from './useNotificationDialog';
import { useNotificationTestSend } from '../test/useNotificationTestSend';
import { NotificationTransformationProvider } from '../transformation/NotificationTransformationProvider';
import { useTransformationState } from '../transformation/useTransformationState';
import './notificationDialog.css';

export type NotificationDialogProps = {
	editor: NotificationEditorState | null;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	isReadOnly?: boolean;
	onClose: () => void;
	/** `fieldBindings` is null when the dialog left the page's bindings as they were. */
	onSave: (nodeId: string, label: string, config: NotificationConfig, fieldBindings: unknown[] | null) => void;
};

export function NotificationDialog(props: NotificationDialogProps) {
	const { editor, node } = props;
	if (!editor || !node || node.type !== 'notification') return null;
	// Keyed so every opening starts from the node's saved state, not a leftover draft.
	return (
		<NotificationReferenceProvider nodeId={node.id} nodes={props.nodes} edges={props.edges} fieldBindings={props.fieldBindings}>
			<NotificationDialogContent key={`${node.id}-${JSON.stringify(editor.target)}`} {...props} editor={editor} node={node} />
		</NotificationReferenceProvider>
	);
}

type ContentProps = NotificationDialogProps & { editor: NotificationEditorState; node: WorkflowNodeModel };

function NotificationDialogContent({ editor, node, nodes, edges, isReadOnly, onClose, onSave }: ContentProps) {
	const { t } = useI18n('workflow');
	const labelInputRef = useRef<HTMLInputElement>(null);
	const state = useNotificationDialog({ rawConfig: node.data.notification, initialLabel: node.data.subtitle || node.data.title,
		target: editor.target });
	const testSend = useNotificationTestSend({ node, config: state.config, nodes, edges });
	const transformations = useTransformationState(state.config);

	const apply = () => {
		if (!state.isBodyValid()) {
			notifyError(t('notification.message.invalidJsonOnApply'));
			state.goTo(3);
			return;
		}
		onSave(node.id, state.label.trim() || node.data.title, state.config, transformations.collectBindings(state.config));
	};

	return (
		<Dialog open onClose={onClose} width={1180} top={18} maximizable testId='notification-dialog'
			afterOpenChange={(isOpen) => {
				if (!isOpen || editor.target.kind !== 'rename') return;
				labelInputRef.current?.focus();
				labelInputRef.current?.select();
			}}
			title={<NotificationDialogHeader color={node.data.color} toolId={state.config.tool}
				label={state.label} inputRef={labelInputRef} isReadOnly={isReadOnly} onLabelChange={state.setLabel} />}
			footer={<NotificationDialogFooter step={state.step} hasTool={state.hasTool} isReadOnly={isReadOnly}
				onBack={state.back} onNext={state.next} onApply={apply} />}>
			<NotificationTransformationProvider state={transformations} isReadOnly={!!isReadOnly}>
				<div className='notificationDialog'>
					<NotificationStepNav state={state} />
					<NotificationStepContent state={state} nodeColor={node.data.color} testSend={testSend} />
				</div>
			</NotificationTransformationProvider>
		</Dialog>
	);
}
