import { describe, expect, it } from 'vitest';
import { i18n } from '@shared/i18n/config/i18n';
import type { EntityDefinition, FieldDefinition } from '../EntityDefinition';
import type { PolicyContext, PolicyDefinition } from '@/engine/policy';
import { buildFieldSchema, buildZodSchema } from './buildZodSchema';

/**
 * Messages are resolved through i18n rather than hard-coded, so this suite pins the
 * wiring (the `error` namespace is reached, interpolation runs) without breaking every
 * time someone rewords the copy.
 */
const tError = i18n.getFixedT(i18n.language, 'error');

const field = (over: Partial<FieldDefinition>): FieldDefinition => ({
	name: 'value',
	type: 'string',
	ui: { component: 'input' },
	...over,
}) as FieldDefinition;

const entityOf = (fields: FieldDefinition[]) =>
	({ name: 'test-entity', fields }) as unknown as EntityDefinition;

const context = (over: Partial<PolicyContext> = {}): PolicyContext => ({
	user: { id: 1, roles: [], permissions: [] },
	...over,
});

/** The issue messages for a value, or `null` when it parsed. */
const errorsFor = (schema: ReturnType<typeof buildFieldSchema>, value: unknown) => {
	const result = schema.safeParse(value);
	return result.success ? null : result.error.issues.map((issue) => issue.message);
};

const parseField = (definition: FieldDefinition, value: unknown) =>
	buildFieldSchema(definition, false, 'create').safeParse(value);

describe('buildFieldSchema — required', () => {
	const required = field({ validation: { required: true } });

	it.each([undefined, null, ''])('rejects %p', (value) => {
		expect(errorsFor(buildFieldSchema(required, false), value))
			.toEqual([tError('field.required')]);
	});

	/** A space-only value looks filled to the user but carries nothing. */
	it('rejects a whitespace-only string', () => {
		expect(errorsFor(buildFieldSchema(required, false), '   '))
			.toEqual([tError('field.required')]);
	});

	it('rejects an empty array but accepts a populated one', () => {
		const arrayField = field({ type: 'array', validation: { required: true } });
		expect(parseField(arrayField, []).success).toBe(false);
		expect(parseField(arrayField, ['a']).success).toBe(true);
	});

	/** `false` and `0` are answers, not absences. */
	it.each([
		['boolean', 'false', field({ type: 'boolean', validation: { required: true } }), false],
		['number', 'zero', field({ type: 'number', validation: { required: true } }), 0],
	])('accepts a %s %s', (_type, _label, definition, value) => {
		expect(parseField(definition as FieldDefinition, value).success).toBe(true);
	});

	it('accepts undefined and null when the field is optional', () => {
		const optional = buildFieldSchema(field({}), false);
		expect(optional.safeParse(undefined).success).toBe(true);
		expect(optional.safeParse(null).success).toBe(true);
	});
});

describe('buildFieldSchema — string', () => {
	it('enforces min and max length, interpolating the bound', () => {
		const bounded = field({ validation: { required: true, min: 3, max: 5 } });
		expect(errorsFor(buildFieldSchema(bounded, false), 'ab'))
			.toEqual([tError('field.minLength', { min: 3 })]);
		expect(errorsFor(buildFieldSchema(bounded, false), 'abcdef'))
			.toEqual([tError('field.maxLength', { max: 5 })]);
		expect(parseField(bounded, 'abcd').success).toBe(true);
	});

	/** An optional field left blank is not a length violation. */
	it('skips length checks for an empty optional value', () => {
		expect(parseField(field({ validation: { min: 3 } }), '').success).toBe(true);
	});

	it('validates an email address', () => {
		const email = field({ validation: { required: true, email: true } });
		expect(errorsFor(buildFieldSchema(email, false), 'nope'))
			.toEqual([tError('field.invalidEmail')]);
		expect(parseField(email, 'user@example.com').success).toBe(true);
	});

	/** Every rule is reported, not just the first — the user fixes one pass, not three. */
	it('reports each failing regex rule with its own message', () => {
		const patterned = field({ validation: { required: true, regex: [
			{ pattern: /^[a-z]+$/, message: 'letters only' },
			{ pattern: /^.{5,}$/, message: 'at least five characters' },
		] } });
		expect(errorsFor(buildFieldSchema(patterned, false), 'A1'))
			.toEqual(['letters only', 'at least five characters']);
		expect(parseField(patterned, 'abcde').success).toBe(true);
	});

	it('rejects a non-string', () => {
		expect(parseField(field({ validation: { required: true } }), 42).success).toBe(false);
	});
});

