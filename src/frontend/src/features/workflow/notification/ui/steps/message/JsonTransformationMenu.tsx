import { Popover } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import type { JsonTransformTarget } from '../../../model/notificationTransformTargets';
import { useNotificationTransformations } from '../../transformation/notificationTransformationContextValue';

/** Where the menu opens: the gutter mark of the line, in viewport coordinates. */
export type JsonTransformationMenuAnchor = { left: number; top: number; height: number };

export type JsonTransformationMenuState = { enhanceId: string; target: JsonTransformTarget; anchor: JsonTransformationMenuAnchor };

type Props = { menu: JsonTransformationMenuState | null; onClose: () => void };

/** What a transformed JSON value offers from its gutter mark: its script, or taking it away. */
export function JsonTransformationMenu({ menu, onClose }: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const { setOpenEditorId, remove, isReadOnly } = useNotificationTransformations();
	if (!menu) return null;

	const removeTransformation = async () => {
		onClose();
		const isConfirmed = await confirm({
			title: t('enhancement.confirmDelete.title'),
			message: t('enhancement.confirmDelete.message'),
		});
		if (isConfirmed) remove(menu.target);
	};

	return (
		<Popover open placement='rightTop' arrow={false} trigger='click' styles={{ container: { padding: 4 } }}
			onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
			content={
				<div className='notificationJsonMarkMenu' data-testid='notification-json-mark-menu'>
					<Button type='text' testId='notification-json-mark-edit' onClick={() => {
						onClose();
						setOpenEditorId(menu.enhanceId);
					}}>
						<span className='notificationJsonMarkMenuItem'>
							<Icon name='edit' size={16} color='primary' />
							{t('notification.transformation.editScript')}
						</span>
					</Button>
					{!isReadOnly && (
						<Button type='text' testId='notification-json-mark-remove' onClick={() => void removeTransformation()}>
							<span className='notificationJsonMarkMenuItem'>
								<Icon name='unlink' size={16} color='danger' />
								{t('notification.transformation.remove')}
							</span>
						</Button>
					)}
				</div>
			}>
			<span aria-hidden style={{ position: 'fixed', left: menu.anchor.left, top: menu.anchor.top,
				width: 1, height: menu.anchor.height, pointerEvents: 'none' }} />
		</Popover>
	);
}
