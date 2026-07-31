import {useContext} from "react";
import SystemContext from "@shared/theme/context/SystemContext.tsx";

export const useUISystem = () => {
    const ctx = useContext(SystemContext);
    if (!ctx) throw new Error('SystemProvider missing');
    return ctx;
};
