import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SystemContext from '@shared/theme/context/SystemContext';
import { ThemeProvider } from '@/app/providers/ui/ThemeProvider';
import { ConfigProvider, theme } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import en from '@shared/i18n/locales/en/workflow.json';
import de from '@shared/i18n/locales/de/workflow.json';
import { TemplateConnectorMappingDialog } from './TemplateConnectorMappingDialog';

const language = vi.hoisted(() => ({ value: 'en' }));
vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({
		t: (key: string) =>
			key
				.split('.')
				.reduce<unknown>(
					(value, part) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined),
					language.value === 'de' ? de : en,
				) ?? key,
	}),
}));
vi.mock('@/engine/entity/runtime/EntityWizard', () => ({
	EntityWizard: () => null,
}));
vi.mock('@/engine/entity/runtime/genererics/useWizardSubmit', () => ({
	useWizardSubmit: () => vi.fn(),
}));
vi.mock('@shared/ui/dialog/useDialog', () => ({
	useDialog: () => ({ open: vi.fn(), close: vi.fn() }),
}));
const groups = [
	{
		oldConnectorId: 1,
		templateTitle: 'Deleted A',
		invokerName: 'A',
		methodNames: ['read'],
	},
	{
		oldConnectorId: 2,
		templateTitle: 'Deleted B',
		invokerName: 'B',
		methodNames: ['write'],
	},
];
const connectors = [
	{ connectorId: 10, title: 'New A', invoker: { name: 'A' } },
	{ connectorId: 20, title: 'New B', invoker: { name: 'B' } },
] as Connector[];
const invokers = [{ name: 'A' }, { name: 'B' }] as Invoker[];

function renderDialog(mode: 'light' | 'dark', available = connectors) {
	localStorage.setItem('theme', `ci-${mode}`);
	const onConfirm = vi.fn();
	const onCancel = vi.fn();
	render(
		<SystemContext.Provider value={{ system: 'ant', setSystem: () => {} }}>
			<ThemeProvider>
				<ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
					<TemplateConnectorMappingDialog
						open
						purpose="repair"
						groups={groups}
						connectors={available}
						invokers={invokers}
						onConfirm={onConfirm}
						onCancel={onCancel}
					/>
				</ConfigProvider>
			</ThemeProvider>
		</SystemContext.Provider>,
	);
	return { onConfirm, onCancel };
}

afterEach(() => {
	cleanup();
	localStorage.removeItem('theme');
});
describe.each([
	['light', 'en'],
	['light', 'de'],
	['dark', 'en'],
	['dark', 'de'],
] as const)('connector repair dialog in %s theme and %s language', (mode, locale) => {
	beforeEach(() => {
		language.value = locale;
	});
	it('preselects the only matching connector for each row', async () => {
		const { onConfirm, onCancel } = renderDialog(mode);
		const text = locale === 'de' ? de : en;
		expect(screen.getByText(text.deletedConnectorMapping.title)).toBeTruthy();
		expect(screen.getByText(text.deletedConnectorMapping.intro)).toBeTruthy();
		expect(screen.getByText('Deleted A')).toBeTruthy();
		expect(screen.getByText('Deleted B')).toBeTruthy();
		const confirm = screen.getByTestId('workflow-template-connector-mapping-confirm');
		await waitFor(() => expect(confirm).not.toBeDisabled());
		fireEvent.click(confirm);
		expect(onConfirm).toHaveBeenCalledWith({ 1: 10, 2: 20 }, []);
		fireEvent.click(screen.getByTestId('workflow-template-connector-mapping-cancel'));
		expect(onCancel).toHaveBeenCalledOnce();
		expect(screen.getByTestId('workflow-template-connector-mapping-select-1')).toBeTruthy();
		expect(screen.getByTestId('workflow-template-connector-mapping-create-2')).toBeTruthy();
	});
	it('disables Confirm until every row has a replacement', () => {
		renderDialog(mode, connectors.slice(0, 1));
		expect(screen.getByTestId('workflow-template-connector-mapping-confirm')).toBeDisabled();
	});
});
