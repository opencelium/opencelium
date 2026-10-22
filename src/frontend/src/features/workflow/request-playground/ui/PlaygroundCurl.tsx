import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CopyButton } from '@shared/ui/actions/CopyButton';

export function PlaygroundCurl({ command }: { command: string }) {
	const { t } = useI18n('workflow');
	return (
		<div className='rpCurl' data-testid='request-playground-curl'>
			<div className='rpCurlHeader'>
				<span>{t('requestPlayground.curl.title')}</span>
				<CopyButton value={command} />
			</div>
			<pre className='rpCurlCode'>{command}</pre>
		</div>
	);
}
