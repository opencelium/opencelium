import {createContext} from "react";
import type {ThemeContextValue} from "@shared/theme/types.ts";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;
