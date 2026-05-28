export interface AuthSchema {
    auth: {
        fields: {
            email: {
                label: string
                placeholder: string
                required: string
                invalid: string
            }
            password: {
                label: string
                placeholder: string
                required: string
            }
            rememberMe: {
                label: string
            }
        }
        actions: {
            signIn: string
            signingIn: string
            forgotPassword: string
        }
        errors: {
            failed: string
            invalidCredentials: string
            network: string
        }
        forgotPassword: {
            notAvailable: string
            title: string
            description: string
            submit: string
            backToLogin: string
            success: string
        }
        passwordVisibility: {
            show: string
            hide: string
        }
        totp: {
            title: string
            hint: string
            verifyHint: string
            or: string
            qrAlt: string
            codeLabel: string
            codePlaceholder: string
            submit: string
            errors: {
                required: string
                invalidCode: string
            }
        }
    }
}
