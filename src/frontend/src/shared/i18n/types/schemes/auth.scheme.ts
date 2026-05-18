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
        }
        passwordVisibility: {
            show: string
            hide: string
        }
    }
}
