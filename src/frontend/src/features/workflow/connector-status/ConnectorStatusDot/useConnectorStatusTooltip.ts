import { useI18n } from '@shared/i18n/hooks/useI18n';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';
import type { ConnectorStatusDotProps } from './ConnectorStatusDot.types';
import { extractConnectorErrorReason, getConnectorStatusAppearance } from './connectorStatusDot.utils';

type Params = Pick<ConnectorStatusDotProps, 'status' | 'tooltipOverride' | 'lastCheckedAt'>;

export function useConnectorStatusTooltip({ status, tooltipOverride, lastCheckedAt }: Params): string {
	const { t, lang } = useI18n('workflow');
	const { tooltipKey } = getConnectorStatusAppearance(status);
	const statusMessage = tooltipOverride
		? t('sidebar.connectorStatus.failedWithReason', { reason: extractConnectorErrorReason(tooltipOverride) })
		: t(`sidebar.connectorStatus.${tooltipKey}`);
	return lastCheckedAt != null
		? t('sidebar.connectorStatus.checkedAt', { time: formatRelativeTime(lastCheckedAt, lang), message: statusMessage })
		: statusMessage;
}
