import {createContext} from "react";
import type {SystemContextValue} from "@shared/theme/types.ts";


const SystemContext = createContext<SystemContextValue | null>(null);

export default SystemContext;
