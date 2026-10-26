import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tabs } from '@shared/ui/primitives/Tabs';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import type { PlaygroundValues } from '../../hooks/usePlaygroundValues';
import type { PlaygroundSettings } from '../../model/playground.types';
import { splitEndpoint } from '../../../components/request-editor/url-editor/urlQueryParams.utils';
import { BodyTab } from './BodyTab';
import { HeadersTab } from './HeadersTab';
import { ParamsTab } from './ParamsTab';
import { SettingsTab } from './SettingsTab';
import { TestValuesTab, type FocusRequest } from './TestValuesTab';
import { countValueRows } from './valueRows';

export type RequestTab = 'values' | 'params' | 'headers' | 'body' | 'settings';

type Props = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	settings: PlaygroundSettings;
	missingKeys: string[];
	tab: RequestTab;
	focus: FocusRequest | null;
	onTabChange: (tab: RequestTab) => void;
	onSelectInput: (key: string) => void;
	onSettingsChange: (patch: Partial<PlaygroundSettings>) => void;
};

const TabLabel = ({ label, count }: { label: string; count?: number }) => (
	<span className='rpTabLabel'>{label}{count !== undefined && <span className='rpCount'>{count}</span>}</span>
);

export function RequestTabs({ session, values, settings, missingKeys, tab, focus, onTabChange,
	onSelectInput, onSettingsChange }: Props) {
	const { t } = useI18n('workflow');
	const { inputs, config } = session;
	const valueCount = countValueRows(inputs);
	const { queryRaw } = splitEndpoint(config.url ?? '');
	const label = (key: RequestTab, count?: number) =>
		<TabLabel label={t(`requestPlayground.tabs.${key}`)} count={count} />;

	return (
		<div className='rpRequestTabs' data-testid='request-playground-request-tabs'>
			<Tabs value={tab} onChange={(key) => onTabChange(key as RequestTab)} items={[
				{ key: 'values', label: label('values', valueCount), content:
					<TestValuesTab session={session} values={values} missingKeys={missingKeys} focus={focus} /> },
				{ key: 'params', label: label('params', queryRaw ? queryRaw.split('&').filter(Boolean).length : 0),
					content: <ParamsTab session={session} /> },
				{ key: 'headers', label: label('headers', Object.keys(config.headers ?? {}).length),
					content: <HeadersTab session={session} values={values} missingKeys={missingKeys}
						onSelectInput={onSelectInput} /> },
				{ key: 'body', label: label('body'), content:
					<BodyTab session={session} values={values} missingKeys={missingKeys} onSelectInput={onSelectInput} /> },
				{ key: 'settings', label: label('settings'), content:
					<SettingsTab settings={settings} onChange={onSettingsChange} /> },
			]} />
		</div>
	);
}
