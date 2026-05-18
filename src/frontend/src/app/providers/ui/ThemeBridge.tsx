import {ConfigProvider, Empty, message, theme as antdTheme} from 'antd'
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";
import {ThemeName} from "@shared/theme/types.ts";
import {createTheme, ThemeProvider} from "@mui/material";
import {useMemo} from "react";

message.config({
    top: 50,
    duration: 3,
    maxCount: 3,
});
export const ThemeBridge = ({ children }) => {
    const { theme, themeName } = useTheme()
    const isDark = themeName === ThemeName.Dark;
    const hasVar = (value?: string) => !!value

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: themeName === 'dark' ? 'dark' : 'light',

            primary: {
                main: theme.color.action.primary,
            },

            background: {
                default: theme.color.background.app,
                paper: theme.color.background.surface,
            },

            text: {
                primary: theme.color.text.primary,
                secondary: theme.color.text.secondary,
            },
        },

        shape: {
            borderRadius: theme.radius.md,
        },
    }), [theme, isDark]);

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark
                    ? antdTheme.darkAlgorithm
                    : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: hasVar(theme.color.action.primary)
                        ? theme.color.action.primary
                        : undefined,

                    borderRadius: theme.radius.md ?? undefined,
                }
            }}
        >
            <ThemeProvider theme={muiTheme}>
                {children}
            </ThemeProvider>
        </ConfigProvider>
    );
}
