import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Select } from '@shared/ui/primitives/Select';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { PrefillSource } from '../model/playground.types';
import { PlaygroundBadge } from './PlaygroundBadge';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

type Props = {
	method: string;
	url: string;
	isUrlEdited: boolean;
	prefillSource: PrefillSource;
	isCurlVisible: boolean;
	isSending: boolean;
	onMethodChange: (method: string) => void;
	onToggleCurl: () => void;
	onSend: () => void;
};

export function PlaygroundUrlBar({ method, url, isUrlEdited, prefillSource, isCurlVisible, isSending,
	onMethodChange, onToggleCurl, onSend }: Props) {
	const { t } = useI18n('workflow');
	const verb = method.toUpperCase();
	const methods = HTTP_METHODS.includes(verb) ? HTTP_METHODS : [verb, ...HTTP_METHODS];

	return (
		<div className='rpUrlBar'>
			<div className='rpUrlMethod'>
				<Select value={verb} onChange={onMethodChange} sortOptions={false} testId='request-playground-method'
					options={methods.map((item) => ({ value: item, label: item }))} />
			</div>
			<div className='rpUrl' title={url} data-testid='request-playground-url'>
				<span className='rpUrlText'>{url}</span>
				{isUrlEdited && <PlaygroundBadge tone='info'>{t('requestPlayground.source.edited')}</PlaygroundBadge>}
			</div>
			<Tooltip content={t('requestPlayground.url.curlHint')}>
				<Button iconLeft='code' type={isCurlVisible ? 'primary' : 'default'} onClick={onToggleCurl}
					testId='request-playground-curl-toggle'>
					{t('requestPlayground.url.curl')}
				</Button>
			</Tooltip>
			<Button type='primary' iconLeft='send' loading={isSending} onClick={onSend} testId='request-playground-send'>
				{t(prefillSource === 'upstream' ? 'requestPlayground.url.sendUpstream' : 'requestPlayground.url.send')}
			</Button>
		</div>
	);
}
