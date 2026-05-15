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
                        background: 'rgba(255,255,255,0.6)',
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
