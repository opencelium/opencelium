import type {ReactNode} from "react";
import {ErrorBoundary} from "@shared/errors/boundary/ErrorBoundary.tsx";
import {WidgetCrash} from "@shared/ui/feedback/crash/WidgetCrash.tsx";

type Props = {
    children: ReactNode
}

// Isolates a single dashboard card: if it throws, only this slot shows the
// widget crash message (with a retry) — the rest of the dashboard stays alive.
export function DashboardCardBoundary({children}: Props) {
    return (
        <ErrorBoundary scope="widget" fallback={(props) => <WidgetCrash {...props} />}>
            {children}
        </ErrorBoundary>
    )
}
