import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateConnection } from '../../../../store/connection/connectionSlice';
import { updateEnhancementInConnection } from '../../../../store/connection/utils';
import type { RootState } from '../../../../store';
import type { Enhancement, Language } from '../../../../types/connection';

export function useEnhancementState(enhancement?: Enhancement) {
	const dispatch = useDispatch();
	const connection = useSelector((state: RootState) => state.connection.connection);
	const [isScriptMaximized, setIsScriptMaximized] = useState(false);
	const [maximizedStyle, setMaximizedStyle] = useState<CSSProperties>();
	const scriptBoxRef = useRef<HTMLDivElement>(null);

	const toggleScriptMaximized = () => {
		setIsScriptMaximized((current) => {
			const next = !current;
			if (next) {
				// Whichever surface the enhancement is hosted in: the method dialog's
				// modal body, or the field-binding drawer, which is not a modal at all
				// and used to leave the maximized script with no geometry.
				const body = scriptBoxRef.current
					?.closest('.ant-modal-body, .bindingDrawer') as HTMLElement | null;
				const rect = body?.getBoundingClientRect();
				setMaximizedStyle(rect ? {
					position: 'fixed', top: rect.top, left: rect.left,
					width: rect.width, height: rect.height,
				} : undefined);
			}
			return next;
		});
	};

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
