export interface AuthSchema {
    auth: {
        fields: {
            email: {
                label: string
                placeholder: string
                required: string
                invalid: string
            }
            emailOrUsername: {
                label: string
                placeholder: string
                required: string
            }
            password: {
                label: string
                placeholder: string
                required: string
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
            sessionLoadFailed: string
        }
        forgotPassword: {
            notAvailable: string
            title: string
            description: string
            noEmailHint: string
            submit: string
            backToLogin: string
            success: string
        }
        setPassword: {
            title: string
            description: string
            submit: string
            backToLogin: string
            success: {
                message: string
                redirect: string
            }
            fields: {
                password: {
                    label: string
                    placeholder: string
                    required: string
                    minLength: string
                    maxLength: string
                    upper: string
                    lower: string
                    number: string
                    special: string
                }
                repeatPassword: {
                    label: string
                    placeholder: string
                    required: string
                    mismatch: string
                }
            }
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
