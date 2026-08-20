import { useState } from 'react';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useGeneralRequestMutation } from '@shared/api/genericApi';
import type { ScheduleCardItem } from './ScheduleCard.types';

export function useScheduleCardDelete(schedule: ScheduleCardItem['schedule']) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [generalRequest] = useGeneralRequestMutation();
	const [deleting, setDeleting] = useState(false);
	const deleteSchedule = async () => {
		const ok = await confirm({ title: t('schedules.delete.title'),
			message: t('schedules.delete.message', { title: schedule.title }),
			confirmVariant: 'danger', onConfirm: async () => {
				setDeleting(true);
				try { await generalRequest({ url: `/scheduler/${schedule.schedulerId}`,
					method: 'DELETE', options: {} }).unwrap(); }
				finally { setDeleting(false); }
			} });
		if (ok) message.success(t('schedules.delete.success', { title: schedule.title }));
	};
	return { deleting, deleteSchedule };
}
