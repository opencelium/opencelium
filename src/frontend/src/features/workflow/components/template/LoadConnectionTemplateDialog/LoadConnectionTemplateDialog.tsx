import { Button, Modal, Select } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LoadConnectionTemplateDialogProps } from './LoadConnectionTemplateDialog.types';

export const LoadConnectionTemplateDialog = ({ open, templates, selectedId,
	loading, uploading, applying, onSelect, onUpload, onClose,
	onLoad }: LoadConnectionTemplateDialogProps) => {
	const { t } = useI18n('workflow');
	const { t: tEntities } = useI18n('entities');
	return <Modal open={open} title={t('template.loadTitle')} onCancel={onClose}
		destroyOnHidden width={520} footer={
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<Button loading={uploading} disabled={applying} onClick={onUpload}
					data-testid='workflow-load-template-upload'>
					{tEntities('connection-template.list.upload.button')}
				</Button>
				<div style={{ display: 'flex', gap: 8 }}>
					<Button onClick={onClose} disabled={applying}
						data-testid='workflow-load-template-cancel'>{t('actions.cancel')}</Button>
					<Button type='primary' loading={applying} onClick={onLoad}
						data-testid='workflow-load-template-load'>{t('actions.load')}</Button>
				</div>
			</div>}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
			<div style={{ color: 'var(--color-text-secondary)' }}>{t('template.loadWarning')}</div>
			<Select autoFocus loading={loading} value={selectedId}
				placeholder={t('template.selectPlaceholder')}
				data-testid='workflow-load-template-select' onChange={onSelect}
				options={templates.map((template) => ({
					value: String(template.templateId),
					label: template.description
						? `${template.name ?? template.templateId} - ${template.description}`
						: String(template.name ?? template.templateId),
				}))}
				showSearch={{ filterOption: (input, option) =>
					String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }}
				style={{ width: '100%' }} />
		</div>
	</Modal>;
};
