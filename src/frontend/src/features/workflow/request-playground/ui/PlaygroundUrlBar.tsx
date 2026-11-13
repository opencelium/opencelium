import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Select } from '@shared/ui/primitives/Select';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ReferencePlaceholderInput } from './reference/ReferencePlaceholderInput';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

import type { JsonPart } from '../model/bodyPreview';

type Props = {
	method: string;
	url: string;
	// The URL with its test values filled in, shown on hover.
	previewUrl: string;
	previewParts?: JsonPart[];
	isCurlVisible: boolean;
	isSending: boolean;
	// False while /refs is pending or failed: the test needs its list of values.
	canSend: boolean;
	onMethodChange: (method: string) => void;
	onUrlChange: (url: string) => void;
	onToggleCurl: () => void;
	onSend: () => void;
};

export function PlaygroundUrlBar({ method, url, previewUrl, previewParts, isCurlVisible, isSending, canSend,
	onMethodChange, onUrlChange, onToggleCurl, onSend }: Props) {
	const { t } = useI18n('workflow');
	const verb = method.toUpperCase();
	const methods = HTTP_METHODS.includes(verb) ? HTTP_METHODS : [verb, ...HTTP_METHODS];

	return (
		<div className='rpUrlBar'>
			<div className='rpUrlMethod'>
				<Select value={verb} onChange={onMethodChange} sortOptions={false} testId='request-playground-method'
					options={methods.map((item) => ({ value: item, label: item }))} />
			</div>
			<div className='rpUrl'>
				<ReferencePlaceholderInput value={url} previewParts={previewParts} testId='request-playground-url' title={previewUrl} onChange={onUrlChange} />
			</div>
			<Tooltip content={t('requestPlayground.url.curlHint')}>
				<Button iconLeft='code' type={isCurlVisible ? 'primary' : 'default'} onClick={onToggleCurl}
					testId='request-playground-curl-toggle'>
					{t('requestPlayground.url.curl')}
				</Button>
			</Tooltip>
			<Button type='primary' iconLeft='send' loading={isSending} disabled={!canSend} onClick={onSend}
				testId='request-playground-send'>
				{t('requestPlayground.url.send')}
			</Button>
		</div>
	);
}
