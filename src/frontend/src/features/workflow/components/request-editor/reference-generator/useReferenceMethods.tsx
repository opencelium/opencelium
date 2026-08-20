import { useMemo } from 'react';
import type { Connection, MethodWithId } from '../../../types/connection';
import { getDuplicateMethodIndexByColor } from '../../../utils/methodColor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { MethodConnectorChip } from '../body-editor/MethodConnectorChip/MethodConnectorChip';
import { MethodColorDot } from '../../MethodColorDot/MethodColorDot';
import { getMethodConnectorChipInfo,
	getMethodConnectorTitle } from '../body-editor/requestReferenceOptions';
import { getEligibleReferenceMethods,
	getReferenceMethodLabel } from './referenceGenerator.utils';

export function useReferenceMethods(connection: Connection | null,
	currentMethod: MethodWithId, selectedConnector: string) {
	const { t } = useI18n('workflow');
	const eligibleMethods = useMemo(() =>
		getEligibleReferenceMethods(connection, currentMethod), [connection, currentMethod]);
	const connectorOptions = useMemo(() => {
		const seen = new Set<string>();
		return eligibleMethods.reduce<{ label: string; value: string }[]>((options, method) => {
			const title = getMethodConnectorTitle(method);
			if (!seen.has(title)) { seen.add(title); options.push({ label: title, value: title }); }
			return options;
		}, []);
	}, [eligibleMethods]);
	const methods = useMemo(() => selectedConnector
		? eligibleMethods.filter((method) => getMethodConnectorTitle(method) === selectedConnector)
		: [], [eligibleMethods, selectedConnector]);
	const methodOptions = useMemo(() => {
		const duplicateIndex = getDuplicateMethodIndexByColor(methods);
		return methods.map((method) => {
			const webhook = getMethodConnectorChipInfo(method).kind === 'webhook';
			const row = <span style={{ display: 'flex', alignItems: 'center',
				justifyContent: 'space-between', gap: 12, width: '100%' }}>
				<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
					<MethodColorDot color={method.color} index={method.color
						? duplicateIndex.get(method.color.toLowerCase()) : undefined} />
					<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
						{getReferenceMethodLabel(method)}
					</span>
				</span>
				<MethodConnectorChip method={method} tooltipZIndex={13020} disableTooltip={webhook} />
			</span>;
			return { value: method.id, searchLabel: getReferenceMethodLabel(method),
				label: webhook ? <Tooltip content={t('refGenerator.webhookTriggerHint')}
					placement='right' zIndex={13020}>{row}</Tooltip> : row };
		});
	}, [methods, t]);
	return { connectorOptions, methods, methodOptions };
}
