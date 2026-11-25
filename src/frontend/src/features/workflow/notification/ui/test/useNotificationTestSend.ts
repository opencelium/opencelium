import { useState } from 'react';
import { message } from 'antd';
import { errorBus } from '@shared/errors/api/errorBus';
import { normalizeError } from '@shared/errors/api/normalizeError';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { useLazyGetMethodTestRefsQuery, useTestMethodMutation } from '../../../request-playground/model/playgroundApi';
import type { MethodTestReceivedResponse } from '../../../request-playground/model/playground.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { buildNotificationTestDraft, buildPlaceholderValues } from '../../model/notificationTestRequest';
import type { NotificationConfig } from '../../model/notification.types';

export type NotificationTestResult = { response: MethodTestReceivedResponse; durationMs: number };

type Args = { node: WorkflowNodeModel; config: NotificationConfig; nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] };

/** Sends the current message once, through the same backend endpoint as "Try Request". */
export const useNotificationTestSend = ({ node, config, nodes, edges }: Args) => {
	const { t } = useI18n('workflow');
	const [loadRefs, { isFetching: isLoadingRefs }] = useLazyGetMethodTestRefsQuery();
	const [testMethod, { isLoading: isTesting }] = useTestMethodMutation();
	const [result, setResult] = useState<NotificationTestResult | null>(null);

	const fail = (error: unknown) => {
		const appError = normalizeError(error);
		if (appError.type === 'UNAUTHORIZED' || appError.type === 'FORBIDDEN') errorBus.emit(appError);
		else notifyError(appError.serverMessage ?? t('notification.test.failed'));
	};

	const send = async () => {
		setResult(null);
		const draft = buildNotificationTestDraft(node, config, nodes, edges);
		const refs = await loadRefs(draft);
		if (!refs.data) return fail(refs.error);
		const response = await testMethod({ method: draft, staticValues: buildPlaceholderValues(refs.data), confirmWrite: true });
		if (!('data' in response) || !response.data) return fail(response.error);
		const { response: received, durationMs, connectorErrors } = response.data;
		if (connectorErrors.length || !received) {
			notifyError(connectorErrors[0]?.message ?? t('notification.test.failed'));
			return;
		}
		setResult({ response: received, durationMs: durationMs ?? 0 });
		if (received.status < 400) message.success(t('notification.test.sent', { status: received.status }));
	};

	return { send: () => void send(), result, isSending: isLoadingRefs || isTesting };
};

export type NotificationTestSend = ReturnType<typeof useNotificationTestSend>;
