import { Provider, useSelector } from 'react-redux';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Dialog } from '@shared/ui/primitives/Dialog';
import ReferenceEnhancement from '../../../components/request-editor/enhancement/Enhancement/Enhancement';
import { MethodProvider } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import { useNotificationTransformations } from './notificationTransformationContextValue';

type Props = { enhanceId: string; fieldLabel: string; onDelete: () => void; onClose: () => void };

function StoreEnhancement({ enhanceId, onDelete }: Pick<Props, 'enhanceId' | 'onDelete'>) {
	const { method, isReadOnly } = useNotificationTransformations();
	// Read from the dialog's store, not the page's bindings, so the editor shows its own edits.
	const enhancement = useSelector((state: RootState) => state.connection.connection?.fieldBindings
		.find((binding) => binding.enhancement?.enhanceId === enhanceId)?.enhancement);
	if (!enhancement || !method) return null;
	return (
		<MethodProvider value={{ method }}>
			<ReferenceEnhancement enhancement={enhancement} readOnly={isReadOnly}
				onDeleteEnhancement={isReadOnly ? undefined : onDelete} />
		</MethodProvider>
	);
}

/**
 * The method body editor's script editor, seeded from the notification dialog's own legacy store.
 * A dialog of its own: a fact value or a button URL is far too narrow to hold it inline.
 */
export function TransformationEditor({ enhanceId, fieldLabel, onDelete, onClose }: Props) {
	const { t } = useI18n('workflow');
	const { store } = useNotificationTransformations();
	return (
		<Dialog open onClose={onClose} width={1000} top={18} testId='notification-transformation-dialog'
			title={t('notification.transformation.dialogTitle', { field: fieldLabel })}
			footer={<Button type='primary' onClick={onClose} testId='notification-transformation-done'>{t('notification.transformation.done')}</Button>}>
			<div className='notificationTransformEditor'>
				<Provider store={store}>
					<StoreEnhancement enhanceId={enhanceId} onDelete={() => {
						onDelete();
						onClose();
					}} />
				</Provider>
			</div>
		</Dialog>
	);
}
