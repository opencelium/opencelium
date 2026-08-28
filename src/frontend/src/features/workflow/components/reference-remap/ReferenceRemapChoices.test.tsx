import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { KitProvider } from '@app/providers/ui/KitProvider';

// Identity translator, the pattern the other component tests use: this pins the
// wiring, not the copy, which lives in the locale files.
vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));
import type { MethodWithId } from '../../types/connection';
import type { ReferenceRemapTarget } from '../../utils/graph.referenceRemapTargets';
import { ReferenceRemapChoices } from './ReferenceRemapChoices';

// antd's Select measures its dropdown through rc-resize-observer, which jsdom
// has no implementation for; opening one throws without this.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

/** Only the half the field picker reads: the stored response it offers paths
 *  from. */
const legacyMethod = (id: string, fields: unknown) => ({
	id, name: id, color: '#3fa9f5', index: '0',
	response: { success: { body: { type: 'object', fields } } },
}) as unknown as MethodWithId;

const target = (overrides: Partial<ReferenceRemapTarget> = {}): ReferenceRemapTarget => ({
	color: '#7ed321',
	label: 'Get users',
	consumerNodeIds: ['m3'],
	sources: [{ key: '#7ed321.(response).body.$.id', messageProperty: 'body',
		path: 'id', label: 'body.$.id' }],
	candidates: [
		{ nodeId: 'm1', color: '#3fa9f5', label: 'List accounts',
			method: legacyMethod('m1', { user: { id: 1 } }) },
		{ nodeId: 'm0', color: '#bd10e0', label: 'Fetch token',
			method: legacyMethod('m0', { token: 'x' }) },
	],
	...overrides,
});

const renderChoices = (targets: ReferenceRemapTarget[]) => {
	const onChange = vi.fn();
	render(
		<KitProvider initialSystem='ant'>
			<ReferenceRemapChoices targets={targets} onChange={onChange} />
		</KitProvider>,
	);
	return { onChange };
};

// The method select is the row's first combobox; the field pickers that appear
// under it once a method is chosen are the ones after it.
const pick = (label: string) => {
	fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
	fireEvent.click(screen.getAllByText(label).at(-1) as HTMLElement);
};

const pickField = (label: string) => {
	fireEvent.mouseDown(screen.getAllByRole('combobox').at(-1) as HTMLElement);
	fireEvent.click(screen.getAllByText(label).at(-1) as HTMLElement);
};

describe('ReferenceRemapChoices', () => {
	it('names the method going away and how many steps read it', () => {
		renderChoices([target()]);
		expect(screen.getByText('Get users')).toBeTruthy();
		expect(screen.getByText('referenceRemap.readBy')).toBeTruthy();
	});

	// Nothing is re-pointed unless the user says so: a deletion must never
	// quietly move someone's reference onto a method they did not choose.
	it('starts on clear, reporting no remap at all', () => {
		const { onChange } = renderChoices([target()]);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('reports the replacement the user picked, keyed by the doomed colour', () => {
		const { onChange } = renderChoices([target()]);

		pick('List accounts');

		expect(onChange).toHaveBeenCalledWith({
			colors: new Map([['#7ed321', '#3fa9f5']]),
			references: new Map(),
		});
	});

	it('drops a target back out of the remap when it is set back to clear', () => {
		const { onChange } = renderChoices([target()]);

		pick('List accounts');
		pick('referenceRemap.clear');

		expect(onChange).toHaveBeenLastCalledWith({ colors: new Map(), references: new Map() });
	});

	it('says so, and offers nothing, when nothing can be read instead', () => {
		renderChoices([target({ candidates: [] })]);
		expect(screen.queryAllByRole('combobox')).toEqual([]);
		expect(screen.getByText('referenceRemap.noCandidates')).toBeTruthy();
	});

	// The fields are only a question once there is a method to read them from.
	it('asks about each field read, but only after a method is chosen', () => {
		renderChoices([target()]);
		expect(screen.queryByText('body.$.id')).toBeNull();

		pick('List accounts');

		expect(screen.getByText('body.$.id')).toBeTruthy();
	});

	it('records a field the user re-points, keyed by the reference it replaces', () => {
		const { onChange } = renderChoices([target()]);
		pick('List accounts');

		// The picker offers the replacement's own response shape.
		pickField('user');

		expect(onChange).toHaveBeenLastCalledWith({
			colors: new Map([['#7ed321', '#3fa9f5']]),
			references: new Map([['#7ed321.(response).body.$.id',
				'#3fa9f5.(response).body.$.user']]),
		});
	});

	// A different method has a different response, so a path picked against the
	// old one cannot be carried over.
	it('forgets the fields when the method is changed again', () => {
		const { onChange } = renderChoices([target()]);
		pick('List accounts');
		pickField('user');

		pick('Fetch token');

		expect(onChange).toHaveBeenLastCalledWith({
			colors: new Map([['#7ed321', '#bd10e0']]),
			references: new Map(),
		});
	});

	// The confirm dialog stacks at 20000 and the picker's popup is rendered on
	// document.body, so it opens behind the dialog unless it is told otherwise.
	it('opens the field picker above the dialog hosting it', () => {
		renderChoices([target()]);
		pick('List accounts');
		fireEvent.mouseDown(screen.getAllByRole('combobox').at(-1) as HTMLElement);

		// The method select's own popup is in the document too; the field picker's
		// is the one carrying a stacking of its own.
		const zIndexes = [...document.querySelectorAll('.ant-select-dropdown')]
			.map((popup) => Number((popup as HTMLElement).style.zIndex));
		expect(Math.max(...zIndexes)).toBeGreaterThan(20000);
	});
});
