import React from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { useMasterPasswordStore } from '@features/master-password/model/masterPasswordStore'
import { MasterPasswordDialog } from '@features/master-password/ui/MasterPasswordDialog'

type MasterPasswordGateProps = {
    children: React.ReactNode
    title?: React.ReactNode
    label?: string
    info?: { title: string; content: string }
}

/**
 * Renders `children` only once a master password has been entered; otherwise
 * shows the unlock prompt. Reuse to put any sensitive view behind the master
 * password (connector credentials, system configuration, …).
 */
export const MasterPasswordGate: React.FC<MasterPasswordGateProps> = ({ children, title, label, info }) => {
    const { masterPassword } = useMasterPasswordStore()

    if (masterPassword) {
        return <>{children}</>
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                minHeight: 320,
                padding: 24,
            }}
        >
            {title && (
                <Typography variant="subtitle" isSubtle>
                    {title}
                </Typography>
            )}
            <MasterPasswordDialog label={label} info={info} />
        </div>
    )
}
