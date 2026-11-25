import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import en from '@shared/i18n/locales/en/workflow.json';
import de from '@shared/i18n/locales/de/workflow.json';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import type { PlaygroundValues } from '../../hooks/usePlaygroundValues';
import { buildValueRows } from './valueRows';
import { TestValuesTab } from './TestValuesTab';

const locale = vi.hoisted(() => ({ current: 'en' as 'en' | 'de' }));
vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({
		t: (key: string) => {
			const dictionary = locale.current === 'en' ? en : de;
			const value = key.split('.').reduce<unknown>((node, segment) =>
				(node as Record<string, unknown> | undefined)?.[segment], dictionary);
			return typeof value === 'string' ? value : key;
		},
	}),
}));

vi.mock('@shared/ui/primitives/Tooltip', () => ({ Tooltip: ({ children }: { children: ReactNode }) => children }));
vi.mock('@shared/ui/primitives/Button', () => ({ Button: ({ children }: { children: ReactNode }) => <button>{children}</button> }));
vi.mock('@shared/ui/primitives/Input', () => ({ Input: ({ value }: { value: string }) => <input value={value} readOnly /> }));
vi.mock('@shared/ui/primitives/Select', () => ({ Select: () => null }));

const key = '#112233.(response).body.$.item';
const session = {
	refs: { error: null },
	inputs: {
		references: [{
			reference: key,
			parsed: { color: '#112233', direction: 'response', messageProperty: 'body', path: '$.item' },
			targets: [{ location: 'body', property: 'item' }],
		}],
		webhooks: [],
		connectionFields: [],
	},
} as unknown as PlaygroundSession;
const values = {
	values: { [key]: { text: '', kind: 'string', source: 'notExecuted' } },
	resolvingKeys: [],
	prefillSource: 'execution',
	executionId: '9',
	requestData: {},
	changedCount: 0,
} as unknown as PlaygroundValues;

it.each([
	['en', 'Not executed in this run'],
	['de', 'In dieser Ausführung nicht ausgeführt'],
] as const)('shows the translated unexecuted badge and a blank input in %s', (language, label) => {
	locale.current = language;
	render(<TestValuesTab session={session} values={values}
		rows={buildValueRows({ inputs: session.inputs, refs: undefined, draft: session.draft, connectors: [], methods: [] }, (key) => key)}
		missingKeys={[key]} focus={null} />);
	expect(screen.getByText(label)).toBeTruthy();
	expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
});
