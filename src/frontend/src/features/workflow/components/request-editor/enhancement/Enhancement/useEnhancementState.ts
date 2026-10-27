import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateConnection } from '../../../../store/connection/connectionSlice';
import { updateEnhancementInConnection } from '../../../../store/connection/utils';
import type { RootState } from '../../../../store';
import type { Enhancement, Language } from '../../../../types/connection';
import {
	findFixedContainingBlock,
	isSameMaximizedGeometry,
	maximizedStyle,
} from './maximizedStyle';

export function useEnhancementState(enhancement?: Enhancement) {
	const dispatch = useDispatch();
	const connection = useSelector((state: RootState) => state.connection.connection);
	const [isMaximized, setIsMaximized] = useState(false);
	const [maximizedGeometry, setMaximizedGeometry] = useState<CSSProperties>();
	const containerRef = useRef<HTMLDivElement>(null);

	const toggleMaximized = () => setIsMaximized((current) => !current);

	// Measured in a layout effect so the first painted frame is already in place.
	// Only a window resize can move things afterwards: the maximized box covers the
	// controls that would shift the drawer or collapse the main menu.
	useLayoutEffect(() => {
		if (!isMaximized) return;
		const base = findFixedContainingBlock(containerRef.current);
		const remeasure = () =>
			setMaximizedGeometry((current) => {
				const next = maximizedStyle(base);
				return isSameMaximizedGeometry(current, next) ? current : next;
			});
		remeasure();
		window.addEventListener('resize', remeasure);
		return () => window.removeEventListener('resize', remeasure);
	}, [isMaximized]);

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
	/** Script and description in one update: two would each start from the old enhancement, and the second would undo the first. */
	const onReplaceScript = ({ script, description }: { script: string; description: string }) => {
		if (enhancement) updateEnhancement({ ...enhancement, script, description });
	};

	return {
		connection,
		isMaximized,
		maximizedStyle: maximizedGeometry,
		containerRef,
		toggleMaximized,
		onChangeLanguage,
		onChangeDescription,
		onChangeScript,
		onReplaceScript,
	};
}
