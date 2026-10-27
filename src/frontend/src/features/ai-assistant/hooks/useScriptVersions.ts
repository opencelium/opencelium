import { useState } from 'react';
import type { ScriptSnapshot } from '../utils/scriptVersions.utils';

export type ScriptVersion = ScriptSnapshot & {
	id: number;
	savedAt: number;
	reason: { kind: 'before-ai'; prompt: string } | { kind: 'before-restore' };
};

/** What the comparison panel shows next to the editor until it is applied or discarded. */
export type ScriptCandidate =
	| (ScriptSnapshot & { kind: 'generated'; prompt: string; problems: string[] })
	| (ScriptSnapshot & { kind: 'version'; versionId: number });

type Entry = { candidate: ScriptCandidate | null; versions: ScriptVersion[] };

const MAX_VERSIONS = 10;
const EMPTY: Entry = { candidate: null, versions: [] };

/**
 * Earlier scripts of each transformation and the candidate being compared, kept in memory while the method dialog is
 * open: saving the method is the real commit point, and Cancel there already discards everything.
 * Every replace records what it replaced, so a restore can itself be undone.
 */
export function useScriptVersions(enhanceId: string | undefined) {
	const [entries, setEntries] = useState<Record<string, Entry>>({});
	const [nextId, setNextId] = useState(1);
	const entry = (enhanceId && entries[enhanceId]) || EMPTY;

	const change = (update: (current: Entry) => Entry) => {
		if (!enhanceId) return;
		setEntries((all) => ({ ...all, [enhanceId]: update(all[enhanceId] ?? EMPTY) }));
	};
	const remember = (current: Entry, saved: ScriptSnapshot, reason: ScriptVersion['reason']): Entry => ({
		...current,
		versions: [{ ...saved, id: nextId, savedAt: Date.now(), reason }, ...current.versions].slice(0, MAX_VERSIONS),
	});

	const propose = (candidate: ScriptCandidate) => change((current) => ({ ...current, candidate }));
	const discard = () => change((current) => ({ ...current, candidate: null }));
	const showVersion = (id: number) => {
		const version = entry.versions.find((candidate) => candidate.id === id);
		if (version) propose({ kind: 'version', versionId: id, script: version.script, description: version.description });
	};

	/** Takes an earlier version back; what the editor holds now becomes a version in its place. */
	const restore = (id: number, current: ScriptSnapshot): ScriptSnapshot | undefined => {
		const version = entry.versions.find((candidate) => candidate.id === id);
		if (!version) return undefined;
		setNextId((value) => value + 1);
		change((state) => ({
			...remember({ ...state, versions: state.versions.filter((candidate) => candidate.id !== id) }, current, {
				kind: 'before-restore',
			}),
			candidate: null,
		}));
		return { script: version.script, description: version.description };
	};

	/**
	 * Writes a generated script, keeping what it replaces (the default script too: it is what "undo" should bring back).
	 * Works for the candidate and for a script written without one, as for an untouched editor.
	 */
	const applyGenerated = (
		current: ScriptSnapshot,
		generated: Pick<ScriptCandidate, 'script' | 'description'> & { prompt: string },
	): ScriptSnapshot => {
		const isChange = current.script.trim() !== generated.script.trim();
		if (isChange) setNextId((value) => value + 1);
		change((state) => ({
			...(isChange ? remember(state, current, { kind: 'before-ai', prompt: generated.prompt }) : state),
			candidate: null,
		}));
		return { script: generated.script, description: current.description || generated.description };
	};

	/** The script and description to write for the candidate. */
	const accept = (current: ScriptSnapshot): ScriptSnapshot | undefined => {
		const { candidate } = entry;
		if (!candidate) return undefined;
		return candidate.kind === 'version' ? restore(candidate.versionId, current) : applyGenerated(current, candidate);
	};

	const undo = (current: ScriptSnapshot) => {
		const [latest] = entry.versions;
		return latest ? restore(latest.id, current) : undefined;
	};

	return { candidate: entry.candidate, versions: entry.versions, propose, discard, showVersion, accept, applyGenerated, undo };
}

export type ScriptVersions = ReturnType<typeof useScriptVersions>;
