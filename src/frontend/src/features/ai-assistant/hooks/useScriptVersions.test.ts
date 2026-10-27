import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useScriptVersions } from './useScriptVersions';

const old = { script: 'RESULT_VAR = VAR_0.trim();', description: 'Trim' };
const generated = { kind: 'generated' as const, prompt: 'uppercase', script: 'RESULT_VAR = VAR_0.toUpperCase();', description: 'Upper', problems: [] };

describe('useScriptVersions', () => {
	it('keeps the replaced script as a version and restores it', () => {
		const { result } = renderHook(() => useScriptVersions('e1'));
		act(() => result.current.propose(generated));
		let applied: ReturnType<typeof result.current.accept>;
		act(() => {
			applied = result.current.accept(old);
		});
		expect(applied!).toEqual({ script: generated.script, description: 'Trim' });
		expect(result.current.candidate).toBeNull();
		expect(result.current.versions).toMatchObject([{ ...old, reason: { kind: 'before-ai', prompt: 'uppercase' } }]);

		let restored: ReturnType<typeof result.current.undo>;
		act(() => {
			restored = result.current.undo(applied!);
		});
		expect(restored!).toEqual(old);
		expect(result.current.versions).toMatchObject([{ script: generated.script, reason: { kind: 'before-restore' } }]);
	});

	it('takes the generated description only when the script had none', () => {
		const { result } = renderHook(() => useScriptVersions('e1'));
		act(() => result.current.propose(generated));
		let applied: ReturnType<typeof result.current.accept>;
		act(() => {
			applied = result.current.accept({ ...old, description: '' });
		});
		expect(applied!.description).toBe('Upper');
	});

	it('keeps the default script too, but not a script the answer leaves unchanged', () => {
		const { result } = renderHook(() => useScriptVersions('e1'));
		act(() => {
			result.current.applyGenerated({ script: 'RESULT_VAR = VAR_0', description: '' }, generated);
		});
		expect(result.current.versions).toMatchObject([{ script: 'RESULT_VAR = VAR_0' }]);
		act(() => {
			result.current.applyGenerated({ script: generated.script, description: '' }, generated);
		});
		expect(result.current.versions).toHaveLength(1);
	});

	it('shows a version as the candidate and keeps history per transformation', () => {
		const { result, rerender } = renderHook(({ id }) => useScriptVersions(id), { initialProps: { id: 'e1' } });
		act(() => result.current.propose(generated));
		act(() => {
			result.current.accept(old);
		});
		const [version] = result.current.versions;
		act(() => result.current.showVersion(version!.id));
		expect(result.current.candidate).toMatchObject({ kind: 'version', script: old.script });
		rerender({ id: 'e2' });
		expect(result.current.versions).toEqual([]);
		rerender({ id: 'e1' });
		expect(result.current.versions).toHaveLength(1);
	});
});
