import { Provider } from 'react-redux';
import { CloseOutlined } from '@ant-design/icons';
import { Button } from '@shared/ui/primitives/Button';
import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { MethodColorDot } from '../../components/MethodColorDot/MethodColorDot';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { BindingDrawerEditor } from './BindingDrawerEditor';
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
	onOpenMethodEditor: (nodeId: string, mode: 'body' | 'header') => void;
};

export function BindingDrawer({ selectedKey, nodes, edges, fieldBindings, readOnly,
	onFieldBindingsChange, onClose, onOpenMethodEditor }: BindingDrawerProps) {
	const { t } = useI18n('workflow');
	const binding = useSelectedBinding({ nodes, edges, fieldBindings, selectedKey });
	// A reference living in the field's own value has no enhancement to seed an
	// editor with, so the store stays untouched for it — the drawer explains where
	// it lives and hands over to the method editor instead.
	const enhancementBinding = binding?.source.kind === 'enhancement' ? binding : null;
	const { store, persist, deleteEnhancement } = useBindingDrawerStore({
		nodes, edges, fieldBindings, binding: enhancementBinding, onFieldBindingsChange,
	});

	const isOpen = !!selectedKey && !!binding;
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
						<div className='drawerHeader'>
							<div className='drawerHeaderContent'>
								<div>
									<div className='drawerTitle'>{t('bindingLens.drawerTitle')}</div>
									<div className='drawerSubTitle'>
										{/* The colour as a swatch, not as the name's own colour — see
										    BindingTableEndpoint for why that hides a method name. */}
										<span className='bindingDrawerMethod'>
											<MethodColorDot color={binding.provider.color} size={8} />
											{binding.provider.label ?? t('bindingLens.unknownMethod')}
										</span>
										{` ${binding.provider.path} → `}
										{binding.consumer.label ?? t('bindingLens.unknownMethod')}
										{` ${binding.consumer.path}`}
									</div>
								</div>
							</div>
							<button className='iconButton' type='button' onClick={close}
								data-testid='workflow-binding-drawer-close'>
								<CloseOutlined />
							</button>
						</div>
						<div className='drawerBody bindingDrawerBody'>
							{binding.source.kind === 'value' ? (
								<div className='bindingDrawerNote'>
									<Hint noPrefix>{t('bindingLens.drawerValueReference')}</Hint>
								</div>
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
								{t('bindingLens.openInMethodEditor')}
							</Button>
						</div>
					</>
				)}
			</aside>
		</>
	);
}
