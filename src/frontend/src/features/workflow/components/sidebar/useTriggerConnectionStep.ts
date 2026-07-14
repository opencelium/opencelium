import { useState } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useFetchEntitiesQuery } from '@shared/api/genericApi';
import { createScheduleWebhook } from '@entities/schedule/model/createScheduleWebhook';
import { resolveWebhookUrl } from '@entities/schedule/model/resolveWebhookUrl';
import type { Schedule, ScheduleWebhook } from '@entities/schedule/model/types';
import type { ConnectionMeta } from '@entities/connection/command/connectionCache';
import type { WorkflowTriggerConnectionRef } from '../../types/workflow.types';

const CONNECTIONS_URL = '/connection/all/meta';
const SCHEDULES_URL = '/scheduler/all';

type ScheduleDialogTarget = {
  connection: ConnectionMeta;
  schedules: Schedule[];
};

type Params = {
  active: boolean;
  excludeConnectionId?: number;
  onFinalize: (triggerConnection: WorkflowTriggerConnectionRef) => void;
};

export function useTriggerConnectionStep({ active, excludeConnectionId, onFinalize }: Params) {
  const { t } = useI18n('workflow');
  const confirm = useConfirm();
  const [scheduleDialogTarget, setScheduleDialogTarget] = useState<ScheduleDialogTarget | null>(null);

  const {
    data: connectionsData,
    isFetching: connectionsFetching,
    isError: connectionsError,
  } = useFetchEntitiesQuery(CONNECTIONS_URL, { skip: !active });
  const { data: schedulesData, isFetching: schedulesFetching } = useFetchEntitiesQuery(SCHEDULES_URL, { skip: !active });

  const connections = ((connectionsData ?? []) as ConnectionMeta[]).filter((connection) => connection.id !== excludeConnectionId);
  const schedules = (schedulesData ?? []) as Schedule[];

  const schedulesForConnection = (connectionId: number) =>
    schedules.filter((schedule) => schedule.connection?.connectionId === connectionId);

  const items = connections.map((connection) => {
    const connectionSchedules = schedulesForConnection(connection.id);
    const disabled = connectionSchedules.length === 0;
    return {
      key: String(connection.id),
      title: connection.title,
      text: disabled
        ? t('sidebar.triggerConnectionStep.noSchedule')
        : t('sidebar.triggerConnectionStep.scheduleCount', { count: connectionSchedules.length }),
      disabled,
    };
  });

  const finalize = async (connection: ConnectionMeta, schedule: Schedule) => {
    let webhook = schedule.webhook;
    if (!webhook) {
      let created: ScheduleWebhook | undefined;
      const ok = await confirm({
        title: t('sidebar.triggerConnectionStep.confirmCreateWebhook.title'),
        message: t('sidebar.triggerConnectionStep.confirmCreateWebhook.message', { connection: connection.title }),
        onConfirm: async () => {
          created = await createScheduleWebhook(schedule.schedulerId);
          if (!created) throw new Error('Schedule webhook creation failed');
        },
      });
      if (!ok || !created) return;
      webhook = created;
    }
    onFinalize({
      connectionId: connection.id,
      connectionTitle: connection.title,
      schedulerId: schedule.schedulerId,
      scheduleTitle: schedule.title,
      webhookUrl: resolveWebhookUrl(webhook.url),
    });
  };

  const onSelectConnection = (key: string) => {
    const connection = connections.find((item) => String(item.id) === key);
    if (!connection) return;
    const connectionSchedules = schedulesForConnection(connection.id);
    if (connectionSchedules.length === 0) return;
    if (connectionSchedules.length === 1) {
      void finalize(connection, connectionSchedules[0]);
      return;
    }
    setScheduleDialogTarget({ connection, schedules: connectionSchedules });
  };

  const onConfirmScheduleDialog = (schedule: Schedule) => {
    if (!scheduleDialogTarget) return;
    const { connection } = scheduleDialogTarget;
    setScheduleDialogTarget(null);
    void finalize(connection, schedule);
  };

  return {
    items,
    isFetching: connectionsFetching || schedulesFetching,
    isError: connectionsError,
    onSelectConnection,
    scheduleDialogTarget,
    onConfirmScheduleDialog,
    onCancelScheduleDialog: () => setScheduleDialogTarget(null),
  };
}
