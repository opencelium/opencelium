import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import type { Navigator } from 'react-router-dom';

/**
 * Guards leaving the workflow page while a test run is in progress.
 *
 * Three exit paths, three mechanisms (the browser allows nothing else):
 * - tab close / reload → native `beforeunload` prompt (browsers forbid custom UI
 *   and async work here, so this only asks "leave?"). If the user confirms the
 *   leave, `pagehide` fires for a *real* unload (`persisted === false`) and
 *   `onHardLeave` runs a best-effort, fire-and-forget terminate (a keepalive
 *   request that outlives the document).
 * - in-app navigation (sidebar, top bar, links, command palette) → `navigator`
 *   `push`/`replace` are wrapped. The synchronous navigation is deferred while
 *   `onConfirmLeave` asks for confirmation and (on yes) terminates the test;
 *   only then is the original navigation replayed.
 *
 * bfcache: when the page is frozen into the back-forward cache (`pagehide` with
 * `persisted === true`) the run is NOT terminated — the page may be restored.
 * On restore (`pageshow` with `persisted === true`) the document is stale (frozen
 * React state, reset user activation, "consumed" beforeunload), which is why the
 * prompt only worked once; we reload to get a clean, correctly-armed page (and
 * re-run the orphan-resume, which re-attaches to a still-running test).
 *
 * Browser Back/Forward (`popstate`) is intentionally not intercepted: doing so
 * reliably requires a data router (`useBlocker`), which this app does not use.
 */
export function useTestRunLeaveGuard(
    when: boolean,
    onConfirmLeave: () => Promise<boolean>,
    onHardLeave: () => void,
): void {
    const { navigator } = useContext(UNSAFE_NavigationContext);
    const whenRef = useRef(when);
    whenRef.current = when;
    const onConfirmRef = useRef(onConfirmLeave);
    onConfirmRef.current = onConfirmLeave;
    const onHardLeaveRef = useRef(onHardLeave);
    onHardLeaveRef.current = onHardLeave;

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!whenRef.current) return;
            // Triggers the native "Leave site?" prompt. Both lines are needed for
            // cross-browser coverage (preventDefault for modern, returnValue legacy).
            event.preventDefault();
            event.returnValue = '';
        };
        // pagehide on a real unload (persisted === false) means the user confirmed
        // leaving — best-effort terminate. A persisted (bfcache) freeze is left
        // alone: the page may be restored, and the run with it.
        const handlePageHide = (event: PageTransitionEvent) => {
            if (event.persisted) return;
            if (!whenRef.current) return;
            onHardLeaveRef.current();
        };
        // Restored from bfcache: the frozen document can't re-arm beforeunload or
        // re-sync with the backend, so reload for a clean state.
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) window.location.reload();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    useEffect(() => {
        // Wrapping the router navigator's push/replace is the only way to gate
        // in-app navigation under a non-data <BrowserRouter> (useBlocker needs a
        // data router). The navigator is a stable singleton and React Compiler is
        // not enabled, so mutating it here is safe; the immutability lint rule is
        // suppressed only for these wrap/restore assignments.
        const target = navigator as Navigator;
        const originalPush = target.push;
        const originalReplace = target.replace;

        const guard = (
            original: Navigator['push'] | Navigator['replace'],
            args: Parameters<Navigator['push']>,
        ) => {
            if (!whenRef.current) {
                original.apply(target, args);
                return;
            }
            // Defer navigation: confirm + terminate run async, then replay it.
            void onConfirmRef.current().then((proceed) => {
                if (proceed) original.apply(target, args);
            });
        };

        // eslint-disable-next-line react-hooks/immutability
        target.push = (...args) => guard(originalPush, args);
        target.replace = (...args) => guard(originalReplace, args);

        return () => {
            target.push = originalPush;
            target.replace = originalReplace;
        };
    }, [navigator]);
}
