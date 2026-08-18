import type { MouseEvent } from 'react';
import { useGetDataAggregatorsQuery } from '@entities/dataAggregator/api/dataAggregatorApi';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	dataAggregator: number | null | undefined;
	suppressTooltip?: boolean;
	testId?: string;
	onOpenAggregatorEditor?: () => void;
};

export function AggregatorBadge({ dataAggregator, suppressTooltip, testId, onOpenAggregatorEditor }: Props) {
	const { t } = useI18n('workflow');
	const { data: aggregators = [] } = useGetDataAggregatorsQuery();

	if (dataAggregator == null) return null;

	const name = aggregators.find((aggregator) => aggregator.id === dataAggregator)?.name ?? String(dataAggregator);
	const icon = <Icon name='aggregator' size={11} color='primary' />;

	const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		onOpenAggregatorEditor?.();
	};

	// The positioned badge span must wrap `Tooltip`, not the other way round — `Tooltip`
	// wraps its children in its own unstyled, statically-positioned span, so if that span
	// held the `position: absolute` styling, it would collapse to zero size (its only
	// child taken out of flow) and get centered by `.circleNode`'s flex layout instead of
	// sitting in the corner, dragging the tooltip's anchor point to the node's center.
	return (
		<span
			className='circleNodeAggregatorBadge nodrag nopan'
			data-testid={testId}
			onClick={handleClick}
			onDoubleClick={(event) => event.stopPropagation()}
		>
			{suppressTooltip ? icon : (
				<Tooltip content={t('node.aggregatorBadge', { name })} placement='top'>
					{icon}
				</Tooltip>
			)}
		</span>
	);
}