describe('buildFieldSchema — number', () => {
	const numeric = field({ type: 'number', validation: { required: true } });

	/** Inputs hand back strings; the schema is what turns one into a number. */
	it('coerces a numeric string to a number', () => {
		expect(parseField(numeric, '42')).toMatchObject({ success: true, data: 42 });
	});

	it('rejects a non-numeric string', () => {
		expect(parseField(numeric, 'abc').success).toBe(false);
	});

	it('rejects an empty required value', () => {
		expect(errorsFor(buildFieldSchema(numeric, false), ''))
			.toEqual([tError('field.required')]);
	});
});

describe('buildFieldSchema — file', () => {
	const upload = field({ type: 'file', validation: { required: true } });

	/** Three shapes are legitimate: a freshly picked File, a stored path, or nothing. */
	it('accepts a File and a server-stored path', () => {
		expect(parseField(upload, new File(['a'], 'a.txt')).success).toBe(true);
		expect(parseField(upload, 'uploads/logo.png').success).toBe(true);
	});

	it('rejects a value that is neither a File nor a path', () => {
		expect(parseField(upload, 42).success).toBe(false);
	});

	it('rejects a File over the size limit, naming the limit', () => {
		const capped = field({ type: 'file', validation: { required: true, max: 2 } });
		expect(errorsFor(buildFieldSchema(capped, false), new File(['too long'], 'big.txt')))
			.toEqual([tError('field.fileTooLarge', { max: 2 })]);
	});
});

describe('buildFieldSchema — custom validators', () => {
	const rule = { validate: (value: unknown) => value === 'ok', message: 'must be ok' };

	it('reports the rule message when the value fails', () => {
		const custom = field({ validation: { required: true, custom: [rule] } });
		expect(errorsFor(buildFieldSchema(custom, false), 'no')).toEqual(['must be ok']);
		expect(parseField(custom, 'ok').success).toBe(true);
	});

	/** An optional field left blank should not be told it is the wrong shape. */
	it.each([undefined, null, ''])('skips an optional empty value (%p)', (value) => {
		expect(parseField(field({ validation: { custom: [rule] } }), value).success).toBe(true);
	});

	it('receives the value and the mode', () => {
		const calls: unknown[][] = [];
		const schema = buildFieldSchema(field({ validation: { required: true, custom: [
			{ validate: (...args: unknown[]) => { calls.push(args); return true; }, message: 'm' },
		] } }), false, 'update');

		schema.safeParse('typed');

		expect(calls[0][0]).toBe('typed');
		expect(calls[0][2]).toBe('update');
	});
});

