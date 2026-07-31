import {useContext} from "react";
import ThemeContext from "@shared/theme/context/ThemeContext.tsx";


export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('ThemeProvider is missing');
    return ctx;
};
