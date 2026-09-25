import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import type { Navigator } from 'react-router-dom';

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
        const target = navigator as Navigator;
        const originalPush = target.push;
        const originalReplace = target.replace;

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