describe('buildFieldSchema — skipValidation', () => {
	/** What a hidden field gets: nothing is enforced, and any value is let through. */
	it('accepts anything, including a value the field is not typed for', () => {
		const schema = buildFieldSchema(field({ validation: { required: true } }), true);
		expect(schema.safeParse(undefined).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(true);
		expect(schema.safeParse(999).success).toBe(true);
	});
});

describe('buildZodSchema — shape', () => {
	it('nests a dotted field name into nested objects', () => {
		const schema = buildZodSchema(entityOf([
			field({ name: 'top', validation: { required: true } }),
			field({ name: 'nested.inner', validation: { required: true } }),
			field({ name: 'nested.count', type: 'number' }),
		]), context({ mode: 'create' }));

		expect(Object.keys(schema.shape)).toEqual(['top', 'nested']);
		expect(schema.safeParse({ top: 'a', nested: { inner: 'b', count: '3' } }))
			.toMatchObject({ success: true, data: { top: 'a', nested: { inner: 'b', count: 3 } } });
	});

	it('groups several leaves under one branch and nests further', () => {
		const schema = buildZodSchema(entityOf([
			field({ name: 'a.b.c', validation: { required: true } }),
			field({ name: 'a.b.d' }),
			field({ name: 'a.e' }),
		]), context());

		expect(schema.safeParse({ a: { b: { c: 'x', d: 'y' }, e: 'z' } }).success).toBe(true);
	});

	it('reports a failure at the path of the offending leaf', () => {
		const schema = buildZodSchema(entityOf([
			field({ name: 'top', validation: { required: true } }),
			field({ name: 'nested.inner', validation: { required: true } }),
		]), context());

		const result = schema.safeParse({ top: '', nested: { inner: '' } });

		expect(result.success).toBe(false);
		expect(result.error!.issues.map((issue) => issue.path)).toEqual([['top'], ['nested', 'inner']]);
	});

	it('strips a key no field declares', () => {
		const schema = buildZodSchema(entityOf([field({ name: 'top' })]), context());

		expect(schema.safeParse({ top: 'a', stray: 'dropped' }))
			.toMatchObject({ success: true, data: { top: 'a' } });
	});
});

describe('buildZodSchema — access policy', () => {
	const denyWith = (strategy?: PolicyDefinition['strategy']): PolicyDefinition => ({
		...(strategy ? { strategy } : {}),
		rules: [{ effect: 'deny' }],
	});
	const secret = (access: PolicyDefinition) =>
		buildZodSchema(entityOf([field({ name: 'secret', validation: { required: true }, access })]),
			context({ mode: 'create' }));

	/**
	 * A field the user cannot see must not be able to block the form: they have no way to
	 * satisfy a rule about a control that was never rendered.
	 */
	it('drops validation for a field hidden by policy', () => {
		expect(secret(denyWith('hide')).safeParse({}).success).toBe(true);
	});

	/** `hide` is also what an unspecified strategy resolves to on denial. */
	it('drops validation when a denial falls back to the default strategy', () => {
		expect(secret(denyWith()).safeParse({}).success).toBe(true);
	});

	/** Visible but locked: the value still has to be valid when it is submitted. */
	it.each(['disable', 'forbid'] as const)('keeps validation for a %s field', (strategy) => {
		expect(secret(denyWith(strategy)).safeParse({}).success).toBe(false);
	});

	it('keeps validation for a field the policy allows', () => {
		expect(secret({ rules: [{ effect: 'allow' }] }).safeParse({}).success).toBe(false);
	});

	it('evaluates the policy against the field name as the resource', () => {
		const seen: (string | undefined)[] = [];
		buildZodSchema(entityOf([field({
			name: 'watched',
			access: { rules: [{ effect: 'allow', condition: (ctx) => { seen.push(ctx.resource); return true; } }] },
		})]), context({ mode: 'update' }));

		expect(seen).toEqual(['watched']);
	});
});

/**
 * Behaviour that is wrong but currently shipped. Each test asserts what the code *should*
 * do and is marked `.fails`, so the suite stays green while the defect stands and turns
 * red the moment someone fixes it — at which point drop the `.fails`.
 */
describe('known defects', () => {
	/**
	 * `(schema as z.ZodNumber).min()` is a lie: after `.pipe(z.preprocess(...))` the schema
	 * is a pipe, not a ZodNumber, so building *any* number field with min or max throws
	 * `schema.min is not a function` and the form cannot render at all.
	 */
	it.fails('applies min and max to a number field', () => {
		const bounded = field({ type: 'number', validation: { required: true, min: 5, max: 10 } });
		expect(parseField(bounded, 4).success).toBe(false);
		expect(parseField(bounded, 7).success).toBe(true);
	});

	/**
	 * The required refine runs before the superRefine that honours `allowEmptyString`, so
	 * an empty value is rejected first and the flag never takes effect. With `required`
	 * false an empty string is already accepted, which leaves the flag dead in both cases.
	 */
	it.fails('lets a required field accept an empty string when allowEmptyString is set', () => {
		const permissive = field({ validation: { required: true, allowEmptyString: true } });
		expect(parseField(permissive, '').success).toBe(true);
	});

	/**
	 * Clearing an optional number input hands back `''`. The preprocess turns that into
	 * `undefined`, `z.number()` then rejects it, and the outer `.optional()` cannot help
	 * because it only short-circuits an input that was already undefined — so an untouched
	 * optional number field blocks submission.
	 */
	it.fails('accepts an empty string for an optional number field', () => {
		expect(parseField(field({ type: 'number' }), '').success).toBe(true);
	});

	/**
	 * `skipValidation` reads `decision.strategy === 'hide'` without also reading
	 * `decision.allowed`, and resolveStrategy echoes the policy's own strategy on the
	 * *allow* path too. So a field carrying `strategy: 'hide'` loses its validation for
	 * exactly the users the policy lets through — the field renders, they type into it,
	 * and nothing is enforced. Latent today: the only field-level `strategy: 'hide'` is
	 * commented out in user.definition.tsx, and the buildActionAccess call sites are
	 * command nodes, which this builder never sees.
	 */
	it.fails('keeps validation for a hide-strategy field the policy allows', () => {
		const schema = buildZodSchema(entityOf([field({
			name: 'organization',
			validation: { required: true },
			access: { strategy: 'hide', rules: [{ effect: 'allow', roles: ['admin'] }] },
		})]), context({ user: { id: 1, roles: ['admin'], permissions: [] }, mode: 'create' }));

		expect(schema.safeParse({}).success).toBe(false);
	});

	/**
	 * Custom validators are handed `{}` as the form values, so a rule that needs a sibling
	 * field ("confirm password matches password") cannot be written.
	 */
	it.fails('hands custom validators the other field values', () => {
		const calls: unknown[][] = [];
		buildFieldSchema(field({ validation: { required: true, custom: [
			{ validate: (...args: unknown[]) => { calls.push(args); return true; }, message: 'm' },
		] } }), false, 'create').safeParse('typed');

		expect(calls[0][1]).not.toEqual({});
	});
});
