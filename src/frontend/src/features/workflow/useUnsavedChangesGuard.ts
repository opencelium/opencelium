import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import type { Navigator } from 'react-router-dom';

/**
 * Warns before the user leaves the page while `when` is true.
 *
 * Two exit paths are covered with two mechanisms because the browser allows
 * nothing else:
 * - tab close / reload / external navigation → native `beforeunload` prompt
 *   (browsers forbid custom UI here, so `message` is not shown — the browser's
 *   own generic text is used).
 * - in-app navigation (sidebar, top bar, links, command palette) → the router
 *   `navigator.push`/`replace` are wrapped so a confirm runs first; `message`
 *   is shown there.
 *
 * Browser Back/Forward (`popstate`) is intentionally not intercepted: doing so
 * reliably requires a data router (`useBlocker`), which this app does not use.
 */
export function useUnsavedChangesGuard(when: boolean, message: string): void {
    const { navigator } = useContext(UNSAFE_NavigationContext);
    const whenRef = useRef(when);
    whenRef.current = when;
    const messageRef = useRef(message);
    messageRef.current = message;

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!whenRef.current) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        // Wrapping the router navigator's push/replace is the only way to confirm
        // every in-app navigation under a non-data <BrowserRouter> (useBlocker
        // requires a data router). The navigator is a stable singleton and React
        // Compiler is not enabled, so mutating it here is safe; the immutability
        // lint rule is suppressed only for these wrap/restore assignments.
        const target = navigator as Navigator;
        const originalPush = target.push;
        const originalReplace = target.replace;

        // eslint-disable-next-line react-hooks/immutability
        target.push = (to, state, opts) => {
            if (whenRef.current && !window.confirm(messageRef.current)) return;
            originalPush.call(target, to, state, opts);
        };
        target.replace = (to, state, opts) => {
            if (whenRef.current && !window.confirm(messageRef.current)) return;
            originalReplace.call(target, to, state, opts);
        };

        return () => {
            target.push = originalPush;
            target.replace = originalReplace;
        };
    }, [navigator]);
}
