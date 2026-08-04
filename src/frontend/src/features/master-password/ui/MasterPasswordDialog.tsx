import React, { useState } from 'react'
import { Card } from '@shared/ui/primitives/Card'
import { Input } from '@shared/ui/primitives/Input'
import { Button } from '@shared/ui/primitives/Button'
import { Icon } from '@shared/ui/primitives/Icon'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import { useMasterPasswordStore } from '@features/master-password/model/masterPasswordStore'
import { AsciiError } from '@features/master-password/ui/AsciiError'

const isApiExecutorError = (response: unknown): response is { data?: { error?: string } } =>
    !!response && typeof response === 'object' && ('status' in response || 'error' in response)

type MasterPasswordInfo = { title: string; content: string }

type MasterPasswordDialogProps = {
    label?: string
    info?: MasterPasswordInfo
    onUnlock?: (masterPassword: string) => void
    /** Render without the Card wrapper, centered — for hosting inside a modal. */
    bare?: boolean
}

const ASCII_ONLY = /^[\x20-\x7E]*$/

export const MasterPasswordDialog: React.FC<MasterPasswordDialogProps> = ({ label, info, onUnlock, bare }) => {
    const { t: widgetT } = useI18n('widget')
    const { t: commonT } = useI18n('common')
    const [localPassword, setLocalPassword] = useState('')
    const [error, setError] = useState<React.ReactNode>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { setMasterPassword } = useMasterPasswordStore()

    const resolvedLabel = label ?? widgetT('masterPassword.input.label')
    const resolvedInfo = info ?? {
        title: widgetT('masterPassword.input.info.title'),
        content: widgetT('masterPassword.input.info.content'),
    }

    const check = async () => {
        if (localPassword === '') {
            setError(commonT('field.required'))
            return
        }
        if (!ASCII_ONLY.test(localPassword)) {
            setError(<AsciiError />)
            return
        }
        setError(null)
        setIsLoading(true)
        // Routed through apiExecutor (not the RTK Query hook) because this dialog can be
        // rendered inside the workflow editor's isolated legacy redux <Provider>, which
        // doesn't mount the baseApi reducer — a hook-bound dispatch would silently fail
        // there. apiExecutor dispatches against the real app store directly.
        const response = await apiExecutor({
            url: '/connector/master-password/status',
            method: 'GET',
            options: { headers: { 'x-master-password': localPassword }, ignoreError: true },
        })
        setIsLoading(false)
        if (isApiExecutorError(response)) {
            setError(
                widgetT(`masterPassword.error.${response.data?.error}`, {
                    defaultValue: widgetT('masterPassword.error.default'),
                }),
            )
            return
        }
        setMasterPassword(localPassword)
        onUnlock?.(localPassword)
    }

    const onChange = (value: string) => {
        setError(null)
        setLocalPassword(value)
    }

    const form = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Typography variant="label" isBold>
                    {resolvedLabel}
                </Typography>
                <Tooltip content={resolvedInfo.content} placement="top">
                    <span style={{ display: 'inline-flex', cursor: 'help' }}>
                        <Icon name="info" size={14} color="secondary" isSubtle />
                    </span>
                </Tooltip>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                    <Input
                        autoFocus
                        type="password"
                        name="masterPassword"
                        value={localPassword}
                        error={!!error}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') void check()
                        }}
                        testId="master-password-input"
                    />
                    {error && (
                        <div style={{ marginTop: 4 }}>
                            <Typography variant="caption" isDanger>
                                {error}
                            </Typography>
                        </div>
                    )}
                </div>
                <Button loading={isLoading} htmlType="button" onClick={check} testId="master-password-submit">
                    {widgetT('masterPassword.button.label')}
                </Button>
            </div>
        </div>
    )

    if (bare) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    width: '100%',
                    minHeight: 250,
                }}
            >
                <div style={{ width: '100%', maxWidth: 480 }}>{form}</div>
            </div>
        )
    }

    return <Card style={{ width: 500 }}>{form}</Card>
}
