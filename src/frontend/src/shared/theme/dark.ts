import type {ThemeTokens} from "@shared/theme/tokens.ts";


export const darkTheme: ThemeTokens = {
    color: {
        text: {
            primary: '#e5e7eb',
            secondary: '#9ca3af',
            inverted: '#000000',
        },
        background: {
            app: '#0f172a',
            surface: '#111827',
            elevated: '#1f2937',
        },
        border: {
            subtle: '#1e293b',
            strong: '#334155',
        },
        action: {
            primary: '#3b82f6',
            danger: '#ef4444',
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
        sm: '0 2px 8px rgba(0,0,0,0.1)',
        md: '0 10px 30px rgba(0,0,0,0.25)',
        lg: '0 20px 60px rgba(0,0,0,0.35)',
    }
}
