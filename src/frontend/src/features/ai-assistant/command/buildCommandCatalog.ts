import type { TFunction } from 'i18next';
import { policyEngine, type PolicyContext } from '@/engine/policy';
import { entityRegistry } from '@/engine/entity/EntityRegistry';
import type { CommandEffect, CommandNode, SuggestionOption } from '@shared/command/types';
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types';

export type CatalogEntry = {
	/** The phrase with its placeholder; stable, so it doubles as the id. */
	id: string;
	phrase: string;
	/** The words to type before the value, or the whole command when it takes none. */
	prefix: string;
	/** For the model and the embedding: what it does and what it acts on, in English and German. */
	description: string;
	/** The palette's own description (common namespace), shown to the user in their language. */
	descriptionKey?: string;
	icon?: IconName;
	effect: CommandEffect;
	argument?: { name: string; resolve?: (input?: unknown) => Promise<SuggestionOption[]> };
};

type Translators = { en: TFunction; de: TFunction };
type Path = {
	words: string[];
	aliases: string[];
	descriptionKey?: string;
	effect?: CommandEffect;
	entityName?: string;
	icon?: IconName;
};

// Unknown keys come back as the key itself; that is noise for the model.
const translated = (t: TFunction, key: string | undefined, ns: string) => {
	if (!key) return '';
	const text = t(key, { ns });
	return text === key ? '' : text.replace(/<[^>]+>/g, '');
};

function describe(path: Path, t: Translators): string {
	const what = [translated(t.en, path.descriptionKey, 'common'), translated(t.de, path.descriptionKey, 'common')]
		.filter(Boolean).join(' · ');
	let entity = '';
	if (path.entityName && entityRegistry.has(path.entityName)) {
		const titleKey = entityRegistry.get(path.entityName).list?.titleKey;
		const [en, de] = [translated(t.en, titleKey, 'entities'), translated(t.de, titleKey, 'entities')];
		entity = en && de && en !== de ? `${en} (${de})` : en || de;
	}
	const aliases = path.aliases.length ? `Also: ${path.aliases.join(', ')}` : '';
	return [what, entity, aliases].filter(Boolean).join('. ');
}

/**
 * Every command this user may run, flattened from the live tree with the same access checks as the palette: the AI only
 * ever sees (and so can only propose) commands the user could type. A command ends at its first executable node; a value
 * placeholder (`entity`/`argument` node) may only come last, which is how the parser reads it too.
 */
export function buildCommandCatalog(tree: CommandNode<unknown>[], policyContext: PolicyContext, t: Translators): CatalogEntry[] {
	const entries: CatalogEntry[] = [];
	const isAccessible = (node: CommandNode<unknown>) => !node.access || policyEngine.evaluate(node.access, policyContext).allowed;

	const visit = (node: CommandNode<unknown>, path: Path) => {
		if (!isAccessible(node)) return;
		const next: Path = {
			words: node.type === 'literal' && node.value ? [...path.words, node.value] : path.words,
			aliases: [...path.aliases, ...(node.aliases ?? [])],
			descriptionKey: node.description ?? path.descriptionKey,
			effect: node.effect ?? path.effect,
			entityName: node.entityName ?? path.entityName,
			icon: path.icon ?? node.icon,
		};
		if (node.type !== 'literal') {
			if (!node.execute || !node.name || !next.words.length) return;
			const prefix = next.words.join(' ');
			const phrase = `${prefix} <${node.name}>`;
			entries.push({
				id: phrase, phrase, prefix, description: describe(next, t), descriptionKey: next.descriptionKey, icon: next.icon,
				effect: next.effect ?? 'run',
				argument: { name: node.name, resolve: node.resolve },
			});
			return;
		}
		if (node.execute) {
			const phrase = next.words.join(' ');
			entries.push({
				id: phrase, phrase, prefix: phrase, description: describe(next, t), descriptionKey: next.descriptionKey, icon: next.icon,
				effect: next.effect ?? 'run',
			});
		}
		node.children?.forEach((child) => visit(child, next));
	};

	tree.forEach((node) => visit(node, { words: [], aliases: [] }));
	const seen = new Set<string>();
	return entries.filter((entry) => !seen.has(entry.id) && Boolean(seen.add(entry.id)));
}
