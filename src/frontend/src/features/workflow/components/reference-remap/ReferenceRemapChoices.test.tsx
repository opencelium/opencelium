import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { KitProvider } from '@app/providers/ui/KitProvider';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { ReferenceRemapPlan } from '../../utils/graph.referenceRemap';
import type { ReferenceRemapTarget } from '../../utils/graph.referenceRemapTargets';
import { ReferenceRemapChoices } from './ReferenceRemapChoices';
import { emptyChoice } from './referenceRemapChoice';

// Identity translator, the pattern the other component tests use: this pins the
// wiring, not the copy, which lives in the locale files.
vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));

// antd's Select measures its dropdown through rc-resize-observer, which jsdom
// has no implementation for; opening one throws without this.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

const DOOMED = '#7ed321';
const KEEPER = '#3fa9f5';
const OTHER = '#50e3c2';

const config = (overrides: Record<string, unknown> = {}) => ({
	url: '', headers: {}, queryParams: [], endpointArgs: {},
	bodyFormat: 'json', bodyData: 'json', body: {}, ...overrides,
});

const method = (id: string, color: string, fields?: unknown) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: {
		title: 'Method', subtitle: id, kind: 'connector', color,
		methodConfig: config(),
		...(fields ? { response: { success: { status: '200', header: { 'X-Trace': '' },
			body: { type: 'object', fields } } } } : {}),
	},
}) as unknown as WorkflowNodeModel;

const edge = (id: string, source: string, target: string) =>
	({ id, type: 'workflow-edge', source, target }) as unknown as WorkflowEdgeModel;

/** The graph as it is after the delete: start → keeper → consumer. */
const doomedMethod = method('doomed', DOOMED, { id: 1 });

const READ = `${DOOMED}.(response).body.$.id`;

const ifOperator = {
	id: 'if-1', type: 'if', position: { x: 0, y: 0 },
	data: { title: 'Only new ones', kind: 'if', conditionConfig: { operatorType: 'if',
		expression: '', tree: { id: 'root', type: 'group', properties: { conjunction: '&&' },
			items: [
				{ id: 'r1', type: 'rule', properties: { leftField: `{%${READ}%}`,
					operator: '=', rightField: "'new'" } },
				{ id: 'r2', type: 'rule', properties: { leftField: "{%#3fa9f5.(response).body.$.id%}",
					operator: '=', rightField: "'x'" } },
			] } } },
} as unknown as WorkflowNodeModel;

const after = {
	nodes: [
		{ id: 'start-1', type: 'start', position: { x: 0, y: 0 },
			data: { title: 'Start', kind: 'start' } } as unknown as WorkflowNodeModel,
		method('m1', KEEPER, { user: { id: 1 }, token: 'abc' }),
		// A second method on the graph, so a candidate naming it is a real method
		// the picker can draw — which is what the row's options come from now.
		method('m9', OTHER, { ref: 'x' }),
		method('m3', '#f5a623'),
		ifOperator,
	],
	edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm9'), edge('e3', 'm9', 'm3')],
};

/** The graph as it was: the deleted method is still on it, which is what lets
 *  the read-only column name what the current reference points at. */
const before = {
	nodes: [after.nodes[0], after.nodes[1], doomedMethod, ...after.nodes.slice(2)],
	edges: [edge('b1', 'start-1', 'm1'), edge('b2', 'm1', 'doomed'),
		edge('b3', 'doomed', 'm9'), edge('b4', 'm9', 'm3')],
};

