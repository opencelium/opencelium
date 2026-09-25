import { Button, Input, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { SaveConnectionTemplateDialogProps } from './SaveConnectionTemplateDialog.types';

export const SaveConnectionTemplateDialog = ({ open, name, description,
	nameError, loading, onNameChange, onDescriptionChange, onClearNameError,
	onClose, onSave }: SaveConnectionTemplateDialogProps) => {
	const { t } = useI18n('workflow');
	return <Modal open={open} title={t('template.addTitle')} onCancel={onClose}
		destroyOnHidden width={520} footer={[
			<Button key='cancel' onClick={onClose} disabled={loading}
				data-testid='workflow-save-template-cancel'>{t('actions.cancel')}</Button>,
			<Button key='ok' type='primary' loading={loading} onClick={onSave}
				data-testid='workflow-save-template-ok'>{t('actions.ok')}</Button>,
		]}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
			<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
				<span>{t('template.nameLabel')}
					<span style={{ color: 'var(--color-status-error-fg)' }}> *</span>
				</span>
				<Input autoFocus maxLength={255} value={name}
					status={nameError ? 'error' : undefined}
					onChange={(event) => {
						onNameChange(event.target.value);
						if (nameError) onClearNameError();
					}}
					onPressEnter={onSave} showCount data-testid='workflow-save-template-name' />
				{nameError ? <span style={{ color: 'var(--color-status-error-fg)', fontSize: 12 }}>
					{nameError}</span> : null}
			</label>
			<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
				<span>{t('description.label')}</span>
				<div style={{ position: 'relative' }}>
					<Input.TextArea maxLength={5000} rows={4} value={description}
						onChange={(event) => onDescriptionChange(event.target.value)}
						style={{ paddingBottom: 26 }}
						data-testid='workflow-save-template-description' />
					<span style={{ position: 'absolute', right: 12, bottom: 6,
						color: 'var(--color-text-secondary)', pointerEvents: 'none' }}>
						{description.length} / 5000</span>
				</div>
			</label>
		</div>
	</Modal>;
};
