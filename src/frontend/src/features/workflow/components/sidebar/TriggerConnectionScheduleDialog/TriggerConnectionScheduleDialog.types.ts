import type { Schedule } from '@entities/schedule/model/types';

export type TriggerConnectionScheduleDialogProps = {
	open: boolean;
	connectionTitle: string;
	schedules: Schedule[];
	onCancel: () => void;
	onConfirm: (schedule: Schedule) => void;
};