const target = (overrides: Partial<ReferenceRemapTarget> = {}): ReferenceRemapTarget => ({
	color: DOOMED,
	label: 'Get users',
	consumerNodeIds: ['m3'],
	sources: [{ key: `${DOOMED}.(response).body.$.id`, messageProperty: 'body',
		path: 'id', label: 'body.$.id', consumerNodeIds: ['m3'],
		locations: [{ kind: 'reference', value: '#f5a623.(request).body.$.total' }],
		candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' }] }],
	candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' }],
	...overrides,
});

/** The halves of the plan a choice produces. The third — conditions rewritten
 *  by hand — is asserted where it is the subject. */
const planOf = (onChange: { mock: { lastCall?: unknown[] } }) => {
	const plan = onChange.mock.lastCall?.[0] as ReferenceRemapPlan;
	return { colors: plan.colors, references: plan.references };
};

const renderChoices = (targets: ReferenceRemapTarget[]) => {
	const onChange = vi.fn();
	render(
		<KitProvider initialSystem='ant'>
			<ReferenceRemapChoices targets={targets} after={after} before={before}
				onChange={onChange} />
		</KitProvider>,
	);
	return { onChange };
};

/** The options of the list this combobox owns — `aria-controls` ties the two
 *  together. Matching on text alone is not enough once several selects on
 *  screen offer the same method. */
const optionIn = (combobox: HTMLElement, label: string) => {
	const listId = combobox.getAttribute('aria-controls');
	const own = listId ? document.getElementById(listId) : null;
	return own && [...own.querySelectorAll('.ant-select-item-option')]
		.find((item) => item.textContent === label);
};

/** Opens the list only if it is not already showing what we are after: drilling
 *  into a field path leaves it open on the next level, and a second mousedown
 *  would close it again. */
const openAndPick = (combobox: HTMLElement, label: string) => {
	let option = optionIn(combobox, label);
	if (!option) {
		// antd opens on a mousedown of the selector box, not of the inner input.
		fireEvent.mouseDown(combobox.closest('.ant-select')
			?.querySelector('.ant-select-selector') ?? combobox);
		option = optionIn(combobox, label);
	}
	fireEvent.click((option || screen.getAllByText(label).at(-1)) as HTMLElement);
};

/** The controls that can be operated: [0] is the row's own method select, then
 *  each field row's generator. The read-only "current reference" column has
 *  comboboxes too, and they are disabled. */
const comboboxes = () => screen.getAllByRole('combobox')
	.filter((box) => !box.hasAttribute('disabled'));

/** Same for the response-part radios: the read-only column has a set too. */
const radios = () => screen.getAllByRole('radio')
	.filter((radio) => !radio.hasAttribute('disabled'));

/** Clicks a label inside the editable half of a field row, so a click cannot
 *  land on the read-only copy of the same control. */
const clickInEditable = (label: string, index = 0) => {
	const cell = document.querySelectorAll('.referenceRemapSourceValue')[index];
	const target = [...cell.querySelectorAll('*')]
		.find((node) => node.textContent === label && node.children.length === 0);
	fireEvent.click(target as HTMLElement);
};

/** Drive the shared generator: a method, and then either a response part that
 *  is an answer on its own (status) or a field. There is no apply button here —
 *  a whole reference lands the moment it is picked. */
const pickPath = (...steps: string[]) => steps.forEach((step) =>
	openAndPick(comboboxes().at(-1) as HTMLElement, step));

const generateReference = (methodLabel: string, path: string[], part?: 'B' | 'H' | 'S') => {
	openAndPick(comboboxes()[1], methodLabel);
	if (part) clickInEditable(part);
	pickPath(...path);
};

describe('ReferenceRemapChoices', () => {
	it('names the method going away and how many steps read it', () => {
		renderChoices([target()]);
		expect(screen.getByText('Get users')).toBeTruthy();
		expect(screen.getByText('referenceRemap.readBy')).toBeTruthy();
	});

	// Nothing is re-pointed unless the user says so: a deletion must never
	// quietly move someone's reference onto a method they did not choose.
	it('starts with nothing chosen', () => {
		const { onChange } = renderChoices([target()]);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('moves the whole method in one answer', () => {
		const { onChange } = renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');

		expect(planOf(onChange)).toEqual({
			colors: new Map([[DOOMED, KEEPER]]), references: new Map(),
		});
	});

	it('drops the method back out of the plan when set back to clear', () => {
		const { onChange } = renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');
		openAndPick(comboboxes()[0], 'referenceRemap.clear');

		expect(planOf(onChange)).toEqual({ colors: new Map(), references: new Map() });
	});

	// The point of the shared generator: a field can name its own method and its
	// own path, which is what a replacement shaped differently needs.
	it('re-points a single field through the reference generator', () => {
		const { onChange } = renderChoices([target()]);

		generateReference('m1', ['token']);

		expect(planOf(onChange)).toEqual({
			colors: new Map(),
			references: new Map([[`${DOOMED}.(response).body.$.id`,
				`${KEEPER}.(response).body.$.token`]]),
		});
	});

	// Body is not the only half of a response a reference can read.
	it('lets a field be re-pointed at a response status instead of a body field', () => {
		const { onChange } = renderChoices([target()]);

		generateReference('m1', [], 'S');

		expect(planOf(onChange)).toEqual({
			colors: new Map(),
			references: new Map([[`${DOOMED}.(response).body.$.id`, `${KEEPER}.(response).status`]]),
		});
	});

	it('takes a field answer back out of the plan when it is reset', () => {
		const { onChange } = renderChoices([target()]);

		generateReference('m1', ['token']);
		fireEvent.click(screen.getByTestId(
			`workflow-reference-remap-reset-${DOOMED}.(response).body.$.id`));

		expect(planOf(onChange)).toEqual({ colors: new Map(), references: new Map() });
	});

	// A field answer stands on its own: it says which method *and* which field,
	// so a method-wide answer underneath it has nothing left to decide.
	it('keeps a field answer alongside a method-wide one', () => {
		const { onChange } = renderChoices([target()]);

		generateReference('m1', ['token']);
		openAndPick(comboboxes()[0], 'm1');

		expect(planOf(onChange)).toEqual({
			colors: new Map([[DOOMED, KEEPER]]),
			references: new Map([[`${DOOMED}.(response).body.$.id`,
				`${KEEPER}.(response).body.$.token`]]),
		});
	});

	it('says so, and offers nothing, when nothing can be read instead', () => {
		renderChoices([target({ candidates: [], sources: [{
			key: `${DOOMED}.(response).body.$.id`, messageProperty: 'body', path: 'id',
			label: 'body.$.id', consumerNodeIds: ['m3'], locations: [{ kind: 'label', value: 'url' }],
			candidates: [] }] })]);
		// Nothing to operate: only the read-only copy of the reference remains.
		expect(comboboxes()).toEqual([]);
		expect(screen.getAllByText('referenceRemap.noCandidates').length).toBeGreaterThan(0);
	});

	// The confirm dialog stacks at 20000 and every popup the generator opens is
	// rendered on document.body, so they open behind it unless told otherwise.
	it('opens the generator popups above the dialog hosting them', () => {
		renderChoices([target()]);

		fireEvent.mouseDown(comboboxes()[1]);

		const zIndexes = [...document.querySelectorAll('.ant-select-dropdown')]
			.map((popup) => Number((popup as HTMLElement).style.zIndex));
		expect(Math.max(...zIndexes)).toBeGreaterThan(20000);
	});

	// Asked once, answered everywhere: the row's method is what each field row
	// starts from, so a field only has to say which field of it to read.
	it('preselects the row method in every field generator', () => {
		const { onChange } = renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');
		// No method picked in the generator itself — straight to its field list.
		pickPath('token');

		expect(planOf(onChange)).toEqual({
			colors: new Map([[DOOMED, KEEPER]]),
			references: new Map([[`${DOOMED}.(response).body.$.id`,
				`${KEEPER}.(response).body.$.token`]]),
		});
	});

	// A path belongs to the method it was picked on, so following a new method
	// cannot keep it.
	it('clears a half-made field answer when the row method changes under it', () => {
		renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');
		pickPath('user');
		openAndPick(comboboxes()[0], 'referenceRemap.clear');

		// Nothing left half-picked: no method, and no path under it.
		expect(screen.getAllByText('placeholders.selectMethod')
			.filter((node) => !node.closest('.referenceRemapSourceHeld')).length).toBe(2);
		expect((comboboxes().at(-1) as HTMLInputElement).value).toBe('');
	});

	// The method-wide list is the union of the fields', so a pick from it can be
	// legal for one field and not another. It must never land on the field that
	// cannot read it — that is the breakage this dialog exists to avoid.
	it('applies a method-wide pick only to the fields that can take it', () => {
		const takesEither = { key: `${DOOMED}.(response).body.$.id`, messageProperty: 'body',
			path: 'id', label: 'body.$.id', consumerNodeIds: ['m3'],
			locations: [{ kind: 'reference' as const, value: '#f5a623.(request).body.$.total' }],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' },
				{ nodeId: 'm9', color: OTHER, label: 'm9' }] };
		const takesOne = { key: `${DOOMED}.(response).body.$.name`, messageProperty: 'body',
			path: 'name', label: 'body.$.name', consumerNodeIds: ['m3'],
			locations: [{ kind: 'label' as const, value: 'url' }],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' }] };
		const { onChange } = renderChoices([target({
			sources: [takesEither, takesOne],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' },
				{ nodeId: 'm9', color: OTHER, label: 'm9' }],
		})]);

		openAndPick(comboboxes()[0], 'm9');

		// Written out per field rather than as one colour substitution, and the
		// field that cannot read m9 is left alone to be answered or cleared.
		expect(planOf(onChange)).toEqual({
			colors: new Map(),
			references: new Map([[`${DOOMED}.(response).body.$.id`,
				`${OTHER}.(response).body.$.id`]]),
		});
	});

	// Where every field can take it, one colour substitution says so — and
	// reaches the references this pass could not enumerate.
	it('moves the whole method in one entry when every field can take it', () => {
		const { onChange } = renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');

		expect(planOf(onChange)).toEqual({
			colors: new Map([[DOOMED, KEEPER]]), references: new Map(),
		});
	});

	// The seed comes from the union above, so it does not always belong in the
	// field below it: where it does not, nothing is selected there rather than a
	// method that row cannot act on.
	it('leaves a field generator empty when the row method is out of its scope', () => {
		// m9 is only readable by the first field. The graph behind the dialog
		// offers m1 to both, so the second row's generator can only take m1.
		const takesEither = { key: `${DOOMED}.(response).body.$.id`, messageProperty: 'body',
			path: 'id', label: 'body.$.id', consumerNodeIds: ['m3'],
			locations: [{ kind: 'reference' as const, value: '#f5a623.(request).body.$.total' }],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' },
				{ nodeId: 'm9', color: OTHER, label: 'm9' }] };
		const takesOne = { key: `${DOOMED}.(response).body.$.name`, messageProperty: 'body',
			path: 'name', label: 'body.$.name', consumerNodeIds: ['m3'],
			locations: [{ kind: 'label' as const, value: 'url' }],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' }] };
		renderChoices([target({
			sources: [takesEither, takesOne],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' },
				{ nodeId: 'm9', color: OTHER, label: 'm9' }],
		})]);

		openAndPick(comboboxes()[0], 'm9');

		// The field that can take m9 is seeded with it; the one that cannot sits
		// unselected rather than showing a method it can do nothing with — its
		// method select and its field select both fall back to the same
		// "pick a method" placeholder. Counted on the editable side only: the
		// "used in" column has selects of its own.
		expect(screen.getAllByText('placeholders.selectMethod')
			.filter((node) => !node.closest('.referenceRemapSourceHeld')).length).toBe(2);
	});

	it('still seeds the fields that can take it', () => {
		renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');

		// Seeded, so the editable method select shows it and its field list is
		// ready: nothing operable is left asking for a method.
		expect(screen.queryAllByText('placeholders.selectMethod')
			.filter((node) => !node.closest('.referenceRemapSourceHeld'))).toEqual([]);
	});

	// Picking a method above is an answer to the whole row, so a half-made answer
	// below it starts over rather than carrying half of itself into the next one.
	it('resets a half-made field answer back to body when the row method is picked', () => {
		renderChoices([target()]);

		// Half-made: a header was chosen, and no field under it yet.
		openAndPick(comboboxes()[1], 'm1');
		clickInEditable('H');
		expect((radios()[1] as HTMLInputElement).checked).toBe(true);

		openAndPick(comboboxes()[0], 'm1');

		// Back to a fresh generator: body selected, no answer recorded.
		expect((radios()[0] as HTMLInputElement).checked).toBe(true);
		expect((comboboxes().at(-1) as HTMLInputElement).value).toBe('');
	});

	// Picking the option already chosen is still an answer — the select reports
	// it as nothing, so the row counts answers rather than changes.
	it('resets the field rows when the same row method is picked again', () => {
		renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');
		openAndPick(comboboxes().at(-1) as HTMLElement, 'user');
		expect((comboboxes().at(-1) as HTMLInputElement).value).toBe('user');

		openAndPick(comboboxes()[0], 'm1');

		expect((comboboxes().at(-1) as HTMLInputElement).value).toBe('');
		expect(document.querySelector('.bodyLegacyGeneratorAction')).toBeNull();
	});

	it('clears a field picked in the generator when the row method changes', () => {
		renderChoices([target()]);

		openAndPick(comboboxes()[1], 'm1');
		openAndPick(comboboxes().at(-1) as HTMLElement, 'user');

		openAndPick(comboboxes()[0], 'm1');

		expect((comboboxes().at(-1) as HTMLInputElement).value).toBe('');
	});

	// A reset replaces the controls rather than asking them to clear: antd keeps
	// display state of its own, and clearing what we own does not clear that.
	it('gives the field row fresh controls on every reset', () => {
		renderChoices([target()]);

		openAndPick(comboboxes()[0], 'm1');
		const [, methodBefore, fieldBefore] = comboboxes();
		openAndPick(comboboxes().at(-1) as HTMLElement, 'user');

		openAndPick(comboboxes()[0], 'm1');

		// Different DOM nodes: the controls were replaced, so nothing antd was
		// holding on to survived to be displayed.
		const [, methodAfter, fieldAfter] = comboboxes();
		expect(methodAfter).not.toBe(methodBefore);
		expect(fieldAfter).not.toBe(fieldBefore);
	});

	it('lays the fields out as a table of what is read and what replaces it', () => {
		renderChoices([target()]);

		const [currentColumn, heldColumn, newColumn] = screen.getAllByRole('columnheader');
		expect(currentColumn.textContent).toBe('referenceRemap.columnCurrent');
		expect(heldColumn.textContent).toBe('referenceRemap.columnHeld');
		expect(newColumn.textContent).toBe('referenceRemap.columnNew');
		// One row per field of the deleted method that something reads, each
		// showing the reference it is about in the same controls as its answer.
		expect(screen.getAllByRole('row')).toHaveLength(target().sources.length + 1);
		const current = document.querySelector('.referenceRemapSourceCurrent') as HTMLElement;
		expect(current.title).toBe(`${DOOMED}.(response).body.$.id`);
		// The field, without the method: that is the one being deleted, and the
		// row above the table already names it.
		expect(current.querySelectorAll('[role="combobox"][disabled]').length).toBe(1);
	});

	// The button is one more thing to find after the last dropdown closes, and an
	// answer left unpressed is an answer silently lost.
	it('has no apply button — a whole reference lands as it is picked', () => {
		const { onChange } = renderChoices([target()]);

		openAndPick(comboboxes()[1], 'm1');
		expect(document.querySelector('.bodyLegacyGeneratorAction')).toBeNull();

		// Drilling in is not answering: `user` is an object, so nothing is
		// recorded while the picker can still be opened further.
		pickPath('user');
		expect(onChange).not.toHaveBeenCalled();

		pickPath('token');

		expect(planOf(onChange)).toEqual({
			colors: new Map(),
			references: new Map([[`${DOOMED}.(response).body.$.id`,
				`${KEEPER}.(response).body.$.token`]]),
		});
	});

	// The Select primitive reads a falsy value as "nothing selected" — that is
	// what makes its placeholder work — so an option valued '' could be picked
	// but never showed as picked. Clearing carries a value of its own instead.
	it('offers clearing as a value the select can actually show', () => {
		expect(emptyChoice().replacement).toBeTruthy();

		const { onChange } = renderChoices([target()]);
		openAndPick(comboboxes()[0], 'm1');
		openAndPick(comboboxes()[0], 'referenceRemap.clear');

		// Still means "clear" to everything downstream.
		expect(planOf(onChange)).toEqual({ colors: new Map(), references: new Map() });
	});

	// The row picks methods, so it picks them the way the rest of the editor
	// does — the same control, with the colour dot and connector chip.
	it('draws its method options the way the reference generator does', () => {
		renderChoices([target()]);

		// openAndPick's own opening logic, without the pick.
		openAndPick(comboboxes()[0], 'referenceRemap.clear');
		const option = optionIn(comboboxes()[0], 'm1')
			|| [...document.querySelectorAll('.ant-select-item-option')]
				.find((item) => item.textContent?.includes('m1'));

		// The generator's own option markup, not a plain label.
		expect(option?.querySelector('.bodyLegacyMethodOptionLabel')?.textContent).toBe('m1');
	});

	// Every elided string in the dialog has to be readable in full somewhere.
	it('carries the whole value as a hover hint wherever it is elided', () => {
		const longPath = 'items[0].deeply.nested.attributes.identifier';
		const source = { key: `${DOOMED}.(response).body.$.${longPath}`, messageProperty: 'body',
			path: longPath, label: `body.$.${longPath}`, consumerNodeIds: ['m3'],
			locations: [{ kind: 'reference' as const, value: '#f5a623.(request).body.$.total' }],
			candidates: [{ nodeId: 'm1', color: KEEPER, label: 'm1' }] };
		const { onChange } = renderChoices([target({ sources: [source] })]);

		expect((document.querySelector('.referenceRemapSourceCurrent') as HTMLElement).title)
			.toBe(source.key);
		expect(screen.getByText('Get users').title).toBe('Get users');
		expect(onChange).not.toHaveBeenCalled();
	});

	// The generator is how the answer is adjusted, so replacing it with the text
	// of the answer took away the means to change it.
	it('keeps the reference controls on screen and shows the answer in them', () => {
		renderChoices([target()]);

		openAndPick(comboboxes()[1], 'm1');
		pickPath('token');

		// Still a method select and a field select, now holding the answer.
		expect(comboboxes()).toHaveLength(3);
		expect((comboboxes().at(-1) as HTMLInputElement).value).toBe('token');
		// And a way to take the answer back.
		expect(screen.getByTestId(
			`workflow-reference-remap-reset-${DOOMED}.(response).body.$.id`)).toBeTruthy();
	});

	// Which of the reader's own fields is about to change is the thing a user
	// checks before agreeing to any of this.
	it('shows where each reference is used, as the field it fills', () => {
		renderChoices([target()]);

		const held = document.querySelector('.referenceRemapSourceHeld') as HTMLElement;

		expect(held.title).toBe('#f5a623.(request).body.$.total');
		// The same controls as the columns beside it, disabled.
		expect(held.querySelectorAll('[role="combobox"][disabled]').length).toBe(2);
		// Its part named rather than switched, like the column before it.
		expect(held.querySelectorAll('[role="radio"]')).toHaveLength(0);
		expect(held.querySelector('.bodyLegacyGeneratorResponseText')?.textContent?.trim())
			.toBe('B');
		// And its method resolved rather than sitting on the placeholder: a step's
		// own request is never upstream of itself, so a display that filtered by
		// what it may read would show nothing here.
		expect([...held.querySelectorAll('*')]
			.some((node) => node.textContent === 'placeholders.selectMethod')).toBe(false);
	});

	// A URL argument or an operator condition has no field to name.
	it('names the part of the request when a reference has no field to fill', () => {
		renderChoices([target({ sources: [{ ...target().sources[0],
			locations: [{ kind: 'label', value: 'url' }] }] })]);

		const held = document.querySelector('.referenceRemapSourceHeld') as HTMLElement;

		expect(held.textContent).toBe('url');
		expect(held.querySelectorAll('[role="combobox"]')).toHaveLength(0);
	});

	// Re-pointing moves every copy at once, so there is nothing to answer per
	// place — the rest are counted.
	it('counts the other places one reference is held', () => {
		renderChoices([target({ sources: [{ ...target().sources[0], locations: [
			{ kind: 'reference', value: '#f5a623.(request).body.$.total' },
			{ kind: 'label', value: 'url' },
		] }] })]);

		expect(screen.getByText('referenceRemap.alsoHeld')).toBeTruthy();
	});

	// The part of the response is a fact there, not a choice: one word rather
	// than a switch nobody can operate.
	it('names the response part in the current reference instead of offering it', () => {
		renderChoices([target()]);

		const current = document.querySelector('.referenceRemapSourceCurrent') as HTMLElement;

		expect(current.querySelectorAll('[role="radio"]')).toHaveLength(0);
		const part = current.querySelector('.bodyLegacyGeneratorResponseText');
		// The switch's own letter, with the word it stands for on hover.
		expect(part?.textContent?.trim()).toBe('B');
		expect((part as HTMLElement).title).toBe('body');
	});

	// An operator's condition can only be answered by rewriting it — there is no
	// preview toggle any more, and the action lives in the "New reference"
	// column, the same place every other row's answer lives, rather than as a
	// lone icon next to "where is it used".
	it('answers an operator-held reference with a "rewrite the condition" button in the New reference column', () => {
		renderChoices([target({ sources: [{ ...target().sources[0],
			locations: [{ kind: 'operator', value: 'Only new ones', nodeId: 'if-1' }] }] })]);

		const held = document.querySelector('.referenceRemapSourceHeld') as HTMLElement;
		const value = document.querySelector('.referenceRemapSourceValue') as HTMLElement;
		expect(held.textContent).toBe('Only new ones');
		const rewriteButton = screen.getByTestId(
			`workflow-reference-remap-edit-condition-${DOOMED}.(response).body.$.id`);
		expect(value.contains(rewriteButton)).toBe(true);
		// The old preview toggle is gone, and so is the boilerplate "nothing else
		// can be read from here" message this row always used to fall back to.
		expect(screen.queryByTestId(
			`workflow-reference-remap-condition-${DOOMED}.(response).body.$.id`)).toBeNull();
		expect(value.textContent).not.toContain('referenceRemap.noCandidates');
	});

	// The reference an operator's condition holds still names the method being
	// deleted, so the "Current reference" column reads it the same way a
	// method-held reference does — not as a bare string fallback.
	it('draws the current reference for an operator-held field with the same controls as a method-held one', () => {
		renderChoices([target({ sources: [{ ...target().sources[0],
			locations: [{ kind: 'operator', value: 'Only new ones', nodeId: 'if-1' }] }] })]);

		const current = document.querySelector('.referenceRemapSourceCurrent') as HTMLElement;
		expect(current.querySelectorAll('[role="combobox"][disabled]').length).toBeGreaterThan(0);
	});

	// The crux of "applied only on Delete": the editor writes into this dialog's
	// plan, never into the graph, so the nodes it was handed come back untouched
	// and Cancel is a no-op by construction rather than by care.
	it('stages a rewritten condition in the plan instead of on the graph', () => {
		const operatorSource = { ...target().sources[0],
			locations: [{ kind: 'operator' as const, value: 'Only new ones', nodeId: 'if-1' }] };
		const before = JSON.stringify(ifOperator.data.conditionConfig);
		const { onChange } = renderChoices([target({ sources: [operatorSource] })]);

		fireEvent.click(screen.getByTestId(
			`workflow-reference-remap-edit-condition-${operatorSource.key}`));
		// The operator's own editor, opened on a copy of the condition.
		fireEvent.click(screen.getByTestId('workflow-condition-save'));

		const plan = (onChange.mock.lastCall?.[0] as ReferenceRemapPlan);
		expect(plan.conditionConfigs?.has('if-1')).toBe(true);
		// The graph it was handed is exactly as it was.
		expect(JSON.stringify(ifOperator.data.conditionConfig)).toBe(before);
	});

	it('opens the editor on the rewrite once there is one', () => {
		const operatorSource = { ...target().sources[0],
			locations: [{ kind: 'operator' as const, value: 'Only new ones', nodeId: 'if-1' }] };
		renderChoices([target({ sources: [operatorSource] })]);

		fireEvent.click(screen.getByTestId(
			`workflow-reference-remap-edit-condition-${operatorSource.key}`));
		fireEvent.click(screen.getByTestId('workflow-condition-save'));

		// Reopened: still the dialog's own copy, not the graph's condition.
		fireEvent.click(screen.getByTestId(
			`workflow-reference-remap-edit-condition-${operatorSource.key}`));
		expect(screen.getByTestId('workflow-condition-save')).toBeTruthy();
	});
});
