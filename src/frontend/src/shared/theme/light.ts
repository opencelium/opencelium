import type {ThemeTokens} from "@shared/theme/tokens.ts";

export const lightTheme: ThemeTokens = {
    color: {
        text: {
            primary: '#1a1a1a',
            secondary: '#5f6368',
            inverted: '#ffffff',
            onAction: '#ffffff'
        },
        background: {
            app: '#f5f6f8',
            surface: '#ffffff',
            elevated: '#ffffff',
        },
        border: {
            subtle: '#e0e0e0',
            strong: '#c4c4c4',
        },
        action: {
            primary: '#2563eb',
            primaryHover: '#1d4ed8',
            danger: '#dc2626',
        },
    },

    typography: {
        fontFamily: {
            body: 'Inter, system-ui, sans-serif',
            mono: 'JetBrains Mono, monospace',
        },
        fontSize: {
            sm: '12px',
            md: '14px',
            lg: '18px',
        },
        fontWeight: {
            regular: 400,
            medium: 500,
            bold: 600,
        },
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
    },

    radius: {
        sm: 4,
        md: 8,
        lg: 12,
    },
    shadow: {
        sm: '0 10px 30px rgba(0,0,0,0.15)',
        md: '0 10px 30px rgba(0,0,0,0.25)',
        lg: '0 10px 30px rgba(0,0,0,0.35)',
    }
}
