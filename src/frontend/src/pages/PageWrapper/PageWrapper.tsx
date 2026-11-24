import type { ReactNode } from 'react';
import ResettableRoute from "@app/router/wrappers/ResettableRoute.tsx";

const PageWrapper = ({ children, resetOnNavigation = true }: { children: ReactNode; resetOnNavigation?: boolean }) => {
    if (!resetOnNavigation) return <>{children}</>;

    return (
        <ResettableRoute>
            {children}
        </ResettableRoute>
    )
}

export default PageWrapper;
