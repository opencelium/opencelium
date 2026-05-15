import { useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { useLoginForm } from '../model/useLoginForm'
import { useAuth } from '@features/auth/useAuth'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext.tsx'
import { FormInput } from '@shared/ui/form/FormInput'
import type { LoginFormValues } from '../model/login.schema'
import {Button} from "@shared/ui/primitives/Button";
import {Card} from "@shared/ui/primitives/Card";

export function LoginForm() {
    const { form, constraints } = useLoginForm()
    const { login } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSubmit = async (data: LoginFormValues) => {
        setError(null)
        setIsSubmitting(true)
        try {
            await login(data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Login failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', width: 320 }}
                    >
                        <FormInput name="email" label="Email" type="text" autoFocus />
                        <FormInput name="password" label="Password" type="password" />
                        {error && (
                            <span style={{ color: 'red', fontSize: 13 }}>{error}</span>
                        )}
                        <Button htmlType="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>
    )
}
