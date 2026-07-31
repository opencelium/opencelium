export type StatusTokens = {
    fg: string
    bg: string
    border: string
}

export type SidebarTokens = {
    bg: string
    fg: string
    fgSubtle: string
    hover: string
    selectedBg: string
    selectedFg: string
    border: string
}

export type ThemeTokens = {
    color: {
        text: {
            primary: string
            secondary: string
            disabled: string
            inverted: string
            onAction: string
        }
        background: {
            app: string
            page: string
            surface: string
            elevated: string
            /** Fill for form controls (inputs, selects, pickers); kept distinct from surface so fields don't melt into cards. */
            input: string
            hover: string
            disabled: string
        }
        border: {
            subtle: string
            default: string
            strong: string
        }
        action: {
            primary: string
            primaryHover: string
            primaryActive: string
            primarySubtle: string
            secondary: string
            danger: string
            dangerHover: string
        }
        status: {
            success: StatusTokens
            warning: StatusTokens
            error: StatusTokens
            info: StatusTokens
        }
        sidebar: SidebarTokens
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
