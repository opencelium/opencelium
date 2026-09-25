import React from "react";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

export const LoadingOverlay: React.FC<{
    loading: boolean;
    children: React.ReactNode;
    // Merged onto the wrapper's own `position: relative` — lets a caller keep
    // a flex-item chain intact (e.g. `{ flex: 1, minHeight: 0 }`) instead of
    // the wrapper defaulting to content-sized, which would otherwise break
    // layouts where the wrapped content expects to fill its parent.
    style?: React.CSSProperties;
}> = ({ loading, children, style }) => {
    return (
        <div style={{ position: 'relative', ...style }}>
            {loading && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'color-mix(in srgb, var(--color-background-surface) 60%, transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Loading size="md" />
                </div>
            )}
            {children}
        </div>
    );
};
