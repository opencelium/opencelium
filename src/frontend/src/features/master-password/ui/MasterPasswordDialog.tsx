import React, { useState } from 'react'
import { Card } from '@shared/ui/primitives/Card'
import { Input } from '@shared/ui/primitives/Input'
import { Button } from '@shared/ui/primitives/Button'
import { Icon } from '@shared/ui/primitives/Icon'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useCheckMasterPasswordMutation } from '@features/master-password/api/masterPasswordApi'
import { useMasterPasswordStore } from '@features/master-password/model/masterPasswordStore'
import { AsciiError } from '@features/master-password/ui/AsciiError'

type MasterPasswordInfo = { title: string; content: string }

type MasterPasswordDialogProps = {
    label?: string
    info?: MasterPasswordInfo
    onUnlock?: (masterPassword: string) => void
}

const ASCII_ONLY = /^[\x20-\x7E]*$/

export const MasterPasswordDialog: React.FC<MasterPasswordDialogProps> = ({ label, info, onUnlock }) => {
    const { t: widgetT } = useI18n('widget')
    const { t: commonT } = useI18n('common')
    const [localPassword, setLocalPassword] = useState('')
    const [error, setError] = useState<React.ReactNode>(null)
    const [checkMasterPassword, { isLoading }] = useCheckMasterPasswordMutation()
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
        try {
            await checkMasterPassword({ masterPassword: localPassword }).unwrap()
            setMasterPassword(localPassword)
            onUnlock?.(localPassword)
        } catch (e) {
            const err = e as { data?: { error?: string } }
            setError(
                widgetT(`masterPassword.error.${err.data?.error}`, {
                    defaultValue: widgetT('masterPassword.error.default'),
                }),
            )
        }
    }

    const onChange = (value: string) => {
        setError(null)
        setLocalPassword(value)
    }

    return (
        <Card style={{ width: 500 }}>
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
                        />
                        {error && (
                            <div style={{ marginTop: 4 }}>
                                <Typography variant="caption" isDanger>
                                    {error}
                                </Typography>
                            </div>
                        )}
                    </div>
                    <Button loading={isLoading} htmlType="button" onClick={check}>
                        {widgetT('masterPassword.button.label')}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
