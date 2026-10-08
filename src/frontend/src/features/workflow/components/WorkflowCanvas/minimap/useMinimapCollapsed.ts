import { useCallback, useState } from 'react';

const STORAGE_KEY = 'oc_workflow_minimap_collapsed';

const read = () => {
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch {
		return false;
	}
};

/** Remembered per browser: a user who folds the card away once should not have to on every workflow. */
export const useMinimapCollapsed = () => {
	const [isCollapsed, setCollapsed] = useState(read);
	const toggle = useCallback(() => setCollapsed((current) => {
		const next = !current;
		try {
			localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
		} catch {
			// Storage can be unavailable (private mode); the toggle still works for this session.
		}
		return next;
	}), []);
	return { isCollapsed, toggle };
};
