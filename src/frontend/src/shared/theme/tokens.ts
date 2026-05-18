export type ThemeTokens = {
    color: {
        text: {
            primary: string
            secondary: string
            inverted: string
            onAction: string
        }
        background: {
            app: string
            surface: string
            elevated: string
            page: string
        }
        border: {
            subtle: string
            strong: string
            default: string
        }
        action: {
            primary: string
            primaryHover: string
            secondary: string
            danger: string
        }
    }

    typography: {
        fontFamily: {
            body: string
            mono: string
        }
        fontSize: {
            sm: string
            md: string
            lg: string
        }
        fontWeight: {
            regular: number
            medium: number
            bold: number
        }
    }

    spacing: {
        xs: number
        sm: number
        md: number
        lg: number
    }

    radius: {
        sm: number
        md: number
        lg: number
    }
    shadow: {
        sm: string
        md: string
        lg: string
    }
}
