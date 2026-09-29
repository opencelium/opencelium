import { describe, expect, it } from 'vitest';
import { policyEngine } from './PolicyEngine';
import { policyResolverRegistry } from './resolvers';
import type { PolicyContext, PolicyContextUser, PolicyDefinition, PolicyRule } from './types';

const user = (over: Partial<PolicyContextUser> = {}): PolicyContextUser =>
	({ id: 1, roles: [], permissions: [], ...over });

const context = (over: Partial<PolicyContext> = {}): PolicyContext =>
	({ user: user(), ...over });

const policy = (rules: PolicyRule[], strategy?: PolicyDefinition['strategy']): PolicyDefinition =>
	({ ...(strategy ? { strategy } : {}), rules });

const allowAll: PolicyRule = { effect: 'allow' };

/** Unique per call: the resolver registry is a module-level singleton shared by every test. */
let resolverSeq = 0;
const withResolver = (resolver: (ctx: PolicyContext) => boolean) => {
	const key = `test-resolver-${(resolverSeq += 1)}`;
	policyResolverRegistry.register(key, resolver);
	return key;
};

describe('PolicyEngine — no policy', () => {
	/** An undefined policy is the common case: most fields declare no access at all. */
	it('allows when no policy is defined', () => {
		expect(policyEngine.evaluate(undefined, context()))
			.toEqual({ allowed: true, strategy: 'allow' });
	});

	it('denies when the policy has no rules at all', () => {
		expect(policyEngine.evaluate(policy([]), context()))
			.toMatchObject({ allowed: false, strategy: 'hide' });
	});
});

describe('PolicyEngine — rule matching', () => {
	it('allows on an unconstrained allow rule', () => {
		expect(policyEngine.evaluate(policy([allowAll]), context()).allowed).toBe(true);
	});

	it('denies when no rule matches', () => {
		const decision = policyEngine.evaluate(
			policy([{ effect: 'allow', roles: ['admin'] }]),
			context({ user: user({ roles: ['viewer'] }) }),
		);

		expect(decision.allowed).toBe(false);
		/** Nothing matched, so there is no rule to report. */
		expect(decision.matchedRule).toBeUndefined();
	});

	it('returns the rule that granted access', () => {
		const rule: PolicyRule = { effect: 'allow', roles: ['admin'] };

		expect(policyEngine.evaluate(policy([rule]), context({ user: user({ roles: ['admin'] }) })))
			.toMatchObject({ allowed: true, matchedRule: rule });
	});

	describe('roles and permissions are any-of', () => {
		it('matches when the user holds one of several roles', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', roles: ['admin', 'editor'] }]),
				context({ user: user({ roles: ['editor'] }) }),
			).allowed).toBe(true);
		});

		it('matches when the user holds one of several permissions', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', permissions: ['USER.CREATE', 'USER.UPDATE'] }]),
				context({ user: user({ permissions: ['USER.UPDATE'] }) }),
			).allowed).toBe(true);
		});

		/** Constraints on one rule are all-of: every declared dimension has to hold. */
		it('requires every declared dimension of a rule to hold', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', roles: ['admin'], permissions: ['USER.CREATE'] }]),
				context({ user: user({ roles: ['admin'], permissions: [] }) }),
			).allowed).toBe(false);
		});
	});

	describe('modes', () => {
		it('matches only the listed modes', () => {
			const restricted = policy([{ effect: 'allow', modes: ['create'] }]);

			expect(policyEngine.evaluate(restricted, context({ mode: 'create' })).allowed).toBe(true);
			expect(policyEngine.evaluate(restricted, context({ mode: 'update' })).allowed).toBe(false);
		});

		/** A mode-scoped rule cannot match a context that names no mode. */
		it('does not match when the context carries no mode', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', modes: ['create'] }]),
				context(),
			).allowed).toBe(false);
		});
	});

	/** An empty list is "unconstrained", not "matches nothing" — the guards check length. */
	it.each([
		['roles', { effect: 'allow', roles: [] } as PolicyRule],
		['permissions', { effect: 'allow', permissions: [] } as PolicyRule],
		['modes', { effect: 'allow', modes: [] } as PolicyRule],
	])('treats an empty %s list as no restriction', (_dimension, rule) => {
		expect(policyEngine.evaluate(policy([rule]), context()).allowed).toBe(true);
	});

	describe('condition (ABAC)', () => {
		it('matches on the condition result and receives the context', () => {
			const seen: PolicyContext[] = [];
			const decision = policyEngine.evaluate(
				policy([{ effect: 'allow', condition: (ctx) => { seen.push(ctx); return ctx.entity === 'user'; } }]),
				context({ entity: 'user' }),
			);

			expect(decision.allowed).toBe(true);
			expect(seen[0].entity).toBe('user');
		});

		it('does not match when the condition returns false', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', condition: () => false }]),
				context(),
			).allowed).toBe(false);
		});

		/** A throwing condition must not take the app down, and must not grant access. */
		it('treats a throwing condition as not matching', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', condition: () => { throw new Error('boom'); } }]),
				context(),
			).allowed).toBe(false);
		});
	});

	describe('resolver (PBAC)', () => {
		it('matches on the resolver result', () => {
			const key = withResolver(() => true);

			expect(policyEngine.evaluate(policy([{ effect: 'allow', resolver: key }]), context()).allowed)
				.toBe(true);
		});

		it('does not match when the resolver returns false', () => {
			const key = withResolver(() => false);

			expect(policyEngine.evaluate(policy([{ effect: 'allow', resolver: key }]), context()).allowed)
				.toBe(false);
		});

		/** An unregistered name is a configuration error; it must fail closed. */
		it('does not match when the resolver is not registered', () => {
			expect(policyEngine.evaluate(
				policy([{ effect: 'allow', resolver: 'never-registered' }]),
				context(),
			).allowed).toBe(false);
		});

		it('treats a throwing resolver as not matching', () => {
			const key = withResolver(() => { throw new Error('boom'); });

			expect(policyEngine.evaluate(policy([{ effect: 'allow', resolver: key }]), context()).allowed)
				.toBe(false);
		});
	});
});

