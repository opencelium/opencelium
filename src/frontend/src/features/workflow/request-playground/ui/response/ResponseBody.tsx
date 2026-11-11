import { useState } from 'react';
import { Segmented } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { LogJsonView } from '@shared/ui/json-view/LogJsonView';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { Button } from '@shared/ui/primitives/Button';
import type { MultiValueHeaders } from '../../model/playground.types';
import { downloadBase64, readBinaryBody, toBodyText } from './responseFormat';

type BodyMode = 'pretty' | 'raw';

type Props = {
	body: unknown;
	headers: MultiValueHeaders;
	canSaveSample: boolean;
	onSaveSample: () => void;
};

export function ResponseBody({ body, headers, canSaveSample, onSaveSample }: Props) {
	const { t } = useI18n('workflow');
	const [mode, setMode] = useState<BodyMode>('pretty');
	const isObject = !!body && typeof body === 'object';
	const binary = readBinaryBody(body, headers);
	const download = () => {
		if (!binary) return;
		try {
			downloadBase64(binary);
		} catch {
			notifyError(t('requestPlayground.response.downloadFailed'));
		}
	};

	if (binary) {
		return (
			<div className='rpTabBody' data-testid='request-playground-response-body'>
				<div className='rpPlaceholder'>
					<span className='rpPlaceholderTitle'>{t('requestPlayground.response.binary', { type: binary.contentType })}</span>
					<Button iconLeft='download' onClick={download} testId='request-playground-response-download'>
						{t('requestPlayground.response.download')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='rpTabBody' data-testid='request-playground-response-body'>
			<div className='rpTabIntro'>
				<Segmented data-testid='request-playground-response-mode' value={mode}
					onChange={(next) => setMode(next as BodyMode)}
					options={[{ label: t('requestPlayground.response.pretty'), value: 'pretty' },
						{ label: t('requestPlayground.response.raw'), value: 'raw' }]} />
				<span className='rpPushEnd' />
				<CopyButton value={toBodyText(body, true)} />
				{canSaveSample && (
					<Button onClick={onSaveSample} testId='request-playground-save-sample'>
						{t('requestPlayground.response.saveSample')}
					</Button>
				)}
			</div>
			<div className='rpCodeBox rpCodeBox--fill'>
				{!toBodyText(body, false)
					? <span className='rpEmptyNote'>{t('requestPlayground.response.noBody')}</span>
					: mode === 'pretty' && isObject
						? <LogJsonView data={body as object} bare />
						: <pre className='rpRaw'>{toBodyText(body, mode === 'pretty')}</pre>}
			</div>
		</div>
	);
}
