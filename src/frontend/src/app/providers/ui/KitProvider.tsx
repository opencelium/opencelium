import React, { useState } from 'react';
import SystemContext from "@shared/theme/context/SystemContext.tsx";
import type {UISystem} from "@shared/theme/types.ts";

export const KitProvider: React.FC<{
    initialSystem: UISystem;
    children: React.ReactNode;
}> = ({ initialSystem, children }) => {
    const [system, setSystem] = useState<UISystem>(initialSystem);

    return (
        <SystemContext.Provider value={{ system, setSystem }}>
            {children}
        </SystemContext.Provider>
    );
};
