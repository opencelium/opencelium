import { Button, Modal } from 'antd';
import { Provider } from 'react-redux';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LiveInspectHint } from '../utils/LiveInspectHint';
import { MethodConfigDialogEditor } from './MethodConfigDialogEditors';
import type { MethodConfigDialogProps } from './MethodConfigDialog.types';
import { useMethodConfigDialogState } from './useMethodConfigDialogState';
import '../../dialogHeader.css';
import { useMaximizableModal } from '../../dialog-maximize/useMaximizableModal';

export function MethodConfigDialog(props: MethodConfigDialogProps) {
	const { open, node, mode } = props;
	const { t } = useI18n('workflow');
	const { store, persistCurrentConfig } = useMethodConfigDialogState(props);
	const isUrlMode = mode === 'url';
	// Body and header already open at almost the full viewport; only the URL editor gets the toggle.
	const { modalProps, toggle: maximizeToggle } = useMaximizableModal({
		open: open && !!node,
		layout: isUrlMode ? { width: 1180, className: 'wfDialog' } : { width: '94vw', style: { top: 18 }, className: 'wfDialog' },
		testId: 'workflow-method-dialog-maximize',
		isEnabled: isUrlMode,
	});

	if (!open || !node) return null;
	const title = mode === 'body' ? t('methodConfig.body')
		: mode === 'header' ? t('methodConfig.header') : t('methodConfig.requestUrl');

	return (
		<Modal
			open={open}
			onCancel={persistCurrentConfig}
			{...modalProps}
			destroyOnHidden
			title={title}
			closeIcon={<span className='wfDialogClose'>×</span>}
			styles={{
				body: {
					paddingTop: 8,
					...(!isUrlMode ? { height: 'calc(100vh - 191px)', overflow: 'hidden' } : null),
				},
			}}
			footer={[
				<Button key='close' type='primary' onClick={persistCurrentConfig}
					data-testid='workflow-method-dialog-close'>
					{t('actions.close')}
				</Button>,
			]}
		>
			{maximizeToggle}
			{/* Flex column rather than the editor owning the fixed height directly:
			    the hint above it appears only while a run is paused, and the editor
			    has to give that row its space instead of overflowing the dialog. */}
			<div data-testid={`workflow-method-dialog-${mode}`}
				style={{
					display: 'flex',
					flexDirection: 'column',
					height: !isUrlMode ? 'calc(100vh - 199px)' : undefined,
				}}>
				<LiveInspectHint />
				<div style={!isUrlMode ? { flex: 1, minHeight: 0 } : undefined}>
					<Provider store={store}>
						<MethodConfigDialogEditor mode={mode} nodeId={node.id} />
					</Provider>
				</div>
			</div>
		</Modal>
	);
}
