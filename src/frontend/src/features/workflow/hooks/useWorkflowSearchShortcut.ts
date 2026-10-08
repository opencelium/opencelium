import { useEffect } from 'react';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	disabled: boolean;
	onOpenSearch: () => void;
};

export const useWorkflowSearchShortcut = ({ disabled, onOpenSearch }: Params) => {
	useEffect(() => {
		const handleSearch = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey ||
				event.key.toLowerCase() !== 'f') return;
			const target = event.target as Element | null;
			if (target?.closest?.(EDITABLE_TARGET_SELECTOR) || disabled) return;
			event.preventDefault();
			onOpenSearch();
		};
		window.addEventListener('keydown', handleSearch);
		return () => window.removeEventListener('keydown', handleSearch);
	}, [disabled, onOpenSearch]);
};
