import { useContext, useEffect } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";

export function useBlockNavigation(shouldBlock: boolean, confirmText?: string) {

    const { navigator } = useContext(UNSAFE_NavigationContext) as any;

    useEffect(() => {

        if (!shouldBlock) return;

        const push = navigator.push;

        navigator.push = (...args: any[]) => {

            const confirmLeave = window.confirm(
                confirmText || "You have unsaved changes. Are you sure you want to leave?"
            );

            if (confirmLeave) {
                push(...args);
            }
        };

        return () => {
            navigator.push = push;
        };

    }, [navigator, shouldBlock]);
}
