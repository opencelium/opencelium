import {ConfigProvider, message, theme as antdTheme} from 'antd'
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";
import {createTheme, ThemeProvider} from "@mui/material";
import {useMemo} from "react";

message.config({
    top: 50,
    duration: 3,
    maxCount: 3,
});
export const ThemeBridge = ({ children }) => {
    const { theme, themeMode } = useTheme()
    const isDark = themeMode === 'dark';

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: themeMode,

            primary: {
                main: theme.color.action.primary,
            },
            secondary: {
                main: theme.color.action.secondary,
            },
            success: {
                main: theme.color.status.success.fg,
            },
            warning: {
                main: theme.color.status.warning.fg,
            },
            error: {
                main: theme.color.status.error.fg,
            },
            info: {
                main: theme.color.status.info.fg,
            },

            background: {
                default: theme.color.background.app,
                paper: theme.color.background.surface,
            },

            text: {
                primary: theme.color.text.primary,
                secondary: theme.color.text.secondary,
                disabled: theme.color.text.disabled,
            },

            divider: theme.color.border.default,
        },

        typography: {
            fontFamily: theme.typography.fontFamily.body,
        },

        shape: {
            borderRadius: theme.radius.md,
        },
    }), [theme, themeMode]);

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark
                    ? antdTheme.darkAlgorithm
                    : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: theme.color.action.primary,
                    colorSuccess: theme.color.status.success.fg,
                    colorWarning: theme.color.status.warning.fg,
                    colorError: theme.color.status.error.fg,
                    colorInfo: theme.color.status.info.fg,
                    colorLink: theme.color.action.primary,

                    colorBgLayout: theme.color.background.app,
                    colorBgContainer: theme.color.background.surface,
                    colorBgElevated: theme.color.background.elevated,

                    colorText: theme.color.text.primary,
                    colorTextSecondary: theme.color.text.secondary,
                    colorTextDisabled: theme.color.text.disabled,

                    colorBorder: theme.color.border.default,
                    colorBorderSecondary: theme.color.border.subtle,

                    fontFamily: theme.typography.fontFamily.body,
                    borderRadius: theme.radius.md,
                }
            }}
        >
            <ThemeProvider theme={muiTheme}>
                {children}
            </ThemeProvider>
        </ConfigProvider>
    );
}
