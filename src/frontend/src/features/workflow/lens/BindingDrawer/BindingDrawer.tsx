import { useMemo } from 'react';
import { Provider } from 'react-redux';
import { Button } from '@shared/ui/primitives/Button';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { BindingDrawerDirectReference } from './BindingDrawerDirectReference';
import { BindingDrawerEditor } from './BindingDrawerEditor';
import { BindingDrawerHeader } from './BindingDrawerHeader';
import { createValueBindingEnhancement } from './createValueBindingEnhancement';
import { useBindingDrawerStore } from './useBindingDrawerStore';
import { useSelectedBinding } from './useSelectedBinding';

export type BindingDrawerProps = {
	selectedKey: string | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	readOnly?: boolean;
	onFieldBindingsChange: (fieldBindings: unknown[]) => void;
	onClose: () => void;
	onSelectBinding: (bindingKey: string) => void;
	onOpenMethodEditor: (nodeId: string, mode: 'body' | 'header') => void;
};

export function BindingDrawer({ selectedKey, nodes, edges, fieldBindings, readOnly,
	onFieldBindingsChange, onClose, onSelectBinding, onOpenMethodEditor }: BindingDrawerProps) {
	const { t } = useI18n('workflow');
	const { binding, fieldBindings: sources } = useSelectedBinding({
		nodes, edges, fieldBindings, selectedKey });
	// A reference living in the field's own value has no enhancement to seed an
	// editor with, so the store stays untouched for it — the drawer explains where
	// it lives and hands over to the method editor instead.
	const enhancementBinding = binding?.source.kind === 'enhancement' ? binding : null;
	const { store, persist, deleteEnhancement } = useBindingDrawerStore({
		nodes, edges, fieldBindings, binding: enhancementBinding, onFieldBindingsChange,
	});

	const isOpen = !!selectedKey && !!binding;
	const created = useMemo(() => binding?.source.kind === 'value' && !readOnly
		? createValueBindingEnhancement(binding, nodes, fieldBindings)
		: null, [binding, fieldBindings, nodes, readOnly]);
	const close = () => {
		persist();
		onClose();
	};

	return (
		<>
			<div className={`drawerOverlay ${isOpen ? 'drawerOverlayOpen' : ''}`} onClick={close} />
			<aside
				data-testid='workflow-binding-drawer'
				className={`rightDrawer rightDrawerSecondary bindingDrawer ${isOpen ? 'rightDrawerOpen' : ''}`}
			>
				{isOpen && binding && (
					<>
						<BindingDrawerHeader consumer={binding.consumer} sources={sources} onClose={close} />
						<div className='drawerBody bindingDrawerBody'>
							{binding.source.kind === 'value' ? (
								<BindingDrawerDirectReference
									onCreateEnhancement={created ? () => {
										onFieldBindingsChange(created.fieldBindings);
										onSelectBinding(created.bindingKey);
									} : undefined}
								/>
							) : (
								<Provider store={store}>
									<BindingDrawerEditor
										enhanceId={binding.source.enhanceId}
										consumerNodeId={binding.consumer.nodeId as string}
										readOnly={readOnly}
										onDeleteEnhancement={() => {
											deleteEnhancement();
											onClose();
										}}
									/>
								</Provider>
							)}
						</div>
						<div className='bindingDrawerFooter'>
							<Button
								type='link'
								onClick={() => {
									persist();
									onOpenMethodEditor(binding.consumer.nodeId as string,
										binding.consumer.messageProperty === 'header' ? 'header' : 'body');
									onClose();
								}}
								testId='workflow-binding-drawer-open-editor'
							>
								{t('bindingLens.openInBodyEditor')}
							</Button>
						</div>
					</>
				)}
			</aside>
		</>
	);
}
