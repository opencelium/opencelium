import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store as appStore } from '@app/store/store';

/**
 * Re-enters the application store for a subtree.
 *
 * The request editors render under their own per-modal store (createLegacyStore), which
 * holds only the connection reducer — no RTK Query reducer, no middleware — so a query
 * hook dispatched there silently never runs: no request is made and no error is raised.
 * Anything under here that talks to the API needs this wrapper, and anything that writes
 * back into the editor must receive its callbacks as props rather than through context,
 * so they still dispatch into the legacy store they were built against.
 */
export function AppStoreBoundary({ children }: { children: ReactNode }) {
	return <Provider store={appStore}>{children}</Provider>;
}
