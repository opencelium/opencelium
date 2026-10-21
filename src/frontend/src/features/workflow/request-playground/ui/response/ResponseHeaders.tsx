import { useI18n } from '@shared/i18n/hooks/useI18n';

export function ResponseHeaders({ headers }: { headers: Record<string, string> }) {
	const { t } = useI18n('workflow');
	const entries = Object.entries(headers);
	if (!entries.length) return <div className='rpTabBody rpEmptyNote'>{t('requestPlayground.response.noHeaders')}</div>;
	return (
		<div className='rpTabBody'>
			<div className='rpTable' data-testid='request-playground-response-headers'>
				{entries.map(([key, value]) => (
					<div key={key} className='rpGridRow rpHeaderRow'>
						<span className='rpHeaderKey'>{key}</span>
						<span className='rpMono rpBreakAll'>{String(value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}
