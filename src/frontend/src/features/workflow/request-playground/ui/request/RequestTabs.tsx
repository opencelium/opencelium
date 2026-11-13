import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tabs } from '@shared/ui/primitives/Tabs';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import type { PlaygroundValues } from '../../hooks/usePlaygroundValues';
import { splitEndpoint } from '../../../components/request-editor/url-editor/urlQueryParams.utils';
import { BodyTab } from './BodyTab';
import { HeadersTab } from './HeadersTab';
import { ParamsTab } from './ParamsTab';
import { TestValuesTab, type FocusRequest } from './TestValuesTab';
import type { ValueRow } from './valueRows';

export type RequestTab = 'values' | 'params' | 'headers' | 'body';

type Props = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	rows: ValueRow[];
	missingKeys: string[];
	tab: RequestTab;
	focus: FocusRequest | null;
	onTabChange: (tab: RequestTab) => void;
	onSelectInput: (key: string) => void;
};

const TabLabel = ({ label, count }: { label: string; count?: number }) => (
	<span className='rpTabLabel'>{label}{count !== undefined && <span className='rpCount'>{count}</span>}</span>
);

export function RequestTabs({ session, values, rows, missingKeys, tab, focus, onTabChange, onSelectInput }: Props) {
	const { t } = useI18n('workflow');
	const { config } = session;
	const { queryRaw } = splitEndpoint(config.url ?? '');
	const label = (key: RequestTab, count?: number) =>
		<TabLabel label={t(`requestPlayground.tabs.${key}`)} count={count} />;

	return (
		<div className='rpRequestTabs' data-testid='request-playground-request-tabs'>
			<Tabs value={tab} onChange={(key) => onTabChange(key as RequestTab)} items={[
				{ key: 'values', label: label('values', rows.length), content:
					<TestValuesTab session={session} values={values} rows={rows} missingKeys={missingKeys} focus={focus} /> },
				{ key: 'params', label: label('params', queryRaw ? queryRaw.split('&').filter(Boolean).length : 0),
					content: <ParamsTab session={session} /> },
				{ key: 'headers', label: label('headers', Object.keys(config.headers ?? {}).length),
					content: <HeadersTab session={session} values={values} missingKeys={missingKeys}
						onSelectInput={onSelectInput} /> },
				{ key: 'body', label: label('body'), content:
					<BodyTab session={session} values={values} missingKeys={missingKeys} onSelectInput={onSelectInput} /> },
			]} />
		</div>
	);
}
