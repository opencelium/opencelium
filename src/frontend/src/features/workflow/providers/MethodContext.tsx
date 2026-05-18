import React, { createContext, useContext, type ReactNode } from "react";
import type { MethodWithId } from "../types/connection";

interface MethodContextValue {
    method: MethodWithId;
}

const MethodContext = createContext<MethodContextValue | null>(null);

export const useMethodContext = () => {
    const ctx = useContext(MethodContext);
    if (!ctx) throw new Error("useMethodContext must be used within a MethodProvider");
    return ctx;
};

interface MethodProviderProps {
    value: MethodContextValue;
    children: ReactNode; // ✅ declare children here
}

export const MethodProvider: React.FC<MethodProviderProps> = ({ value, children }) => (
    <MethodContext.Provider value={value}>{children}</MethodContext.Provider>
);
