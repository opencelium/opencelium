import React, { createContext, useContext } from 'react';
import type { FormConstraints } from './types';

const FormConstraintsContext = createContext<FormConstraints | null>(null);

export const FormConstraintsProvider: React.FC<{
    constraints: FormConstraints;
    children: React.ReactNode;
}> = ({ constraints, children }) => {
    return (
        <FormConstraintsContext.Provider value={constraints}>
            {children}
        </FormConstraintsContext.Provider>
    );
};

export function useFormConstraints() {
    const ctx = useContext(FormConstraintsContext);
    if (!ctx) {
        throw new Error(
            'useFormConstraints must be used inside FormConstraintsProvider'
        );
    }
    return ctx;
}
