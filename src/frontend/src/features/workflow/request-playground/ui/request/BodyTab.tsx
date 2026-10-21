import { useState } from 'react';
import { Segmented } from 'antd';
import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import type { WorkflowBodyFormat } from '../../../types/request-config.types';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import { readBodyFields } from '../../model/collectPlaygroundInputs';
import { BodyRawEditor } from './BodyRawEditor';
import { PlaygroundJsonView } from './PlaygroundJsonView';

type BodyMode = 'pretty' | 'raw';

const BODY_FORMATS: { value: WorkflowBodyFormat; labelKey: string }[] = [
	{ value: 'json', labelKey: 'requestPlayground.body.format.json' },
	{ value: 'xml', labelKey: 'requestPlayground.body.format.xml' },
	{ value: 'x-www-form-urlencoded', labelKey: 'requestPlayground.body.format.urlencoded' },
];

type Props = {
	session: PlaygroundSession;
	missingKeys: string[];
	onSelectInput: (key: string) => void;
};

export function BodyTab({ session, missingKeys, onSelectInput }: Props) {
	const { t } = useI18n('workflow');
	const [mode, setMode] = useState<BodyMode>('pretty');
	const { config, draft, connection, currentMethod, setEdits } = session;
	const fields = readBodyFields(draft.request.body);

	return (
		<div className='rpTabBody'>
			<div className='rpTabIntro'>
				<div className='rpBodyFormat'>
					<Select<WorkflowBodyFormat> value={config.bodyFormat} sortOptions={false}
						testId='request-playground-body-format'
						onChange={(bodyFormat) => setEdits((current) => ({ ...current, bodyFormat }))}
						options={BODY_FORMATS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))} />
				</div>
				<Segmented data-testid='request-playground-body-mode' value={mode}
					onChange={(next) => setMode(next as BodyMode)}
					options={[{ label: t('requestPlayground.body.pretty'), value: 'pretty' },
						{ label: t('requestPlayground.body.raw'), value: 'raw' }]} />
				{mode === 'pretty' && (
					<span className='rpHint rpPushEnd'>
						<Trans ns='workflow' i18nKey='requestPlayground.body.hint' components={{ b: <b /> }} />
					</span>
				)}
			</div>
			{mode === 'raw'
				? <BodyRawEditor body={config.body} onChange={(body) => setEdits((current) => ({ ...current, body }))} />
				: fields && typeof fields === 'object' && Object.keys(fields).length > 0
					? <div className='rpCodeBox'>
						<PlaygroundJsonView data={fields} connection={connection} currentMethod={currentMethod}
							missingKeys={missingKeys} testId='request-playground-body' onSelect={onSelectInput} />
					</div>
					: <div className='rpEmptyNote'>{t('requestPlayground.body.empty')}</div>}
		</div>
	);
}
