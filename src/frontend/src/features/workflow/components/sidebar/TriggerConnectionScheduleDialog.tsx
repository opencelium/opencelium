import { useState } from 'react';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Button } from '@shared/ui/primitives/Button';
import { Select } from '@shared/ui/primitives/Select';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Schedule } from '@entities/schedule/model/types';

type Props = {
  open: boolean;
  connectionTitle: string;
  schedules: Schedule[];
  onCancel: () => void;
  onConfirm: (schedule: Schedule) => void;
};

export function TriggerConnectionScheduleDialog({ open, connectionTitle, schedules, onCancel, onConfirm }: Props) {
  const { t } = useI18n('workflow');
  const [schedulerId, setSchedulerId] = useState<number | undefined>(undefined);

  const options = schedules.map((schedule) => {
    const scheduleLabel = schedule.cronExp
      ? `${schedule.connection.title} (${schedule.cronExp})`
      : schedule.connection.title;
    return {
      value: schedule.schedulerId,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>{scheduleLabel}</span>
          {schedule.webhook && (
            <Tooltip content={t('sidebar.triggerConnectionStep.selectScheduleDialog.hasWebhookTooltip')}>
              <Icon name="webhook" size={14} color="primary" />
            </Tooltip>
          )}
        </span>
      ),
      searchLabel: scheduleLabel,
    };
  });
  const selectedSchedule = schedules.find((schedule) => schedule.schedulerId === schedulerId);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={t('sidebar.triggerConnectionStep.selectScheduleDialog.title')}
      footer={
        <>
          <Button onClick={onCancel}>
            {t('sidebar.triggerConnectionStep.selectScheduleDialog.cancel')}
          </Button>
          <Button
            type="primary"
            disabled={!selectedSchedule}
            onClick={() => selectedSchedule && onConfirm(selectedSchedule)}
          >
            {t('sidebar.triggerConnectionStep.selectScheduleDialog.submit')}
          </Button>
        </>
      }
    >
      <p>{t('sidebar.triggerConnectionStep.selectScheduleDialog.description', { connection: connectionTitle })}</p>
      <div style={{ marginTop: 12 }}>
        <Select
          options={options}
          value={schedulerId}
          onChange={setSchedulerId}
          placeholder={t('sidebar.triggerConnectionStep.selectScheduleDialog.placeholder', { connection: connectionTitle })}
        />
      </div>
    </Dialog>
  );
}