describe('PolicyEngine — deny precedence', () => {
	const denyRule: PolicyRule = { effect: 'deny' };

	/** Explicit deny overrides any allow — the standard security pattern. */
	it.each([
		['deny listed first', [denyRule, allowAll]],
		['deny listed last', [allowAll, denyRule]],
	])('denies when a deny rule matches, with %s', (_order, rules) => {
		expect(policyEngine.evaluate(policy(rules as PolicyRule[]), context()))
			.toMatchObject({ allowed: false, matchedRule: denyRule });
	});

	/**
	 * Priority orders evaluation but cannot rescue an allow: a matching deny returns
	 * immediately wherever in the order it is reached.
	 */
	it('denies even when a matching allow has the higher priority', () => {
		expect(policyEngine.evaluate(
			policy([{ effect: 'allow', priority: 10 }, { effect: 'deny', priority: 1 }]),
			context(),
		).allowed).toBe(false);
	});

	it('ignores a deny rule that does not match the user', () => {
		expect(policyEngine.evaluate(
			policy([allowAll, { effect: 'deny', roles: ['banned'] }]),
			context({ user: user({ roles: ['editor'] }) }),
		).allowed).toBe(true);
	});

	it('does not reorder the caller\'s rules array', () => {
		const rules: PolicyRule[] = [{ effect: 'allow', priority: 1 }, { effect: 'allow', priority: 9 }];

		policyEngine.evaluate(policy(rules), context());

		expect(rules.map((rule) => rule.priority)).toEqual([1, 9]);
	});
});

describe('PolicyEngine — strategy resolution', () => {
	it('defaults to allow when access is granted', () => {
		expect(policyEngine.evaluate(policy([allowAll]), context()).strategy).toBe('allow');
	});

	/** Denial hides by default: the safest thing to do with something unproven. */
	it('defaults to hide when access is denied', () => {
		expect(policyEngine.evaluate(policy([{ effect: 'deny' }]), context()).strategy).toBe('hide');
	});

	it.each(['hide', 'disable', 'forbid'] as const)('uses the declared %s strategy on denial',
		(strategy) => {
			expect(policyEngine.evaluate(policy([{ effect: 'deny' }], strategy), context()).strategy)
				.toBe(strategy);
		});

	/**
	 * The declared strategy is echoed back even when access is *granted* — it says what
	 * would happen on denial, not what is happening now. Consumers must branch on
	 * `allowed`; reading `strategy` alone reports a permitted field as hidden.
	 */
	it('echoes the declared strategy on the allow path too', () => {
		expect(policyEngine.evaluate(policy([allowAll], 'hide'), context()))
			.toEqual({ allowed: true, strategy: 'hide', matchedRule: allowAll });
	});
});

describe('policyResolverRegistry', () => {
	it('reports and returns a registered resolver', () => {
		const resolver = () => true;
		policyResolverRegistry.register('registry-probe', resolver);

		expect(policyResolverRegistry.has('registry-probe')).toBe(true);
		expect(policyResolverRegistry.get('registry-probe')).toBe(resolver);
	});

	it('reports an unknown key as absent', () => {
		expect(policyResolverRegistry.has('absent')).toBe(false);
		expect(policyResolverRegistry.get('absent')).toBeUndefined();
	});

	describe('the built-in owner resolver', () => {
		const owner = () => policyResolverRegistry.get('owner')!;

		it('matches when the record belongs to the user', () => {
			expect(owner()(context({ record: { ownerId: 1 } }))).toBe(true);
		});

		it('does not match another user\'s record', () => {
			expect(owner()(context({ record: { ownerId: 2 } }))).toBe(false);
		});

		/** No record to compare against means no ownership claim. */
		it('does not match when there is no record', () => {
			expect(owner()(context())).toBe(false);
		});
	});
});
