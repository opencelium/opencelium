import { useState } from 'react';
import { Segmented } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { LogJsonView } from '@shared/ui/json-view/LogJsonView';
import { Button } from '@shared/ui/primitives/Button';
import { toBodyText } from './responseFormat';

type BodyMode = 'pretty' | 'raw';

type Props = {
	body: unknown;
	canSaveSample: boolean;
	onSaveSample: () => void;
};

export function ResponseBody({ body, canSaveSample, onSaveSample }: Props) {
	const { t } = useI18n('workflow');
	const [mode, setMode] = useState<BodyMode>('pretty');
	const isObject = !!body && typeof body === 'object';

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
