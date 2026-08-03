import { Button, Modal } from 'antd';
import { Provider } from 'react-redux';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { MethodConfigDialogEditor } from './MethodConfigDialogEditors';
import type { MethodConfigDialogProps } from './MethodConfigDialog.types';
import { useMethodConfigDialogState } from './useMethodConfigDialogState';
import '../../dialogHeader.css';

export function MethodConfigDialog(props: MethodConfigDialogProps) {
	const { open, node, mode } = props;
	const { t } = useI18n('workflow');
	const { store, persistCurrentConfig } = useMethodConfigDialogState(props);

	if (!open || !node) return null;
	const title = mode === 'body' ? t('methodConfig.body')
		: mode === 'header' ? t('methodConfig.header') : t('methodConfig.requestUrl');
	const isUrlMode = mode === 'url';

	return (
		<Modal
			open={open}
			onCancel={persistCurrentConfig}
			width={isUrlMode ? 1180 : '94vw'}
			style={!isUrlMode ? { top: 18 } : undefined}
			destroyOnHidden
			title={title}
			className='wfDialog'
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
			<div data-testid={`workflow-method-dialog-${mode}`}
				style={{ height: !isUrlMode ? 'calc(100vh - 199px)' : undefined }}>
				<Provider store={store}>
					<MethodConfigDialogEditor mode={mode} nodeId={node.id} />
				</Provider>
			</div>
		</Modal>
	);
}
