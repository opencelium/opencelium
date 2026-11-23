import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { MultiValueHeaders } from '../../model/playground.types';
import { joinHeaderValues } from '../../model/sampleResponse';

type Props = { headers: MultiValueHeaders | null | undefined };

export function ResponseHeaders({ headers }: Props) {
	const { t } = useI18n('workflow');
	const entries = Object.entries(joinHeaderValues(headers));
	if (!entries.length) return <div className='rpTabBody rpEmptyNote'>{t('requestPlayground.response.noHeaders')}</div>;
	return (
		<div className='rpTabBody'>
			<div className='rpTable' data-testid='request-playground-response-headers'>
				{entries.map(([key, value]) => (
					<div key={key} className='rpGridRow rpHeaderRow'>
						<span className='rpHeaderKey'>{key}</span>
						<span className='rpMono rpBreakAll'>{value}</span>
					</div>
				))}
			</div>
		</div>
	);
}
