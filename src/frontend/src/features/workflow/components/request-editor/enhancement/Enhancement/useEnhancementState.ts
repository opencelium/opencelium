import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateConnection } from '../../../../store/connection/connectionSlice';
import { updateEnhancementInConnection } from '../../../../store/connection/utils';
import type { RootState } from '../../../../store';
import type { Enhancement, Language } from '../../../../types/connection';
import { isSameMaximizedGeometry, maximizedScriptStyle, resolveMaximizedScriptTargets }
	from './maximizedScriptStyle';

export function useEnhancementState(enhancement?: Enhancement) {
	const dispatch = useDispatch();
	const connection = useSelector((state: RootState) => state.connection.connection);
	const [isScriptMaximized, setIsScriptMaximized] = useState(false);
	const [maximizedStyle, setMaximizedStyle] = useState<CSSProperties>();
	const scriptBoxRef = useRef<HTMLDivElement>(null);

	const toggleScriptMaximized = () => setIsScriptMaximized((current) => !current);

	// Whichever surface the enhancement is hosted in: the method dialog's modal
	// body, or the field-binding drawer, which is not a modal at all and whose own
	// transform decides where a `position: fixed` box lands. Measured in a layout
	// effect so the first painted frame is already positioned, and re-measured
	// from the surface itself rather than from a window resize: collapsing the
	// app's main menu changes the page's width with no resize event to hear.
	useLayoutEffect(() => {
		if (!isScriptMaximized) return;
		const targets = resolveMaximizedScriptTargets(scriptBoxRef.current);
		if (!targets) return;
		const remeasure = () => setMaximizedStyle((current) => {
			const next = maximizedScriptStyle(targets);
			return isSameMaximizedGeometry(current, next) ? current : next;
		});
		remeasure();
		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', remeasure);
			return () => window.removeEventListener('resize', remeasure);
		}
		const observer = new ResizeObserver(remeasure);
		observer.observe(targets.surface);
		if (targets.base) observer.observe(targets.base);
		return () => observer.disconnect();
	}, [isScriptMaximized]);

	const updateEnhancement = (nextEnhancement: Enhancement) => {
		if (!connection) return;
		dispatch(updateConnection(updateEnhancementInConnection(connection, { ...nextEnhancement })));
	};

	const onChangeLanguage = (language: Language) => {
		if (enhancement) updateEnhancement({ ...enhancement, language });
	};
	const onChangeDescription = (description: string) => {
		if (enhancement) updateEnhancement({ ...enhancement, description });
	};
	const onChangeScript = (script: string) => {
		if (enhancement) updateEnhancement({ ...enhancement, script });
	};

	return {
		connection, isScriptMaximized, maximizedStyle, scriptBoxRef,
		toggleScriptMaximized, onChangeLanguage, onChangeDescription, onChangeScript,
	};
}
