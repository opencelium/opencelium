import React from "react";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

export const LoadingOverlay: React.FC<{
    loading: boolean;
    children: React.ReactNode;
}> = ({ loading, children }) => {
    return (
        <div style={{ position: 'relative' }}>
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
