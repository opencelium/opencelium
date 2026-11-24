import { useState, type ReactNode } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../request-editor/body-editor/BodyPointer/BodyPointer.css';

type Props = {
	children: ReactNode;
	onEdit?: () => void;
	onRemove?: () => void;
	testId?: string;
};

/** The chip's hover bar — Edit / Delete — in the same look and with the same confirm as in body and header. */
export function ReferenceChipActions({ children, onEdit, onRemove, testId }: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [isHovered, setHovered] = useState(false);
	const remove = async () => {
		const isConfirmed = await confirm({
			title: t('references.confirmDelete.title'),
			message: t('references.confirmDelete.message'),
		});
		if (isConfirmed) onRemove?.();
	};
	return (
		<span className='bodyReferenceMenuHost' data-testid={testId}
			onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
			{children}
			{isHovered && (onEdit || onRemove) ? (
				<span className='bodyPointerMenu'>
					<span className='bodyPointerMenuList'>
						{onEdit && (
							<button type='button' className='bodyPointerMenuItem' data-testid={testId && `${testId}-edit`} onClick={onEdit}>
								<EditOutlined style={{ fontSize: 12 }} />
								{t('actions.edit')}
							</button>
						)}
						{onRemove && (
							<button type='button' className='bodyPointerMenuItem bodyPointerMenuItem--danger'
								data-testid={testId && `${testId}-delete`} onClick={() => void remove()}>
								<DeleteOutlined style={{ fontSize: 12 }} />
								{t('actions.delete')}
							</button>
						)}
					</span>
				</span>
			) : null}
		</span>
	);
}
